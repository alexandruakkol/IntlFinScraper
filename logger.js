const { createLogger, transports } = require("winston");

const logLevels = {
    info: 0,
    warn: 1,
    newColumn: 2,
    error: 3,
  };
   
  const tempLog = createLogger({
    levels: logLevels,
    transports: [new transports.File({
        filename: 'logs.log',
        level:'error'
    })],
  });

module.exports={ tempLog }