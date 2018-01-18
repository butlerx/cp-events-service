const _ = require('lodash');

module.exports = function isParentOfApplicant(args, cb) {
  const seneca = this;
  let applicationId;
  if (args.params.applicationId) applicationId = args.params.applicationId;
  const userId = args.user.id;
  let isParentOfApplicantCheck = false;

  // load the application with this applicationId
  seneca.act(
    { role: 'cd-events', cmd: 'loadApplication', id: applicationId },
    (error, application) => {
      // error handling
      if (error) {
        seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', error, {
          userId,
          applicationId,
        }));
        return cb(null, { allowed: false });
        // if some data is found for this application
      } else if (application) {
        // load the children for this profile
        seneca.act({
          role: 'cd-profiles',
          cmd: 'load_children_for_user',
          userId,
          user: args.user,
        }, (err, children) => {
          // error handling
          if (err) {
            seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, {
              userId,
              applicationId,
            }));
            return cb(null, { allowed: false });
            // if some data is found for children
          } else if (children) {
            // if the userId of the application matches the userId of any of
            // the children that were found, store that child
            const childApplicant = _.find(children, child => child.userId === application.userId);
            // if a result has been found, the current profile must be a parent of the applicant
            if (childApplicant) isParentOfApplicantCheck = true;
          }
          return cb(null, { allowed: isParentOfApplicantCheck });
        });
      }
    },
  );
};
