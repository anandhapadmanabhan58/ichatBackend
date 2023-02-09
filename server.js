const express = require('express');
const dotenv = require('dotenv');
const chats = require('./data/data');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bodyParser = require('body-parser');
const path = require('path');
const { notFound, errorHandler } = require('./middlewares/error');
const messageRoutes = require('./routes/messageRoutes');
const { Socket } = require('socket.io');
const cors = require('cors');
dotenv.config();

connectDB();

const app = express();
app.use(
  cors({
    origin: '*',
  })
);
app.use(bodyParser.json());
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/message', messageRoutes);

const __dirname1 = path.resolve();

// app.use(express.static(path.join(__dirname1, 'build')));

// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname1, 'build', 'index.html'));
// });

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('server started');
});
const io = require('socket.io')(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000',
  },
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData) => {
    console.log(userData.id);
    socket.join(userData.id);
    socket.emit('connection');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('user joined ' + room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageRecieved) => {
    let chat = newMessageRecieved.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit('message recieved', newMessageRecieved);
    });
  });
});
