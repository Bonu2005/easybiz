const jwt = require("jsonwebtoken")

function passedRole(roles) {
    return (req, res, next) => {
        let token = req.header("Authorization")?.split(" ")[1]
        try {
            let user = jwt.verify(token, process.env.accesstoken)
            req.user = user
            if (roles.includes(user.role)) {
                next()
            }
            else {
                res.status(401).json({ message: "not allowed" })
                return
            }

        } catch (error) {

            res.status(400).json({ message: "not authorized" })
            return
        }
    };
}

module.exports = passedRole;