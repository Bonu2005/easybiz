const requestLogger = require("../middlewares/request_logger.middleware")
const passedRole = require("../middlewares/role.police")
const middleWare = require("../middlewares/token.middleware")
const express = require("express");
const AdminRouter = express.Router();
const { Admins } = require("../composables/imports");

AdminRouter.patch("/session-end", middleWare, requestLogger,passedRole("ADMIN", "SUPER ADMIN"), (req, res) => {
    Admins.end_time_session(req, res)
})



AdminRouter.post("/ban-user", middleWare,requestLogger, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Admins.ban_user(req, res)
})


AdminRouter.post("/activate-user", middleWare,requestLogger, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Admins.activate_user(req, res)
})

AdminRouter.delete("/del-user",middleWare,requestLogger,passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => 
    {
    Admins.deleteUser(req, res)
});

module.exports = AdminRouter;