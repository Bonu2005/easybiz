module.exports = (socket, io) => {
    socket.on("join_admins", () => {
        socket.join("admins");
        console.log("Admin joined admin notification room");
    });
};
