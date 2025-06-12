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

if (!io) {
    console.error("Ошибка инициализации Socket.IO");
    process.exit(1);
}

module.exports = { server, io };