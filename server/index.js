const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require('cors');
app.use(cors({
  origin: 'https://fancy-paprenjak-0781e5.netlify.app', // 你的 Netlify 域名
  methods: ['GET', 'POST'],
  credentials: true
}));
// Static resources path
app.use(express.static(path.join(__dirname, '../public')));

// User management
let users = [];
// Store message history
let messagesHistory = [];
// Maximum number of history messages
const MAX_HISTORY_MESSAGES = 5;

// Add user to room
const addUser = ({ id, username, room, avatar }) => {
  // Clean input
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Check if user already exists
  const existingUser = users.find(
    (user) => user.room === room && user.username === username
  );

  // If username exists, add random number
  if (existingUser) {
    username = `${username}${Math.floor(Math.random() * 1000)}`;
  }

  // Create new user
  const user = { id, username, room, avatar };
  users.push(user);
  return { user };
};

// Remove user
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// Get user
const getUser = (id) => users.find((user) => user.id === id);

// Get all users in room
const getUsersInRoom = (room) =>
  users.filter((user) => user.room === room);

// Save message to history
const saveMessageToHistory = (message) => {
  messagesHistory.push(message);
  // Keep history messages within limit
  if (messagesHistory.length > MAX_HISTORY_MESSAGES) {
    messagesHistory.shift(); // Remove oldest message
  }
};

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // User joins room
  socket.on('join', ({ username, room, avatar }, callback) => {
    const { user, error } = addUser({
      id: socket.id,
      username,
      room,
      avatar,
    });

    if (error) {
      return callback(error);
    }

    // Join room
    socket.join(user.room);

    // Send history messages to new user
    const roomMessages = messagesHistory.filter(
      (msg) => msg.room === user.room
    );
    socket.emit('historyMessages', roomMessages);

    // Send welcome message to user
    const welcomeMessage = {
      username: 'System',
      text: `Welcome to ${user.room} chat room!`,
      timestamp: new Date().toISOString(),
      room: user.room,
    };
    socket.emit('message', welcomeMessage);
    saveMessageToHistory(welcomeMessage);

    // Notify other users that a new user has joined
    const joinMessage = {
      username: 'System',
      text: `${user.username} has joined the chat`,
      timestamp: new Date().toISOString(),
      room: user.room,
    };
    socket.broadcast.to(user.room).emit('message', joinMessage);
    saveMessageToHistory(joinMessage);

    // Update online users list
    io.to(user.room).emit('updateOnlineUsers', {
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // Receive user message
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback('User not found');
    }

    const messageData = {
      username: user.username,
      text: message,
      timestamp: new Date().toISOString(),
      userId: user.id,
      avatar: user.avatar,
      room: user.room,
    };

    // Send message to room
    io.to(user.room).emit('message', messageData);
    saveMessageToHistory(messageData);

    callback();
  });

  // Change username
  socket.on('changeUsername', (newUsername, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback('User not found');
    }

    // Update username
    const oldUsername = user.username;
    user.username = newUsername.trim().toLowerCase();

    // Notify room about username change
    io.to(user.room).emit('usernameChanged', {
      userId: user.id,
      oldUsername,
      newUsername: user.username,
    });

    callback();
  });

  // User disconnects
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      // Notify other users
      const leaveMessage = {
        username: 'System',
        text: `${user.username} has left the chat`,
        timestamp: new Date().toISOString(),
        room: user.room,
      };
      io.to(user.room).emit('message', leaveMessage);
      saveMessageToHistory(leaveMessage);

      // Update online users list
      io.to(user.room).emit('updateOnlineUsers', {
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});