const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const translateText = require('./translate');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const users = {}; // { socket.id: { username, room, language } }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room with username and language
  socket.on('join_room', ({ username, room, language }) => {
    socket.join(room);
    users[socket.id] = { username, room, language };
    console.log(`${username} joined ${room} with language ${language}`);

    socket.to(room).emit('user_joined', {
      user: username,
      message: `${username} has joined the chat.`,
    });
  });

  // Handle incoming chat message
  socket.on('chat_message', async ({ text }) => {
    const user = users[socket.id];
    if (!user) return;

    const { room, username } = user;

    // Translate and emit message to each user in room
    const clients = await io.in(room).fetchSockets();

    clients.forEach(async (client) => {
      const recipient = users[client.id];
      if (recipient && client.id !== socket.id) {
        const translatedText = await translateText(text, recipient.language);
        io.to(client.id).emit('chat_message', {
          original: text,
          translated: translatedText,
          from: username,
          to: recipient.username,
        });
      }
    });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit('user_left', {
        user: user.username,
        message: `${user.username} has left the chat.`,
      });
      delete users[socket.id];
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
