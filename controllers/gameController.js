// controllers/gameController.js
const Game = require('../models/Game');
const User = require('../models/User');
const Word = require('../models/Word');

// Yeni oyun oluştur
exports.createGame = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Yeni oyun oluştur
    const game = await Game.create({
      players: [userId],
      status: 'waiting',
      currentTurn: userId
    });
    
    res.status(201).json({
      gameId: game._id,
      status: game.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oyuna katıl
exports.joinGame = async (req, res) => {
  try {
    const { gameId, userId } = req.body;
    
    // Oyun kontrolü
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Oyun bulunamadı' });
    }
    
    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Oyun dolu mu kontrolü
    if (game.players.length >= 2) {
      return res.status(400).json({ message: 'Oyun dolu' });
    }
    
    // Kullanıcı zaten oyunda mı kontrolü
    if (game.players.includes(userId)) {
      return res.status(400).json({ message: 'Zaten bu oyundasınız' });
    }
    
    // Oyuna katıl
    game.players.push(userId);
    
    // Oyun başlatılabilir mi kontrolü
    if (game.players.length === 2) {
      game.status = 'active';
      game.startedAt = Date.now();
      
      // Basit bir tahta oluştur (gerçek uygulamada daha karmaşık olabilir)
      const board = generateGameBoard();
      game.board = board;
    }
    
    await game.save();
    
    res.json({
      gameId: game._id,
      status: game.status,
      players: game.players,
      board: game.board
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Oyun bilgisini getir
exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('players', 'username')
      .populate('currentTurn', 'username')
      .populate('winner', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Oyun bulunamadı' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kelime doğrulama
exports.verifyWord = async (req, res) => {
  try {
    const { gameId, userId, word } = req.body;
    
    // Kelimeyi kontrol et
    const wordExists = await Word.findOne({ word: word.toLowerCase() });
    
    // Oyunu güncelle
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Oyun bulunamadı' });
    }
    
    // Kullanıcı sırası kontrolü
    if (game.currentTurn.toString() !== userId) {
      return res.status(400).json({ message: 'Şu anda sıra sizde değil' });
    }
    
    // Oyun aktif mi kontrolü
    if (game.status !== 'active') {
      return res.status(400).json({ message: 'Oyun aktif değil' });
    }
    
    let result = false;
    let points = 0;
    
    if (wordExists) {
      // Kelime geçerli
      result = true;
      points = word.length; // Basit bir puan hesabı
      game.score.set(userId, (game.score.get(userId) || 0) + points);
      
      // Bulunan kelimeleri kaydet
      const wordsFound = game.wordsFound.get(userId) || [];
      wordsFound.push(word);
      game.wordsFound.set(userId, wordsFound);
      
      // Sırayı diğer oyuncuya ver
      const otherPlayer = game.players.find(player => player.toString() !== userId);
      if (otherPlayer) {
        game.currentTurn = otherPlayer;
      }
    } else {
      // Kelime geçersiz
      result = false;
    }
    
    await game.save();
    
    res.json({
      result,
      points,
      currentScore: game.score.get(userId) || 0,
      currentTurn: game.currentTurn
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Aktif oyunları listele
exports.getActiveGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'waiting' })
      .populate('players', 'username')
      .limit(10);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yardımcı fonksiyon
function generateGameBoard() {
  const size = 5;
  const board = [];
  const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
  
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      row.push(alphabet[randomIndex]);
    }
    board.push(row);
  }
  
  return board;
}
