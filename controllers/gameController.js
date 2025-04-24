const Game = require('../models/Game');
const User = require('../models/User');

exports.joinOrCreateGame = async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    // 1) Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    // 2) Bekleyen bir oyun var mı? (tek oyunculu, başlamamış)
    let game = await Game.findOne({ 
      isActive: false, 
      players: { $size: 1 } 
    });

    if (game) {
      // 3a) Eğer varsa: Oyuncuyu ekle, oyunu başlat
      game.players.push(userId);
      game.isActive = true;
      game.startedAt = Date.now();
      game.currentTurn = game.players[0]; // İlk oyuncu başlasın
      game.endedAt = null;  // Oyun bitişi başlangıçta null olmalı
      await game.save();

      return res.json({
        message: 'Oyuna katıldınız, oyun başladı',
        gameId: game._id,
        players: game.players,
        type: game.type,
        startedAt: game.startedAt,
        endedAt: game.endedAt,  // Bitiş zamanı
        isActive: game.isActive,
        currentTurn: game.currentTurn
      });
    } else {
      // 3b) Bekleyen oyun yoksa: Yeni oyun oluştur
      game = new Game({
        players: [userId],
        type,
        isActive: false,      // Diğer oyuncu bekleniyor
        startedAt: Date.now(),
        currentTurn: userId,  // İlk oyuncu sıra sahibi (Ama oyun başlamadı)
        endedAt: null         // Oyun bitişi başlangıçta null
      });

      await game.save();

      return res.status(201).json({
        message: 'Yeni oyun oluşturuldu, diğer oyuncuyu bekleniyor',
        gameId: game._id,
        players: game.players,
        type: game.type,
        startedAt: game.startedAt,
        endedAt: game.endedAt,    // Bitiş zamanı
        isActive: game.isActive,
        currentTurn: game.currentTurn
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Aktif Oyunları Getirme
exports.getActiveGames = async (req, res) => {
  try {
    const activeGames = await Game.find({ isActive: true });
    res.json(activeGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


// Biten Oyunları Getirme
exports.getCompletedGames = async (req, res) => {
  try {
    const completedGames = await Game.find({ endedAt: { $ne: null } });
    res.json(completedGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Tüm Oyunları Getirme
exports.getAllGames = async (req, res) => {
  try {
    const allGames = await Game.find();
    res.json(allGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
