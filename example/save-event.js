const util = require('util');
const seneca = require('seneca')();
const options = require('../config/config')();

seneca.options(options);
seneca.client();

seneca.act({
  role: 'cd-events',
  cmd: 'saveEvent',
  eventInfo: {
    name: 'Event name',
    date: new Date(2015, 9, 10, 17, 30),
    description: 'Event description',
    public: true,
    userTypes: ['attendee-u13'],
    category: 'JavaScript',
    status: 'active',
    createdAt: new Date(),
    createdBy: 'user id',
  },
}, (err, result) => {
  if (err) return console.error(err);
  console.log(util.inspect(result, true, null, true));
});
