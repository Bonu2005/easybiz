let onlineCount = 0;

function increment() {
  onlineCount++;
}

function decrement() {
  onlineCount = Math.max(0, onlineCount - 1);
}

function getCount() {
  return onlineCount;
}

module.exports = {
  increment,
  decrement,
  getCount,
};
