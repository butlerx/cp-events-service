'use strict';

module.exports = function (seneca) {
  seneca.listen({
    type: 'amqp',
    hostname: process.env.CD_EVENTS || '127.0.0.1',
    port: 5672,
    vhost: 'seneca',
    username: 'guest',
    password: 'guest',
    pin: 'role:cd-events,cmd:*'
  })
  .client({
    type: 'amqp',
    hostname: process.env.CD_BADGES || '127.0.0.1',
    port: 5672,
    vhost: 'seneca',
    username: 'guest',
    password: 'guest',
    pin: 'role:cd-badges,cmd:*'
  })
  .client({
    type: 'amqp',
    hostname: process.env.CD_DOJOS || '127.0.0.1',
    port: 5672,
    vhost: 'seneca',
    username: 'guest',
    password: 'guest',
    pin: 'role:cd-dojos,cmd:*'
  })
  .client({
    type: 'amqp',
    hostname: process.env.CD_USERS || '127.0.0.1',
    port: 5672,
    vhost: 'seneca',
    username: 'guest',
    password: 'guest',
    pin: 'role:cd-profiles,cmd:*'
  })
  .client({
    type: 'amqp',
    hostname: process.env.CD_USERS || '127.0.0.1',
    port: 5672,
    vhost: 'seneca',
    username: 'guest',
    password: 'guest',
    pin: 'role:cd-users,cmd:*'
  });
};
