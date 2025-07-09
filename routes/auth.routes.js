const { Auth } = require("../composables/imports");
const refreshTokenMiddleware = require("../middlewares/refresh_token.middleware");
const express = require("express");
const AuthRouter = express.Router();


AuthRouter.post("/sign-up", (req, res) => {
    Auth.signup(req, res);
})

AuthRouter.post("/send-otp", (req, res) => {
    Auth.send_otp(req, res)
})


AuthRouter.post("/verify-otp", (req, res) => {
    Auth.verify_otp(req, res)
})


AuthRouter.post("/sign-in", (req, res) => {
    Auth.signin(req, res);
})


AuthRouter.post("/refresh-token", refreshTokenMiddleware, (req, res) => {
    Auth.refresh_token(req, res)
})



module.exports = AuthRouter;