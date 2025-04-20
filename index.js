const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Express app initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://medihatugbakeyik:Hh5U8sFS421LnavH@wordmine1.klza6gv.mongodb.net/wordmines")
  .then(() => console.log("MongoDB bağlantısı başarılı"))
  .catch(err => console.error("MongoDB bağlantı hatası:", err));

// Basic route
app.get('/', (req, res) => {
  res.send('Kelime Mayınları API çalışıyor');
});

// API routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/words', require('./routes/wordRoutes'));
app.use('/api/moves', require('./routes/moveRoutes'));

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı', socket.id);
  
  // Game related events
  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    console.log(`Kullanıcı ${socket.id} ${gameId} odasına katıldı`);
  });
  
  socket.on('leave-game', (gameId) => {
    socket.leave(gameId);
    console.log(`Kullanıcı ${socket.id} ${gameId} odasından ayrıldı`);
  });
  
  socket.on('game-move', (data) => {
    // Broadcast the move to all players in the game room
    io.to(data.gameId).emit('move-made', {
      playerId: data.playerId,
      move: data.move
    });
  });
  
  socket.on('word-found', (data) => {
    io.to(data.gameId).emit('word-found', {
      playerId: data.playerId,
      word: data.word,
      points: data.points
    });
  });
  
  socket.on('game-over', (data) => {
    io.to(data.gameId).emit('game-over', {
      winnerId: data.winnerId,
      scores: data.scores
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});