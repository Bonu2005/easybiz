const express = require('express');
const router = express.Router();
const { getCount } = require('../config/socket/onlineState');
console.log(getCount);

router.get('/', (req, res) => {    
  res.json({ onlineUsers: getCount() });
});

module.exports = router;
