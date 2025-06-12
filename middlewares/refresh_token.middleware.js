const jwt = require("jsonwebtoken");
require("dotenv").config();

const refreshTokenMiddleware = (req, res, next) => {
    const token = req.cookies?.refresh_token;

    if (!token) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.refreshtoken);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Refresh token expired, please sign in again." });
        }
        return res.status(401).json({ message: "Refresh token invalid" });
    }
};


module.exports = refreshTokenMiddleware;
