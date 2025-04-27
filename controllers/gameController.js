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
      game.players.push(userId);
      game.isActive = true;
      game.startedAt = Date.now();
      game.currentTurn = game.players[0];
      game.endedAt = null;
      await game.save();

      return res.json({
        message: 'Joined the game, game started',
        gameId: game._id,
        players: game.players,
        type: game.type,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        isActive: game.isActive,
        currentTurn: game.currentTurn
      });
    } else {
      game = new Game({
        players: [userId],
        type,
        isActive: false,
        startedAt: Date.now(),
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
    const game = await Game.findById(req.params.id);
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