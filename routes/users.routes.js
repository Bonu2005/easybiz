const express = require("express");
const { Users, Roles,Chats } = require("../composables/imports");
const middleWare = require("../middlewares/token.middleware");
const passedRole = require("../middlewares/role.police");
const selfPolice = require("../middlewares/self.police");
const upload = require("../config/multer/multer");
const refreshTokenMiddleware = require("../middlewares/refresh_token.middleware");
const requestLogger  =require( '../middlewares/request_logger.middleware');
const Router = express.Router();
const uploadMedia = require("../config/multer/multerMedia")


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


Router.use("/logout",middleWare, (req, res) => {
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

Router.get('/page-statistics/day', (req, res) => {
    Users.page_statistics(req, res);
});

Router.get('/page-statistics/month', (req, res) => {
    Users.page_statistics(req, res);
});

Router.get('/page-statistics/year', (req, res) => {
    Users.page_statistics(req, res);
});

Router.get('/page-statistics/custom', (req, res) => {
    Users.page_statistics(req, res);
});

Router.post('/log-page-view', (req, res) => {
    Users.logPageView(req, res);
});




//------------------------------------------------------------------------------------------------------------------------------------------------------------UPLOADS



Router.use("/upload", upload.single("image"), requestLogger,middleWare, (req, res) => {
    Users.upload_file(req, res)
});

Router.use("/image", express.static("uploads"));

Router.post("/uploads/file", uploadMedia.single("file"), (req, res) => {
   Users.upload_file_media(req,res)
});

Router.use("/file", express.static("uploads/media"));


//-------------------------------------------------------------------------------------------------------------------------------------------------------------LOGS

Router.use("/get-logs", (req, res) => {
    Users.getLogs(req, res)
});

//--------------------------------------------------------------------------------------------------------------------------------------------------------------Chats


Router.post("/start-chat",middleWare, (req, res) => {
    Chats.start_chat(req, res)
});


Router.get("/get-flows",middleWare, (req, res) => {
    Chats.get_flows(req, res)
});


Router.patch("/connect-chat/:sessionId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.connect_chat_session(req, res)
});


Router.post("/send-message/:sessionId",middleWare,  (req, res) => {
    Chats.send_message(req, res)
});


Router.get("/get-message",middleWare, (req, res) => {
    Chats.get_messages(req, res)
});


Router.patch("/chat-session-archive/:sessionId",middleWare,passedRole(["ADMIN"]), (req, res) => {    
    Chats.archive_chat_session(req, res)
});


Router.patch("/message-isRead/:messageId",middleWare, (req, res) => {
    Chats.isReadChat(req, res)
});


Router.get("/archive-messages",middleWare, (req, res) => {
    Chats.get_archive_messages(req, res)
});

Router.get("/closed-messages",middleWare, (req, res) => {
    Chats.getClosedChts(req, res)
});


Router.post("/favorites/:messageId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.addFavorite(req, res)
});


Router.delete("/favorites-del/:messageId",middleWare,passedRole(["ADMIN"]), (req, res) => {
    Chats.removeFavorite(req, res)
});


Router.get("/favorites",middleWare, (req, res) => {
    Chats.getFavorites(req, res)
});



module.exports = Router;