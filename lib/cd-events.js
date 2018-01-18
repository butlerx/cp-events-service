const ping = require('./ping');
const saveEvent = require('./save-event');
const getEvent = require('./get-event');
const listEvents = require('./list-events');
const deleteEvent = require('./delete-event');
const searchEvents = require('./search-events');
const loadEventApplications = require('./load-event-applications');
const searchApplications = require('./search-applications');
const deleteApplication = require('./delete-application');
const saveApplication = require('./save-application');
const userDojosEvents = require('./user-dojos-events');
const ticketTypes = require('./ticket-types');
const exportGuestList = require('./export-guest-list');
const searchSessions = require('./search-sessions');
const saveSession = require('./save-session');
const bulkApplyApplications = require('./bulk-apply-applications');
const updateApplicationAttendance = require('./update-application-attendance');
const loadApplication = require('./load-application');
const cancelSession = require('./cancel-session');
const loadSession = require('./load-session');
const saveTicket = require('./save-ticket');
const searchTickets = require('./search-tickets');
const validateSessionInvitation = require('./validate-session-invitation');
const loadTicket = require('./load-ticket');
const getSessionsFromEventId = require('./get-sessions-from-event-id');
const isTicketingAdmin = require('./perm/is-ticketing-admin');
const inviteList = require('./entity/invite/list');
const eventSave = require('./entity/event/save');
const isParentOfApplicant = require('./perm/is-parent-of-applicant');
const isOwnApplication = require('./perm/is-own-application');
const isOwnInvitaion = require('./perm/is-own-invitation');
const isParentOfInvited = require('./perm/is-parent-of-invited');
const applicationList = require('./controllers/application/list');
const nextEventList = require('./entity/next-events/list');
const updateAddress = require('./controllers/event/update-address');

module.exports = function cdEvents() {
  const seneca = this;
  const plugin = 'cd-events';

  seneca.add({ role: plugin, cmd: 'ping' }, ping.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveEvent' }, saveEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'getEvent' }, getEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'listEvents' }, listEvents.bind(seneca));
  seneca.add({ role: plugin, cmd: 'deleteEvent' }, deleteEvent.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchEvents' }, searchEvents.bind(seneca));
  seneca.add({ role: plugin, cmd: 'loadEventApplications' }, loadEventApplications.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchApplications' }, searchApplications.bind(seneca));
  seneca.add({ role: plugin, cmd: 'deleteApplication' }, deleteApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveApplication' }, saveApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'userDojosEvents' }, userDojosEvents.bind(seneca));
  seneca.add({ role: plugin, cmd: 'ticketTypes' }, ticketTypes.bind(seneca));
  seneca.add({ role: plugin, cmd: 'exportGuestList' }, exportGuestList.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchSessions' }, searchSessions.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveSession' }, saveSession.bind(seneca));
  seneca.add({ role: plugin, cmd: 'bulkApplyApplications' }, bulkApplyApplications.bind(seneca));
  seneca.add(
    { role: plugin, cmd: 'updateApplicationAttendance' },
    updateApplicationAttendance.bind(seneca),
  );
  seneca.add({ role: plugin, cmd: 'loadApplication' }, loadApplication.bind(seneca));
  seneca.add({ role: plugin, cmd: 'cancelSession' }, cancelSession.bind(seneca));
  seneca.add({ role: plugin, cmd: 'loadSession' }, loadSession.bind(seneca));
  seneca.add({ role: plugin, cmd: 'saveTicket' }, saveTicket.bind(seneca));
  seneca.add({ role: plugin, cmd: 'searchTickets' }, searchTickets.bind(seneca));
  seneca.add(
    { role: plugin, cmd: 'validateSessionInvitation' },
    validateSessionInvitation.bind(seneca),
  );
  seneca.add({ role: plugin, cmd: 'loadTicket' }, loadTicket.bind(seneca));
  seneca.add({ role: plugin, cmd: 'getSessionsFromEventId' }, getSessionsFromEventId.bind(seneca));

  // CRUD
  seneca.add({ role: plugin, entity: 'invite', cmd: 'list' }, inviteList);
  seneca.add({ role: plugin, entity: 'event', cmd: 'save' }, eventSave);
  seneca.add({ role: plugin, entity: 'next-events', cmd: 'list' }, nextEventList);

  // Controllers
  seneca.add({ role: plugin, ctrl: 'applications', cmd: 'list' }, applicationList);
  seneca.add({ role: plugin, ctrl: 'events', cmd: 'updateAddress' }, updateAddress);

  // PERMS
  seneca.add({ role: plugin, cmd: 'is_ticketing_admin' }, isTicketingAdmin.bind(seneca));
  // TODO : those 2 perms are very alike, need for a factory ?
  seneca.add({ role: plugin, cmd: 'is_own_application' }, isOwnApplication);
  seneca.add({ role: plugin, cmd: 'is_own_invitation' }, isOwnInvitaion);
  seneca.add({ role: plugin, cmd: 'is_parent_of_applicant' }, isParentOfApplicant);
  seneca.add({ role: plugin, cmd: 'is_parent_of_invited' }, isParentOfInvited);

  return {
    name: plugin,
  };
};
