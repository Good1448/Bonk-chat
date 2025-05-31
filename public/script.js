// Execute when page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Connect to WebSocket server
  const socket = io();
  
  // Get DOM elements
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const chatMessages = document.getElementById('chat-messages');
  const onlineCount = document.getElementById('online-count');
  const changeUsernameButton = document.getElementById('change-username-button');
  const changeUsernameModal = document.getElementById('change-username-modal');
  const closeModalButton = document.getElementById('close-modal');
  const cancelChangeButton = document.getElementById('cancel-change');
  const confirmChangeButton = document.getElementById('confirm-change');
  const newUsernameInput = document.getElementById('new-username');
  
  // Generate random username
  const generateRandomUsername = () => {
    const adjectives = ['Enthusiastic', 'Rational', 'Experienced', 'Optimistic', 'Cautious'];
    const nouns = ['BONK Fan', 'Crypto Enthusiast', 'Holder', 'Investor', 'Observer'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective}${randomNoun}`;
  };
  
  // Generate random avatar
  const generateRandomAvatar = () => {
    // Generate random avatar using picsum.photos
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/200/200?random=${randomId}`;
  };
  
  // User information
  let user = {
    username: generateRandomUsername(),
    avatar: generateRandomAvatar(),
    room: 'bonk-price-discussion'
  };
  
  // Join room
  socket.emit('join', { 
    username: user.username, 
    room: user.room,
    avatar: user.avatar 
  }, (error) => {
    if (error) {
      alert(error);
      window.location.href = '/';
    }
  });
  
  // Receive history messages
  socket.on('historyMessages', (messages) => {
    messages.forEach((message) => {
      appendMessage(message);
    });
  });
  
  // Receive new message
  socket.on('message', (data) => {
    appendMessage(data);
  });
  
  // Add message to chat interface
  const appendMessage = (data) => {
    // Determine if message is from current user by comparing user IDs
    const isMyMessage = data.userId === socket.id;
    
    // Format timestamp
    const date = new Date(data.timestamp);
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = isMyMessage ? 
      'flex items-start justify-end space-x-3' : 
      'flex items-start space-x-3';
    
    messageElement.innerHTML = `
      <${isMyMessage ? 'div' : `img src="${data.avatar || 'https://picsum.photos/200/200'}" alt="User Avatar" class="w-8 h-8 rounded-full object-cover"`}>
        <div class="flex items-center ${isMyMessage ? 'justify-end' : ''} mb-1">
          <span class="${isMyMessage ? 'mr-2' : 'ml-2'} text-xs text-slate-400">${timeString}</span>
          <span class="font-medium text-sm">${data.username}</span>
        </div>
        <div class="${isMyMessage ? 'message-bubble-right' : 'message-bubble-left'} p-3 max-w-[80vw]">
          ${data.text}
        </div>
      </div>
      ${isMyMessage ? 
        `<img src="${user.avatar}" alt="User Avatar" class="w-8 h-8 rounded-full object-cover">` : 
        ''}
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };
  
  // Receive online users update
  socket.on('updateOnlineUsers', ({ users }) => {
    onlineCount.textContent = `${users.length} members online`;
  });
  
  // Send message
  const sendMessage = () => {
    const message = messageInput.value.trim();
    if (message) {
      // Clear input
      messageInput.value = '';
      
      // Send message to server
      socket.emit('sendMessage', message, (error) => {
        if (error) {
          return alert(error);
        }
      });
    }
  };
  
  // Show change username modal
  const showChangeUsernameModal = () => {
    newUsernameInput.value = user.username;
    newUsernameInput.focus();
    changeUsernameModal.classList.remove('hidden');
  };
  
  // Hide change username modal
  const hideChangeUsernameModal = () => {
    changeUsernameModal.classList.add('hidden');
  };
  
  // Change username
  const changeUsername = () => {
    const newUsername = newUsernameInput.value.trim();
    
    if (!newUsername) {
      alert('Username cannot be empty');
      return;
    }
    
    if (newUsername === user.username) {
      hideChangeUsernameModal();
      return;
    }
    
    // Notify server about username change
    socket.emit('changeUsername', newUsername, (error) => {
      if (error) {
        alert(error);
        return;
      }
      
      // Update local user object
      const oldUsername = user.username;
      user.username = newUsername;
      
      // Notify other users in the room
      socket.emit('usernameChanged', { oldUsername, newUsername });
      
      hideChangeUsernameModal();
    });
  };
  
  // Listen for username change event from server
  socket.on('usernameChanged', ({ userId, oldUsername, newUsername }) => {
    // Update messages from the user who changed their username
    const messageElements = chatMessages.querySelectorAll('.font-medium.text-sm');
    messageElements.forEach((element) => {
      if (element.textContent === oldUsername) {
        element.textContent = newUsername;
      }
    });
    
    // Update online users list if needed
    // This would require updating the online users UI
  });
  
  // Event bindings
  sendButton.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Change username modal events
  changeUsernameButton.addEventListener('click', showChangeUsernameModal);
  closeModalButton.addEventListener('click', hideChangeUsernameModal);
  cancelChangeButton.addEventListener('click', hideChangeUsernameModal);
  confirmChangeButton.addEventListener('click', changeUsername);
  
  newUsernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      changeUsername();
    }
  });
  
  // Close modal when clicking outside
  changeUsernameModal.addEventListener('click', (e) => {
    if (e.target === changeUsernameModal) {
      hideChangeUsernameModal();
    }
  });
});