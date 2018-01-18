module.exports = function isOwnApplication(args, cb) {
  const seneca = this;
  let applicationId;
  if (args.params.applicationId) applicationId = args.params.applicationId;
  const userId = args.user.id;
  let isOwnApplicationCheck = false;

  // load the application with this applicationId
  seneca.act(
    { role: 'cd-events', cmd: 'loadApplication', id: applicationId },
    (err, application) => {
      // error handling
      if (err) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isOwnApplication', err, {
          userId,
          applicationId,
        }));
        return cb(null, { allowed: false });
        // if some data is found for this application
      } else if (application) {
        // if the userId of the application that was found matches that of our user...
        if (application.userId === userId) {
          // ...then it's their application
          isOwnApplicationCheck = true;
        }
      }
      return cb(null, { allowed: isOwnApplicationCheck });
    },
  );
};
