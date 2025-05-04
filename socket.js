// socket.js
const socketIo = require('socket.io');

function setupSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı', socket.id);

    socket.on('join-game', (gameId) => {
      socket.join(gameId);
      console.log(`Kullanıcı ${socket.id} ${gameId} odasına katıldı`);
    });

    socket.on('leave-game', (gameId) => {
      socket.leave(gameId);
      console.log(`Kullanıcı ${socket.id} ${gameId} odasından ayrıldı`);
    });

    socket.on('game-move', (data) => {
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

  return io;
}

module.exports = setupSocket;