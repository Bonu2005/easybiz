const http = require("http");
const app = require("./config/app");
const { initIo } = require("./config/socket/channel");
const connectionHandler = require("./config/socket/handlers/connection.handler");

const server = http.createServer(app);
const io = initIo(server); 

connectionHandler(io);

server.listen(3300, () => {
  console.log("listening on port: 3300");
});

