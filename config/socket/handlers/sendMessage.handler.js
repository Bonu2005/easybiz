module.exports = (socket, io) => {
    socket.on("send_message", ({ room, message }) => {
        if (socket.roomsJoined.has(room)) {
            io.to(room).emit("room_message", `${socket.id}: ${message}`);
        } else {
            socket.emit("error_message", "Вы не состоите в этой комнате.");
        }
    });
};
