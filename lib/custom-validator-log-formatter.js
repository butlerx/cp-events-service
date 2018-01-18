module.exports = (ms, cmd, err, args) =>
  JSON.stringify({
    src: {
      ms,
      cmd,
    },
    err,
    args,
  });
