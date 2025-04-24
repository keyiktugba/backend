const Move = require('../models/Move');
const Game = require('../models/Game');
const { validateWord, letterScore } = require('../utils/wordUtils');

// Tahta sınır kontrolü
function inBounds(x, y) {
  return x >= 0 && x < 15 && y >= 0 && y < 15;
}

// Hamle işleme
async function createMove(req, res) {
  try {
    const { gameId, playerId, placed } = req.body;

    // 1) Oyunu al
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game bulunamadı.' });

    // 2) Tahtayı güncelle
    placed.forEach(({ x, y, letter }) => {
      if (inBounds(x, y)) game.board[x][y] = letter;
    });

    // 3) Kelime taraması
    const directions = [
      { dx:  1, dy:  0 },
      { dx:  0, dy:  1 }
    ];
    const foundSet = new Set();

    placed.forEach(({ x, y }) => {
      directions.forEach(({ dx, dy }) => {
        // Başlangıç noktasını bul (geriye boşluk/Past cell)
        let bx = x, by = y;
        while (inBounds(bx - dx, by - dy) && game.board[bx - dx][by - dy] !== '') {
          bx -= dx; by -= dy;
        }
        // İleri tara, kelimeyi ve koordinatları topla
        let word = '', coords = [];
        let cx = bx, cy = by;
        while (inBounds(cx, cy) && game.board[cx][cy] !== '') {
          word   += game.board[cx][cy];
          coords.push({ x: cx, y: cy });
          cx += dx; cy += dy;
        }
        if (word.length > 1) {
          foundSet.add(JSON.stringify({ word, coords }));
        }
      });
    });

    // 4) Geçerli kelimeleri filtrele ve puanla
    let totalPoints = 0;
    const validWords = [];
    for (const json of foundSet) {
      const { word, coords } = JSON.parse(json);
      if (validateWord(word)) {
        const pts = coords.reduce((sum, { x, y }) => sum + letterScore(game.board[x][y]), 0);
        totalPoints += pts;
        validWords.push({ word, coords, points: pts });
      }
    }

    // 5) Move kaydet
    const move = await Move.create({
      gameId,
      playerId,
      placed,
      validWords,
      totalPoints
    });

    // 6) Game skorunu ve hareket geçmişini güncelle
    game.score += totalPoints;
    game.moves.push({ playerId, placed });
    await game.save();

    // 7) Yanıt dön
    return res.status(201).json({
      move,
      board: game.board,
      score: game.score
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
}
function getMovesByGame(req, res) {
  res.send('getMovesByGame');
}

function getMovesByPlayer(req, res) {
  res.send('getMovesByPlayer');
}

function getMoveById(req, res) {
  res.send('getMoveById');
}

function updateMove(req, res) {
  res.send('updateMove');
}

function getMineTriggeredMoves(req, res) {
  res.send('getMineTriggeredMoves');
}

function getRewardEarnedMoves(req, res) {
  res.send('getRewardEarnedMoves');
}

function getWordStats(req, res) {
  res.send('getWordStats');
}

function getLastMoveByGame(req, res) {
  res.send('getLastMoveByGame');
}

function deleteMove(req, res) {
  res.send('deleteMove');
}

module.exports = {
  createMove,
  getMovesByGame,
  getMovesByPlayer,
  getMoveById,
  updateMove,
  getMineTriggeredMoves,
  getRewardEarnedMoves,
  getWordStats,
  getLastMoveByGame,
  deleteMove
};

