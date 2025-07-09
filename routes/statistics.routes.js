const {Statistic} = require("../composables/imports")
const express = require("express");
const StatisticRouter = express.Router();


StatisticRouter.get("/average-time-statistics/day", (req, res) => {
    Statistic.average_session_time(req, res)
}
)
StatisticRouter.get("/average-time-statistics/month", (req, res) => {
    Statistic.average_session_time(req, res)
}
)
StatisticRouter.get("/average-time-statistics/year", (req, res) => {
    Statistic.average_session_time(req, res)
}
)
StatisticRouter.get("/average-time-statistics/custom", (req, res) => {
    Statistic.average_session_time(req, res)
}
)

StatisticRouter.get('/browsers_statistics/day', (req, res) => {
    Statistic.browsers_statistics(req, res);
});

StatisticRouter.get('/browsers_statistics/month', (req, res) => {
    Statistic.browsers_statistics(req, res);
});

StatisticRouter.get('/browsers_statistics/year', (req, res) => {
    Statistic.browsers_statistics(req, res);
});

StatisticRouter.get('/browsers_statistics/custom', (req, res) => {
    Statistic.browsers_statistics(req, res);
});


StatisticRouter.get('/devices-statistics/day', (req, res) => {
    Statistic.devices_statistics(req, res);
});

StatisticRouter.get('/devices-statistics/month', (req, res) => {
    Statistic.devices_statistics(req, res);
});

StatisticRouter.get('/devices-statistics/year', (req, res) => {
    Statistic.devices_statistics(req, res);
});

StatisticRouter.get('/devices-statistics/custom', (req, res) => {
    Statistic.devices_statistics(req, res);
});

StatisticRouter.get('/user-statistics/day', (req, res) => {
    Statistic.user_statistics(req, res);
});

StatisticRouter.get('/user-statistics/month', (req, res) => {
    Statistic.user_statistics(req, res);
});

StatisticRouter.get('/user-statistics/year', (req, res) => {
    Statistic.user_statistics(req, res);
});

StatisticRouter.get('/user-statistics/custom', (req, res) => {
    Statistic.user_statistics(req, res);
});

StatisticRouter.get('/page-statistics/day', (req, res) => {
    Statistic.page_statistics(req, res);
});

StatisticRouter.get('/page-statistics/month', (req, res) => {
    Statistic.page_statistics(req, res);
});

StatisticRouter.get('/page-statistics/year', (req, res) => {
    Statistic.page_statistics(req, res);
});

StatisticRouter.get('/page-statistics/custom', (req, res) => {
    Statistic.page_statistics(req, res);
});

StatisticRouter.get("/get-logs", (req, res) => {
    Statistic.getLogs(req, res)
})

StatisticRouter.get("/admins", (req, res) => {
    Statistic.get_admins(req, res)
})

StatisticRouter.get('/users', (req, res) => {
    Statistic.get_users(req, res);
}); 


StatisticRouter.post('/log-page-view', (req, res) => {
    Statistic.logPageView(req, res);
});


module.exports = StatisticRouter;
