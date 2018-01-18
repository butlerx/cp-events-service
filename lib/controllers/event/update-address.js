const async = require('async');
/**
 * updateAddress function - Called to update all upcoming event address upon dojo address change
 * By default asynchronous
 * @param  {String} dojoId Identifier of the parent entity
 * @param  {Object} location Object containing the information of the address
 * @return {Void}
 */
module.exports = function updateAddress(args, done) {
  const seneca = this;
  const plugin = args.role;
  const dojoId = args.dojoId;
  const location = args.location;
  // Retrieve all events in the future
  function getUpcomingEvents(wfCb) {
    seneca.act({
      role: plugin,
      entity: 'next-events',
      cmd: 'list',
      query: { dojoId, useDojoAddress: true },
    }, (err, events) => {
      if (events && events.length > 0) {
        wfCb(null, events);
      } else {
        done();
      }
    });
  }
  function updateEvents(events, wfCb) {
    async.eachSeries(events, saveAddress, wfCb);
  }
  // Save the new address
  function saveAddress(event, sCb) {
    const payload = {
      id: event.id,
      country: location.country,
      city: location.city,
      address: location.address,
      position: location.position,
    };
    seneca.act({
      role: plugin, entity: 'event', cmd: 'save', event: payload,
    }, sCb);
  }
  async.waterfall([
    getUpcomingEvents,
    updateEvents,
  ], done);
};
