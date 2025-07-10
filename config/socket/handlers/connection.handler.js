const joinRoomHandler = require('./joinRoom.handler');
const sendMessageHandler = require('./sendMessage.handler');
const listRoomsHandler = require('./listRooms.handler');
const disconnectHandler = require('./disconnect.handler');
const { increment } = require('../onlineState');
module.exports = (io) => {

    io.on('connection', (socket) => {
         increment();
        console.log('User connected:', socket.id);
        joinRoomHandler(socket, io);
        sendMessageHandler(socket, io);
        listRoomsHandler(socket);
        disconnectHandler(socket);
    });
};
