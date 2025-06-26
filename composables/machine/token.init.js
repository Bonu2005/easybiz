const jwt = require("jsonwebtoken")

class TokenService {
    static generate_access_token(payload) {
        const accessToken = jwt.sign(
            { id: payload.id, role: payload.role, status: payload.status,sessionId:payload.sessionId },
            process.env.accesstoken,
        );
        return accessToken
    }
    static generate_refresh_token(payload) {
        const refreshToken = jwt.sign(
            { id: payload.id, role: payload.role, type: payload.type,sessionId:payload.sessionId },
            process.env.refreshtoken,
            { expiresIn: "7d" }
        );
        return refreshToken
    }
}

module.exports =  TokenService