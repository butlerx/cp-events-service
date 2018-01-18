const async = require('async');

module.exports = function queueFn(options) {
  const seneca = this;
  // export function to queue sending of email based on whether seneca-kue is being used or not
  const queue = {
    sendQueue(payload, cb) {
      // if kue is being used
      if (options.config && options.config.start) {
        seneca.act({
          role: 'kue-queue',
          cmd: payload.cmd,
          name: payload.name,
          msg: payload.msg,
        }, cb);
      } else {
        seneca.act({ role: 'queue', cmd: payload.cmd, msg: payload.msg }, cb);
      }
    },
    // export function to stop seneca-queue based on whether seneca-kue is being used or not
    stopQueue() {
      // if kue is not being used
      if (!(options.config && options.config.start)) {
        seneca.act({ role: 'queue', cmd: 'stop' });
      }
    },
  };
  if (options.config && options.config.start) {
    const kues = ['bulk-apply-applications-kue'];
    seneca.act({ role: 'kue-queue', cmd: 'start', config: options.config }, (error, res) => {
      if (!error) {
        async.eachSeries(kues, (kue, cb) => {
          seneca.act({ role: 'kue-queue', cmd: 'work', name: kue }, (err, worker) => {
            if (err) return new Error(err);
            cb();
          });
        });
      } else {
        return new Error("Redis queue couldn't be started");
      }
    });
  } else {
    // seneca-queue implementation
    seneca.act({ role: 'queue', cmd: 'start' });
  }
  return {
    name: 'queues',
    exportmap: {
      queue,
    },
  };
};
