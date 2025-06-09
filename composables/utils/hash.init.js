const crypto = require("crypto");
function stringToHash(data) {
    const secret = crypto.createHash('sha256').update(data).digest();
    return secret.slice(0, 8).toString('hex');
}
module.exports = stringToHash