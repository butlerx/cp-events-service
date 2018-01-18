/**
 * Load user's (and its children) applications for an event
 * @param  {Object}   args    {user, eventId}
 * @return {[Applications]}    List of applications
 */
module.exports = function list(args, done) {
  const seneca = this;
  const role = args.role;
  const eventId = args.eventId;
  const user = args.user;
  // TODO : extend to allow selection of profile
  // TODO : extend to allow selection of status/deletion ?
  seneca.act(
    { role: 'cd-profiles', cmd: 'load_user_profile', userId: user.id },
    (err, profile) => {
      if (err) return done(err);
      const children = profile.children || [];
      const userIds = children.concat(user.id);
      seneca.act({
        role,
        cmd: 'searchApplications',
        query: {
          userId: { in$: userIds }, eventId, deleted: 0, status: { ne$: 'cancelled' },
        },
      }, (error, applications) => {
        if (error) return done(error);
        done(null, applications);
      });
    },
  );
};
