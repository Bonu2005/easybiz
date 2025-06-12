const jwt = require("jsonwebtoken")
const { config } = require("dotenv")

config()

const middleWare = (req, res, next) => {
    let token = req.header("Authorization")?.split(" ")[1]
    if (!token) {
        res.status(400).json({ message: "not authorized" })
        return
    }
    try {
        let verify = jwt.verify(token, process.env.accesstoken)
        req.user = verify

        next()
    } catch (error) {
        res.status(400).json({ message: "not authorized" })
    }
}
module.exports = middleWare