const _ = require('lodash');

function isParentOfApplicant({ params, user }, cb) {
  const seneca = this;
  let applicationId;
  if (params.applicationId) applicationId = params.applicationId;
  const userId = user.id;
  let allowed = false;

  // load the application with this applicationId
  seneca.act({ role: 'cd-events', cmd: 'loadApplication', id: applicationId }, (err, application) => {
    // error handling
    if (err) {
      seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, { userId, applicationId }));
      return cb(null, { allowed: false });
      // if some data is found for this application
    } else if (application) {
      // load the children for this profile
      seneca.act({ role: 'cd-profiles', cmd: 'load_children_for_user', userId, user }, (err, children) => {
        // error handling
        if (err) {
          seneca.log.error(seneca.customValidatorLogFormatter('cd-events', 'isParentOfApplicant', err, { userId, applicationId }));
          return cb(null, { allowed: false });
          // if some data is found for children
        } else if (children) {
          // if the userId of the application matches the userId of
          // any of the children that were found store that child
          const childApplicant = _.find(children, child => child.userId === application.userId);
          // if a result has been found, the current profile must be a parent of the applicant
          if (childApplicant) {
            allowed = true;
          }
        }
        return cb(null, { allowed });
      });
    }
  });
}

module.exports = isParentOfApplicant;
