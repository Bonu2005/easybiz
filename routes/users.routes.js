const express = require("express");
const { Users } = require("../composables/imports");
const middleWare = require("../middlewares/token.middleware");
const selfPolice = require("../middlewares/self.police");
const upload = require("../config/multer/multer");
const requestLogger  =require( '../middlewares/request_logger.middleware');
const UserRouter = express.Router();

UserRouter.get("/get-my-data", middleWare, (req, res) => {
    Users.get_my_data(req, res)
})


UserRouter.patch("/update-self/:id", middleWare, requestLogger,selfPolice(["USER", "ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.update_user(req, res)
})


UserRouter.post("/send-otp-reset",middleWare,requestLogger, (req, res) => {
    Users.send_otp_reset(req, res)
})


UserRouter.post("/verify-otp-reset",middleWare, requestLogger,(req, res) => {
    Users.verify_otp_reset(req, res)
})


UserRouter.post("/reset-password",middleWare, requestLogger,(req, res) => {
    Users.reset_password(req, res)
})


UserRouter.get("/get-my-sessions", middleWare, (req, res) => {
    Users.get_my_session(req, res)
})


UserRouter.delete("/del-my-sessions/:id", middleWare, (req, res) => {
    Users.del_my_session(req, res)
})


UserRouter.use("/upload", upload.single("image"), requestLogger,middleWare, (req, res) => {
    Users.upload_file(req, res)
});

UserRouter.use("/image", express.static("uploads"));

UserRouter.use("/logout",middleWare, (req, res) => {
    Users.logout(req, res)
});
module.exports = UserRouter;