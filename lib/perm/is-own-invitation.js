module.exports = function isOwnInvitation(args, cb) {
  const seneca = this;
  const userId = args.user.id;
  const invitation = args.params.invitation;
  let isOwnApplication = false;
  if (invitation && invitation.ticketId && invitation.userId && userId) {
    // load the application with this inviteId
    seneca.act({
      role: 'cd-events',
      entity: 'invite',
      cmd: 'list',
      query: { ticketId: invitation.ticketId, userId: invitation.userId },
    }, (err, invites) => {
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, {
          userId,
          invitation,
        }));
        return cb(null, { allowed: false });
        // if some data is found for this invite
      }
      if (invites && invites.length === 1) {
        // if the userId of the invite that was found matches that of our user...
        if (invites[0].userId === userId) {
          // ...then it's their invite
          isOwnApplication = true;
        }
      }
      return cb(null, { allowed: isOwnApplication });
    });
  } else {
    return cb(null, { allowed: false });
  }
};
