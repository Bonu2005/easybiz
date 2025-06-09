module.exports = (socket) => {
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
};
