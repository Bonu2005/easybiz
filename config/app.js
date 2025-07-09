const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const Users = require("../routes/users.routes");
const Roles = require("../routes/roles.routes")
const Chats = require("../routes/chats.routes")
const Auth = require("../routes/auth.routes")
const Admins = require("../routes/admins.routes")
const Statistic = require("../routes/statistics.routes")
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const yaml = require("yaml");
const cookieParser = require("cookie-parser");

const cors = require("cors");
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  credentials: true 
}));

app.use(cookieParser());
app.use(express.json({ limit: 1024 * 1024 * 10 }));
app.use(express.urlencoded({ limit: 1024 * 1024 * 10, extended: true }));


const swaggerDocument = yaml.parse(fs.readFileSync("./config/docs/swagger.yml", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use("/users", Users);
app.use("/admins", Admins);
app.use("/chats",Chats)
app.use("/roles",Roles)
app.use("/auth",Auth)
app.use("/statistics",Statistic)

module.exports = app;
