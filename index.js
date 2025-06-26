// const Port = require('./composables/machine/port.init');
// const { server, io } = require('./config/socket/channel');

// io.on('connection', (socket) => {
//     console.log("Connected",socket.id);
//     socket.on('chat message', (msg) => {
//         setTimeout(() => {
//             const connectedUsers = Array.from(io.sockets.sockets.keys());
//             connectedUsers.forEach(user => {
//                 io.to(user).emit('chat message', msg)
//             })
//         }, 3000);
//     });


//     socket.on("join_room", (roomName) => {
//     if (["room1", "room2"].includes(roomName)) {
//         console.log(roomName);

//       socket.join(roomName);
//       console.log(`${socket.id} вошел в ${roomName}`);
//       io.to(roomName).emit("room_message", `${socket.id} присоединился к ${roomName}`);
//     } else {
//       socket.emit("error_message", "Такой комнаты не существует.");
//     }
//   });

//   socket.on("send_message", ({ room, message }) => {
//     console.log(room,message);

//     if (["room1", "room2"].includes(room)) {
//       console.log(`Сообщение в ${room}:`, message);
//       io.to(room).emit("room_message", `${socket.id}: ${message}`);
//     } else {
//       socket.emit("error_message", "Неверное имя комнаты.");
//     }
//   });

//     socket.on("disconnect", () => {
//         console.log("Отключился:", socket.id);
//     });
// });

// io.on('connection', (socket) => {
//     console.log("User connected", socket.id);

//     socket.roomsJoined = new Set();

//     socket.on("join_room", (roomName) => {

//         socket.join(roomName);
//         socket.roomsJoined.add(roomName);
//         console.log(`${socket.id} joined ${roomName}`);
//         io.to(roomName).emit("room_message", `${socket.id} joined ${roomName}`);
//     });

//     socket.on("send_message", ({ room, message }) => {
//         if (socket.roomsJoined.has(room)) {
//             io.to(room).emit("room_message", `${socket.id}: ${message}`);
//         } else {
//             socket.emit("error_message", "Вы не состоите в этой комнате.");
//         }
//     });

//     socket.on("list_my_rooms", () => {
//         const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
//         console.log(rooms);
//         socket.emit("my_rooms_list", rooms);
//     });

//     socket.on("disconnect", () => {
//         console.log("User disconnected:", socket.id);
//     });
// });


// server.listen(process.env.PORT, () => {
//     console.log("listening on port: " + process.env.PORT)
// })

const http = require("http");
const app = require("./config/app");
const { initIo } = require("./config/socket/channel");
const connectionHandler = require("./config/socket/handlers/connection.handler");

const server = http.createServer(app);
const io = initIo(server); // <--- создаём io

connectionHandler(io); // <--- передаём io в хендлеры

server.listen(3300, () => {
  console.log("listening on port: 3300");
});
