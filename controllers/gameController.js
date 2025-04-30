//controllers/gameController.js
const Game = require('../models/Game');
const User = require('../models/User');

exports.joinOrCreateGame = async (req, res) => {
  try {
    const { userId, type } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let game = await Game.findOne({
      isActive: false, 
      players: { $size: 1 }, 
      type: type
    });

    if (game) {
      // Eğer bir oyun mevcutsa, oyuncuyu bu oyuna ekle
      game.players.push(userId);

      // Eğer 2 oyuncu olduysa, oyunu başlat
      if (game.players.length === 2) {
        game.isActive = true;
        game.startedAt = Date.now();  // Oyun başladı, bu noktada "startedAt" geçerli bir zamanla güncellenir
        game.currentTurn = game.players[0]; // İlk oyuncu başlar
        game.endedAt = null; // Bitiş zamanını sıfırla
      }
      
      await game.save();

      return res.json({
        message: game.players.length === 2 ? 'Game started' : 'Joined the game, waiting for another player',
        gameId: game._id,
        players: game.players,
        type: game.type,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        isActive: game.isActive,
        currentTurn: game.currentTurn
      });
    } else {
      // Eğer aktif bir oyun yoksa, yeni oyun oluştur
      game = new Game({
        players: [userId],
        type,
        isActive: false, // Bekleme durumunda
        startedAt: null,  // Başlangıç zamanını sıfırla, çünkü oyun henüz başlamadı
        currentTurn: userId,
        endedAt: null
      });

      await game.save();

      return res.status(201).json({
        message: 'New game created, waiting for another player',
        gameId: game._id,
        players: game.players,
        type: game.type,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        isActive: game.isActive,
        currentTurn: game.currentTurn
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('players', 'username')
      .populate('scores.player', 'username')
      .populate('currentTurn', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getActiveGames = async (req, res) => {
  try {
    const { userId } = req.query;

    const activeGames = await Game.find({
      isActive: true,
      players: { $in: [userId] }
    })
    .populate('players', 'username')
    .populate('currentTurn', 'username');

    res.json(activeGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getCompletedGames = async (req, res) => {
  try {
    const { userId } = req.query;

    const completedGames = await Game.find({
      endedAt: { $ne: null },
      players: userId
    })
    .populate('players', 'username')
    .populate('scores.player', 'username');

    const formattedGames = completedGames.map(game => {
      // En yüksek skoru alan oyuncuyu bul
      const highestScore = game.scores.reduce((max, current) => current.score > max.score ? current : max, game.scores[0]);

      return {
        id: game._id,
        gameName: `Oyun (${game.type})`, // burayı istersen daha güzel formatlayabiliriz
        winner: highestScore?.player?.username || 'Bilinmiyor'
      };
    });

    res.json(formattedGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getAllGames = async (req, res) => {
  try {
    const allGames = await Game.find();
    res.json(allGames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.passTurn = async (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;

  try {
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    // Sıra oyuncudaysa pas geçilebilir
    if (game.currentTurn.toString() !== playerId) {
      return res.status(403).json({ message: "Sıra sizde değil" });
    }

    const nextPlayer = game.players.find(p => p.toString() !== playerId);
    game.currentTurn = nextPlayer;
    await game.save();

    res.json({ message: "Sıra rakibe geçti", nextPlayer });
  } catch (err) {
    res.status(500).json({ message: "Pass işlemi başarısız", error: err });
  }
};
