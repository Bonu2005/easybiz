const prisma = require("../database/config.db")
 async function requestLogger(req, res, next) {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const duration = Date.now() - start;

    const log = {
      userId: (req).user?.id || null,
      method: req.method,
      url: req.originalUrl,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      body: safeJson(req.body),
      query: safeJson(req.query),
      responseCode: res.statusCode,
      responseTimeMs: duration,
    };

    prisma.requestLog.create({ data: log }).catch(err => {
      console.error('Request_Logger Error :', err);
    });

    return originalSend.call(this, body);
  };

  next();
}

function safeJson(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
}
module.exports = requestLogger