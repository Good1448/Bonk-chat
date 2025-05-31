// 生成普通消息
const generateMessage = (username, text) => {
  return {
    username,
    text,
    timestamp: new Date().toISOString()
  };
};

// 生成系统消息
const generateSystemMessage = (username, text, isAdmin = false) => {
  return {
    username,
    text,
    timestamp: new Date().toISOString(),
    isAdmin
  };
};

module.exports = {
  generateMessage,
  generateSystemMessage
};