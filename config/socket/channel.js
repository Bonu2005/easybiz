let io = null;

function initIo(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      allowedHeaders: ["*"],
      credentials: false,
    },
  });

  return io;
}

function getIo() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initIo, getIo };
