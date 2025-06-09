const multer= require("multer")
const path = require("path")
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}.${path.extname(file.originalname)}`)
    }
})

let upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

module.exports = upload