const _ = require('lodash');

module.exports = function isParentOfInvitedFn(args, cb) {
  const seneca = this;
  const invitation = args.params.invitation;
  const userId = args.user.id;
  let isParentOfInvited = false;
  if (invitation && invitation.ticketId && invitation.userId && userId) {
    // load the ticket with this applicationId
    seneca.act({
      role: 'cd-events',
      entity: 'invite',
      cmd: 'list',
      query: { ticketId: invitation.ticketId, userId: invitation.userId },
    }, (err, invites) => {
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {
          userId,
          invites,
        }));
        return cb(null, { allowed: false });
        // if some data is found for this application
      }
      if (invites && invites.length === 1) {
        const invite = invites[0];
        // load the children for this profile
        seneca.act({
          role: 'cd-profiles',
          cmd: 'load_children_for_user',
          userId,
          user: args.user,
        }, (error, children) => {
          if (error) {
            seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', error, {
              userId,
              invite,
            }));
            return cb(null, { allowed: false });
          }
          // if some data is found for children
          if (children) {
            // if the userId of the application matches the userId of any of
            // the children that were found, store that child
            const childApplicant = _.find(children, child => child.userId === invite.userId);
            // if a result has been found, the current profile must be a parent of the applicant
            if (childApplicant) isParentOfInvited = true;
          }
          return cb(null, { allowed: isParentOfInvited });
        });
      } else {
        return cb(null, { allowed: false });
      }
    });
  } else {
    return cb(null, { allowed: false });
  }
};
