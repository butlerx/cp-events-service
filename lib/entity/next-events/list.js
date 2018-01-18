module.exports = function list(args, done) {
  const seneca = this;
  const query = args.query;
  if (query) {
    seneca.make$('v/next_events').list$(query, done);
  } else {
    done(null, []);
  }
};
