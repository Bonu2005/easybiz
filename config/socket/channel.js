const { createServer } = require("node:http");


const { Server } = require("socket.io");
const app = require("../app");

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        allowedHeaders: ["*"],
        credentials: false,
    },
});

function getIo() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { server, io,getIo };