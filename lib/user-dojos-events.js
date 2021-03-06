const async = require('async');

function userDojosEvents(args, callback) {
  const seneca = this;
  const plugin = args.role;

  const query = args.query || {};
  if (!query.limit$) query.limit$ = 'NULL';

  const filterPastEvents = query.filterPastEvents || false;

  async.waterfall([loadUserDojos, loadDojosEvents], callback);

  function loadUserDojos(done) {
    seneca.act({ role: 'cd-dojos', cmd: 'dojos_for_user', id: args.user.id }, (err, dojos) => {
      if (err) return callback(err);
      return done(null, dojos);
    });
  }

  function loadDojosEvents(dojos, done) {
    const events = [];
    if (dojos && dojos.length > 0) {
      // load Events for each dojo
      async.eachSeries(dojos, (dojo, cb) => {
        query.dojoId = dojo.id;
        query.filterPastEvents = filterPastEvents;
        seneca.act({ role: plugin, cmd: 'searchEvents', query }, (err, response) => {
          if (err) return cb(err);
          const dojoEvents = {
            dojo,
            events: response,
          };
          events.push(dojoEvents);
          return cb(null, response);
        });
      }, err => {
        if (err) return done(null, { error: err.message });
        return done(null, events);
      });
    } else {
      return done(null, events);
    }
  }
}

module.exports = userDojosEvents;
