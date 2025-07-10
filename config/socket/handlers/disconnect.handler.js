const { decrement } = require("../onlineState");

module.exports = (socket) => {
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
          decrement();
          console.log(`User went offline`);
    });
};
