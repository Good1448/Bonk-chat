let users = [];

// 添加用户
const addUser = ({ id, username, avatar, room }) => {
  // 验证数据
  if (!username || !room) {
    return { error: '用户名和房间名是必需的' };
  }

  const user = { id, username, avatar, room, messagesCount: 0 };
  users.push(user);
  return { user };
};

// 移除用户
const removeUser = (id) => {
  const index = users.findIndex(user => user.id === id);
  
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// 获取用户
const getUser = (id) => {
  return users.find(user => user.id === id);
};

// 获取房间内所有用户
const getUsersInRoom = (room) => {
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};