const express = require("express");
const { Roles } = require("../composables/imports");
const passedRole = require("../middlewares/role.police");
const middleWare = require("../middlewares/token.middleware");
const requestLogger = require("../middlewares/request_logger.middleware");

const RoleRouter = express.Router();



RoleRouter.get("/", (req, res) => {
    Roles.getRole(req, res)
})


RoleRouter.get("/:id", (req, res) => {
    Roles.getOneRole(req, res)
})


RoleRouter.post("/", middleWare, requestLogger, passedRole("ADMIN"), (req, res) => {
    Roles.createRole(req, res)
})


RoleRouter.patch("/role-update/:id", middleWare, requestLogger, passedRole(["ADMIN"]), (req, res) => {
    Roles.updateRole(req, res)
})


RoleRouter.delete("/role-delete/:id", middleWare, requestLogger, passedRole(["ADMIN"]), (req, res) => {
    Roles.deleteRole(req, res)
})

module.exports = RoleRouter;