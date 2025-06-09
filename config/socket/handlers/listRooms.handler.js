module.exports = (socket) => {
    socket.on("list_my_rooms", () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        socket.emit("my_rooms_list", rooms);
    });
};
