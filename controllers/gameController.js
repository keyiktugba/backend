//controllers/gameController.js
const Game = require('../models/Game');
const User = require('../models/User');
const mineTypes = [
  { type: 'puan_bolunmesi', weight: 5, count: 5 },
  { type: 'puan_transferi', weight: 4, count: 4 },
  { type: 'harf_kaybi', weight: 3, count: 3 },
  { type: 'ekstra_hamle_engeli', weight: 2, count: 2 },
  { type: 'kelime_iptali', weight: 2, count: 2 }
];
const rewardTypes = [
  { type: 'bolge_yasagi', weight: 2, count: 2 },
  { type: 'harf_yasagi', weight: 3, count: 3 },
  { type: 'ekstra_hamle', weight: 2, count: 2 }
];
const getRandomWeightedType = (types) => {
  const totalWeight = types.reduce((sum, item) => sum + item.weight, 0);
  let randomWeight = Math.random() * totalWeight;
  for (let i = 0; i < types.length; i++) {
    randomWeight -= types[i].weight;
    if (randomWeight <= 0) {
      return types[i].type;
    }
  }
};
function generateRandomCoordinates(count, boardSize = 15) {
  const coordinates = new Set();
  while (coordinates.size < count) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    coordinates.add(`${row},${col}`);
  }
  return Array.from(coordinates).map(coord => {
    const [row, col] = coord.split(',').map(Number);
    return { row, col };
  });
}
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
      if (game.players.length === 2) {
        game.isActive = true;
        game.startedAt = Date.now();
        game.currentTurn = game.players[0];
        game.endedAt = null;
        let mineCoords = [];
        let rewardCoords = [];
        mineTypes.forEach(mine => {
          mineCoords = mineCoords.concat(generateRandomCoordinates(mine.count));
        });
        rewardTypes.forEach(reward => {
          rewardCoords = rewardCoords.concat(generateRandomCoordinates(reward.count));
        });
        game.mines = mineCoords.map(({ row, col }) => ({
          row,
          col,
          type: getRandomWeightedType(mineTypes)
        }));
        game.rewards = rewardCoords.map(({ row, col }) => ({
          row,
          col,
          type: getRandomWeightedType(rewardTypes)
        }));
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
        currentTurn: game.currentTurn,
        mines: game.mines, 
        rewards: game.rewards 
      });
    } else {
      game = new Game({
        players: [userId],
        type,
        isActive: false,
        startedAt: null,
        currentTurn: userId,
        endedAt: null,
        mines: [], 
        rewards: []
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
        currentTurn: game.currentTurn,
        mines: game.mines, 
        rewards: game.rewards 
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
    .populate('currentTurn', 'username')
    .populate('scores.player', 'username');
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
      const userScoreEntry = game.scores.find(s => s.player._id.toString() === userId);
      const opponentScoreEntry = game.scores.find(s => s.player._id.toString() !== userId);
      const userScore = userScoreEntry?.score || 0;
      const opponentScore = opponentScoreEntry?.score || 0;
      let result = 'berabere';
      if (userScore > opponentScore) {
        result = 'kazandın';
      } else if (userScore < opponentScore) {
        result = 'kaybettin';
      }
      return {
        id: game._id,
        gameType: game.type,
        userScore,
        opponentUsername: opponentScoreEntry?.player?.username || 'Bilinmiyor',
        opponentScore,
        result
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
exports.surrenderGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    if (!game.isActive || game.endedAt) {
      return res.status(400).json({ message: 'Game is already ended' });
    }
    const otherPlayer = game.players.find(p => p.toString() !== userId); 
    game.isActive = false;
    game.endedAt = new Date();
    game.winner = otherPlayer || null;
    await game.save();
    res.json({ message: 'Game ended by surrender', winner: otherPlayer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Surrender failed', error: error.message });
  }
};