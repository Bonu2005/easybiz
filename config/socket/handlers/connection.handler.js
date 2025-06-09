const joinRoomHandler = require('./joinRoom.handler');
const sendMessageHandler = require('./sendMessage.handler');
const listRoomsHandler = require('./listRooms.handler');
const disconnectHandler = require('./disconnect.handler');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log("User connected", socket.id);
       
        socket.roomsJoined = new Set();

        joinRoomHandler(socket, io);
        sendMessageHandler(socket, io);
        listRoomsHandler(socket);
        disconnectHandler(socket);
    });
};
