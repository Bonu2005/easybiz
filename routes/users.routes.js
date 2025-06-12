const express = require("express");
const { Users, Roles } = require("../composables/imports");
const middleWare = require("../middlewares/token.middleware");
const passedRole = require("../middlewares/role.police");
const selfPolice = require("../middlewares/self.police");
const upload = require("../config/multer/multer");
const refreshTokenMiddleware = require("../middlewares/refresh_token.middleware");
const requestLogger  =require( '../middlewares/request_logger.middleware');
const Router = express.Router();





//--------------------------------------------------------------------------------------------------------------------------------------------------------USERS

Router.get("/", (req, res) => {
    Users.get_users(req, res)
})


Router.post("/sign-up", (req, res) => {
    Users.signup(req, res);
})


Router.post("/send-otp", (req, res) => {
    Users.send_otp(req, res)
})


Router.post("/verify-otp", (req, res) => {
    Users.verify_otp(req, res)
})


Router.post("/sign-in", (req, res) => {
    Users.signin(req, res);
})

Router.get("/get-my-data", middleWare, (req, res) => {
    Users.get_my_data(req, res)
})


Router.patch("/update-self/:id", middleWare, requestLogger,selfPolice(["USER", "ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.update_user(req, res)
})


Router.post("/send-otp-reset",requestLogger, (req, res) => {
    Users.send_otp_reset(req, res)
})

Router.post("/verify-otp-reset", requestLogger,(req, res) => {
    Users.verify_otp_reset(req, res)
})

Router.post("/reset-password", requestLogger,(req, res) => {
    Users.reset_password(req, res)
})


Router.use("/logout", (req, res) => {
    Users.logout(req, res)
});



//------------------------------------------------------------------------------------------------------------------------------------------------------MANAGE USERS


Router.post("/ban-user", middleWare,requestLogger, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.ban_user(req, res)
})


Router.post("/activate-user", middleWare,requestLogger, passedRole(["ADMIN", "SUPER ADMIN"]), (req, res) => {
    Users.activate_user(req, res)
})


Router.post("/refresh-token", refreshTokenMiddleware, (req, res) => {
    Users.refresh_token(req, res)
})



//-------------------------------------------------------------------------------------------------------------------------------------------------------SESSIONS


Router.get("/get-my-sessions", middleWare, (req, res) => {
    Users.get_my_session(req, res)
})


Router.delete("/del-my-sessions/:id", middleWare, (req, res) => {
    Users.del_my_session(req, res)
})


Router.patch("/session-end", middleWare, requestLogger,passedRole("ADMIN", "SUPER ADMIN"), (req, res) => {
    Users.end_time_session(req, res)
})


//---------------------------------------------------------------------------------------------------------------------------------------------------------ROLE


Router.get("/roles", (req, res) => {
    Roles.getRole(req, res)
})


Router.get("/role/:id", (req, res) => {
    Roles.getOneRole(req, res)
})


Router.post("/role", middleWare, requestLogger,passedRole("ADMIN"), (req, res) => {
    Roles.createRole(req, res)
})

Router.patch("/role-update/:id", middleWare,requestLogger, passedRole(["ADMIN"]), (req, res) => {
    Roles.updateRole(req, res)
})


Router.delete("/role-delete/:id", middleWare, requestLogger,passedRole(["ADMIN"]), (req, res) => {
    Roles.deleteRole(req, res)
})




//---------------------------------------------------------------------------------------------------------------------------------------------------------STATISTIC


Router.get("/average-time-statistics/day", (req, res) => {
    Users.average_session_time(req, res)
}
)
Router.get("/average-time-statistics/month", (req, res) => {
    Users.average_session_time(req, res)
}
)
Router.get("/average-time-statistics/year", (req, res) => {
    Users.average_session_time(req, res)
}
)
Router.get("/average-time-statistics/custom", (req, res) => {
    Users.average_session_time(req, res)
}
)

Router.get('/browsers_statistics/day', (req, res) => {
    Users.browsers_statistics(req, res);
});

Router.get('/browsers_statistics/month', (req, res) => {
    Users.browsers_statistics(req, res);
});

Router.get('/browsers_statistics/year', (req, res) => {
    Users.browsers_statistics(req, res);
});

Router.get('/browsers_statistics/custom', (req, res) => {
    Users.browsers_statistics(req, res);
});


Router.get('/devices-statistics/day', (req, res) => {
    Users.devices_statistics(req, res);
});

Router.get('/devices-statistics/month', (req, res) => {
    Users.devices_statistics(req, res);
});

Router.get('/devices-statistics/year', (req, res) => {
    Users.devices_statistics(req, res);
});

Router.get('/devices-statistics/custom', (req, res) => {
    Users.devices_statistics(req, res);
});

Router.get('/user-statistics/day', (req, res) => {
    Users.user_statistics(req, res);
});

Router.get('/user-statistics/month', (req, res) => {
    Users.user_statistics(req, res);
});

Router.get('/user-statistics/year', (req, res) => {
    Users.user_statistics(req, res);
});

Router.get('/user-statistics/custom', (req, res) => {
    Users.user_statistics(req, res);
});




//------------------------------------------------------------------------------------------------------------------------------------------------------------UPLOADS



Router.use("/upload", upload.single("image"), requestLogger,middleWare, (req, res) => {
    Users.upload_file(req, res)
});


Router.use("/image", express.static("uploads"));


//-------------------------------------------------------------------------------------------------------------------------------------------------------------LOGS

Router.use("/get-logs", (req, res) => {
    Users.getLogs(req, res)
});

module.exports = Router;