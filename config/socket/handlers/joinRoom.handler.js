module.exports = (socket, io) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.roomsJoined.add(roomName);
        io.to(roomName).emit("room_message", `${socket.id} joined ${roomName}`);
    });
};
