function loadEventApplications(args, callback) {
  const seneca = this;
  const ENTITY_NS = 'cd/applications';
  const applications = seneca.make$(ENTITY_NS);

  const eventId = args.eventId;

  applications.list$({ eventId }, (err, res) => {
    if (err) return callback(err);
    callback(null, res);
  });
}

module.exports = loadEventApplications;
