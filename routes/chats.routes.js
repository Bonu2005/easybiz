const { Chats } = require("../composables/imports");
const passedRole = require("../middlewares/role.police");
const middleWare = require("../middlewares/token.middleware");
const express = require("express");
const ChatRouter = express.Router();
const uploadMedia = require("../config/multer/multerMedia");

ChatRouter.post("/start-chat",middleWare, (req, res) => {
    Chats.start_chat(req, res)
});


ChatRouter.get("/get-flows",middleWare, (req, res) => {
    Chats.get_flows(req, res)
});


ChatRouter.patch("/connect-chat/:sessionId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.connect_chat_session(req, res)
});

ChatRouter.post("/send-message/:sessionId",middleWare,  (req, res) => {
    Chats.send_message(req, res)
});

ChatRouter.get("/get-message",middleWare, (req, res) => {
    Chats.get_messages(req, res)
});


ChatRouter.patch("/chat-session-archive/:sessionId",middleWare,passedRole(["ADMIN"]), (req, res) => {    
    Chats.archive_chat_session(req, res)
});


ChatRouter.patch("/message-isRead/:messageId",middleWare, (req, res) => {
    Chats.isReadChat(req, res)
});


ChatRouter.get("/archive-messages",middleWare, (req, res) => {
    Chats.get_archive_messages(req, res)
});

ChatRouter.get("/closed-messages",middleWare, (req, res) => {
    Chats.getClosedChts(req, res)
});


ChatRouter.post("/favorites/:messageId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.addFavorite(req, res)
});


ChatRouter.delete("/favorites-del/:messageId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.removeFavorite(req, res)
});


ChatRouter.get("/favorites",middleWare, (req, res) => {
    Chats.getFavorites(req, res)
});


ChatRouter.post("/uploads/file", uploadMedia.single("file"), (req, res) => {
   Chats.upload_file_media(req,res)
});

ChatRouter.use("/file", express.static("uploads/media"));

module.exports = ChatRouter;