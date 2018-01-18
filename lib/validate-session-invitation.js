const async = require('async');
const _ = require('lodash');

function validateSessionInvitation(args, callback) {
  const seneca = this;
  const user = args.user;
  const locality = args.locality || 'en_US';
  const plugin = args.role;
  const invitation = args.invitation;
  if (!invitation) return callback(null, { ok: false, why: 'args.invitation is empty' });
  const ticketId = invitation.ticketId;
  const invitedUserId = invitation.userId;
  async.waterfall([
    validateRequest,
    createApplication,
  ], (err, res) => {
    if (err) return callback(null, { ok: false, why: err.message });
    return callback(null, { ok: true });
  });

  function validateRequest(done) {
    seneca.act({ role: plugin, cmd: 'loadTicket', id: ticketId }, (err, ticket) => {
      if (err) return done(err);
      if (!ticket.invites || _.isEmpty(ticket.invites)) return done(new Error('No invites found'));
      const invitedUserFound = _.find(ticket.invites, (invite) => {
        return invite.userId === invitedUserId;
      });
      if (!invitedUserFound) return done(new Error('Invalid session invitation.'));
      return done(null, ticket);
    });
  }

  function createApplication(ticket, cb) {
    const application = {
      sessionId: ticket.sessionId,
      ticketName: ticket.name,
      ticketType: ticket.type,
      ticketId: ticket.id,
      userId: invitedUserId,
      status: 'approved',
      emailSubject: invitation.emailSubject,
    };

    async.waterfall([loadSession, loadEvent, saveApplication], cb);

    function loadSession(done) {
      seneca.act({ role: plugin, cmd: 'loadSession', id: ticket.sessionId }, done);
    }

    function loadEvent(session, done) {
      seneca.act({ role: plugin, cmd: 'getEvent', id: session.eventId }, (err, event) => {
        if (err) return done(err);
        application.eventId = event.id;
        application.dojoId = event.dojoId;
        return done(null, event);
      });
    }

    function saveApplication(event, done) {
      const applications = [application];
      seneca.act({
        role: plugin,
        cmd: 'bulkApplyApplications',
        applications,
        user,
        locality,
      }, done);
    }
  }
}

module.exports = validateSessionInvitation;
