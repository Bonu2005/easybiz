const { io } = require('../socket/channel'); 
const connectionHandler = require('./handlers/connection.handler');

connectionHandler(io);
