const Users = require("../models/users.models");
const Auth = require("../models/auth.models");
const Roles = require("../models/roles.model");
const Chats = require("../models/chats.models")
const Admins = require("../models/admins.models")
const Statistic = require("../models/statistics.models")
module.exports = { Users,Roles,Chats,Admins,Statistic ,Auth};