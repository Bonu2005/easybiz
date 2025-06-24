module.exports = (socket, io) => {
    socket.on("join_session", (sessionId) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });
};
