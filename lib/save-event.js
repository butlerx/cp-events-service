const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const sanitizeHtml = require('sanitize-html');

module.exports = function saveEventFn(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/events';
  const so = seneca.options;

  const eventInfo = args.eventInfo;
  const plugin = args.role;
  const locality = args.locality || 'en_US';
  const protocol = process.env.PROTOCOL || 'http';
  const zenHostname = process.env.HOSTNAME || '127.0.0.1:8000';
  const user = args.user;
  const eventDateFormat = 'Do MMMM YY';
  let emailSubject;
  let eventSaved;

  async.waterfall([
    saveEvent,
    saveSessions,
    removeDeletedTickets,
    emailInvitedMembers,
  ], (err, res) => {
    if (err) return callback(null, { ok: false, why: err.message });
    return callback(null, eventSaved);
  });

  function saveEvent(done) {
    if (eventInfo.sessions && eventInfo.sessions.length > 20) {
      return callback(new Error('You can only create a max of 20 sessions/rooms'));
    }
    const maxTicketTypesExceeded = _.find(
      eventInfo.sessions,
      session => session.tickets.length > 20,
    );
    if (maxTicketTypesExceeded) {
      return callback(new Error('You can only create a max of 20 ticket types'));
    }

    // Why on hell.
    const newEvent = {
      address: eventInfo.address,
      city: eventInfo.city,
      country: eventInfo.country,
      createdAt: new Date(),
      createdBy: eventInfo.userId,
      description: sanitizeHtml(eventInfo.description, so.sanitizeTextArea),
      dojoId: eventInfo.dojoId,
      name: sanitizeHtml(eventInfo.name),
      position: eventInfo.position,
      public: eventInfo.public,
      status: eventInfo.status,
      type: eventInfo.type,
      useDojoAddress: eventInfo.useDojoAddress || false, // Backward compat : set it as false
      recurringType: eventInfo.recurringType,
      ticketApproval: eventInfo.ticketApproval,
      notifyOnApplicant: eventInfo.notifyOnApplicant,
    };

    if (eventInfo.id) {
      // Check if this is an update.
      newEvent.id = eventInfo.id;
    }
    if (!eventInfo.dates || !Array.isArray(eventInfo.dates)) {
      const err = new Error('Dates must be specified');
      return done(err);
    }
    if (eventInfo.eventbriteId && eventInfo.eventbriteUrl) {
      newEvent.eventbriteId = eventInfo.eventbriteId;
      newEvent.eventbriteUrl = eventInfo.eventbriteUrl;
    }
    const pastDateFound = _.find(
      eventInfo.dates,
      date =>
        moment
          .utc(date.startTime)
          .subtract(moment().utcOffset(), 'minutes')
          .diff(moment.utc(), 'minutes') < 0,
    );

    if (pastDateFound && !eventInfo.id) return done(new Error('Past events cannot be created'));
    if (pastDateFound && eventInfo.id) return done(new Error('Past events cannot be edited'));

    newEvent.dates = eventInfo.dates;

    if (eventInfo.emailSubject) {
      emailSubject = eventInfo.emailSubject;
      delete eventInfo.emailSubject;
    }

    const eventEntity = seneca.make$(ENTITY_NS);
    eventEntity.save$(newEvent, done);
  }

  function saveSessions(event, done) {
    eventSaved = event;
    if (_.isEmpty(eventInfo.sessions)) {
      return setImmediate(() => done(null, event));
    }
    function removeDeletedSessions(cb) {
      seneca.act({
        role: plugin,
        cmd: 'searchSessions',
        query: { eventId: event.id },
      }, (err, existingSessions) => {
        if (err) return done(err);
        async.each(existingSessions, (existingSession, eCb) => {
          const sessionFound = _.find(
            eventInfo.sessions,
            session => existingSession.id === session.id,
          );
          // The whole section has been deleted but the event is still up
          if (!sessionFound) {
            return seneca.act({
              role: plugin,
              cmd: 'cancelSession',
              session: existingSession,
              locality,
              user,
            }, eCb);
          }
          return eCb();
        }, cb);
      });
    }

    function saveNewSessions(saveDone) {
      async.map(eventInfo.sessions, (session, cb) => {
        session.eventId = event.id;
        if (event.status === 'cancelled') {
          session.emailSubject = emailSubject;
          seneca.act({
            role: plugin,
            cmd: 'cancelSession',
            session,
            locality,
            user,
          }, cb);
        } else {
          session.eventId = event.id;
          session.status = 'active';
          const sessionToSave = _.clone(session);
          delete sessionToSave.tickets;
          seneca.act({
            role: plugin,
            cmd: 'saveSession',
            session: sessionToSave,
          }, (err, savedSession) => {
            if (err) return cb(err);
            async.each(session.tickets, (ticket, eCb) => {
              ticket.sessionId = savedSession.id;
              seneca.act({ role: plugin, cmd: 'saveTicket', ticket }, eCb);
            }, (error) => {
              if (error) return cb(error);
              return cb(null, savedSession);
            });
          });
        }
      }, saveDone);
    }

    async.series([removeDeletedSessions, saveNewSessions], done);
  }

  function removeDeletedTickets(sessionsRaw, done) {
    const sessions = _.chain(sessionsRaw)
      .compact()
      .flatten()
      .value();
    async.each(sessions, (savedSession, cb) => {
      if (!savedSession) return setImmediate(cb);
      seneca.act({
        role: plugin,
        cmd: 'searchSessions',
        query: { id: savedSession.id },
      }, (err, sessionsSearched) => {
        if (err) return cb(err);
        const session = sessionsSearched[0];
        async.each(session.tickets, (existingTicket, ecb) => {
          const ticketFound = _.find(eventInfo.sessions, ({ tickets }) =>
            _.find(tickets, ticket => (ticket.id ? existingTicket.id === ticket.id : true)));
          if (!ticketFound) {
            existingTicket.deleted = 1;
            return seneca.act({
              role: plugin,
              cmd: 'saveTicket',
              ticket: existingTicket,
            }, ecb);
          }
          return ecb();
        }, cb);
      });
    }, (err) => {
      if (err) return done(err);
      return done(null, sessions);
    });
  }

  function emailInvitedMembers(sessions, done) {
    if (eventInfo.status !== 'published') {
      return setImmediate(() => done(null, eventSaved));
    }
    if (_.isEmpty(sessions)) {
      return setImmediate(() => done(null, eventSaved));
    }
    process.nextTick(() => {
      async.each(sessions, (sesh, cb) => {
        seneca.act({
          role: plugin,
          cmd: 'searchSessions',
          query: { id: sesh.id },
        }, (err, sessionsSearched) => {
          if (err) return cb(err);
          const session = sessionsSearched[0];
          async.each(session.tickets, (ticket, ecb) => {
            if (ticket.deleted === 1) return ecb();
            if (_.isEmpty(ticket.invites)) return ecb();
            async.eachSeries(ticket.invites, (invite, escb) => {
              if (invite.userNotified) return escb();
              return emailInvitedUser(session, ticket, invite, escb);
            }, ecb);
          }, cb);
        });
      });

      function emailInvitedUser(session, ticket, invite, emailInvitedCb) {
        function sendEmail(sendCb) {
          seneca.act({
            role: 'cd-profiles',
            cmd: 'list',
            query: { userId: invite.userId },
          }, (err, userProfiles) => {
            if (err) return sendCb(err);
            const profile = userProfiles[0];
            seneca.act({
              role: 'cd-dojos',
              cmd: 'load',
              id: eventSaved.dojoId,
            }, (error, dojo) => {
              if (error) return sendCb(error);
              let eventDate;
              const firstDate = _.first(eventSaved.dates);
              const lastDate = _.last(eventSaved.dates);
              const startTime = moment.utc(firstDate.startTime).format('HH:mm');
              const endTime = moment.utc(firstDate.endTime).format('HH:mm');
              if (eventSaved.type === 'recurring') {
                eventDate = `${moment
                  .utc(firstDate.startTime)
                  .format(eventDateFormat)} - ${moment
                  .utc(lastDate.startTime)
                  .format(eventDateFormat)} ${startTime} - ${endTime}`;
              } else {
                eventDate = `${moment
                  .utc(firstDate.startTime)
                  .format(eventDateFormat)} ${startTime} - ${endTime}`;
              }

              const payload = {
                to: profile.email || null,
                replyTo: dojo.email || null,
                code: 'invited-to-session-',
                subject: 'You have been invited to a Dojo session',
                locality,
                content: {
                  applicantName: profile.name,
                  event: eventSaved,
                  dojo,
                  sessionName: session.name,
                  ticket,
                  eventDate,
                  inviteLink: `${protocol}://${zenHostname}/dashboard/accept_session_invitation/${
                    ticket.id
                  }/${invite.userId}`,
                },
              };

              if (!profile.email) return emailParents(sendCb);
              seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, (sendErr, res) => {
                if (sendErr) return sendCb(sendErr);
                return emailParents(sendCb);
              });

              function emailParents(emailCb) {
                if (_.isEmpty(profile.parents)) return emailCb();
                const parentsEmailed = [];
                async.eachSeries(profile.parents, (parent, cb) => {
                  if (!_.isObject(parent)) {
                    seneca.act({
                      role: 'cd-users',
                      cmd: 'load',
                      id: parent,
                      user,
                    }, (loadErr, parentUser) => {
                      if (loadErr) return cb(loadErr);
                      payload.to = parentUser.email;
                      if (
                        !_.contains(parentsEmailed, payload.to) &&
                        payload.to !== profile.email
                      ) {
                        parentsEmailed.push(payload.to);
                        seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, cb);
                      } else {
                        return cb();
                      }
                    });
                  } else {
                    payload.to = parent.email;
                    if (
                      !_.contains(parentsEmailed, payload.to) &&
                      payload.to !== profile.email
                    ) {
                      parentsEmailed.push(payload.to);
                      seneca.act({ role: 'cd-dojos', cmd: 'send_email', payload }, cb);
                    } else {
                      return cb();
                    }
                  }
                }, emailCb);
              }
            });
          });
        }

        function updateInvite(cb) {
          let invites = ticket.invites;
          const updatedInvite = {
            userId: invite.userId,
            userNotified: true,
          };
          invites = _.without(invites, _.findWhere(invites, { userId: invite.userId }));
          invites.push(updatedInvite);
          ticket.invites = invites;
          seneca.act({ role: plugin, cmd: 'saveTicket', ticket }, cb);
        }

        async.series([sendEmail, updateInvite], emailInvitedCb);
      }
    });
    return done(null, eventSaved);
  }
};
