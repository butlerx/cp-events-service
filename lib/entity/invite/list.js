module.exports = function listInvite(args, cb) {
  const seneca = this;
  const query = args.query;
  const ent = seneca.make('v/ticket_invitations');
  ent.list$(query, cb);
};
