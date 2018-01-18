module.exports = function save(args, done) {
  const seneca = this;
  const event = args.event;
  seneca.make$('cd/events').save$(event, done);
};
