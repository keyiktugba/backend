const { validateWord, letterScore, getTileBonus, applyBonus } = require('../utils/wordUtils');
const Move = require('../models/Move');
const Game = require('../models/Game');

function inBounds(x, y) {
  return x >= 0 && x < 15 && y >= 0 && y < 15;
}

async function createMove(req, res) {
  try {
    const { gameId, playerId, placed } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game bulunamadı.' });

    if (game.lastPlayerId === playerId)
      return res.status(400).json({ message: 'Sıra diğer oyuncuda.' });
    
    game.lastPlayerId = playerId;

    if (!game.board) {
      game.board = Array(15).fill().map(() => Array(15).fill(''));
    }

    const coordSet = new Set();
    for (const { x, y } of placed) {
      const key = `${x},${y}`;
      if (coordSet.has(key)) {
        return res.status(400).json({ message: `Aynı koordinata birden fazla harf koyulamaz: (${x},${y})` });
      }
      coordSet.add(key);
    }

    for (const { x, y } of placed) {
      if (!inBounds(x, y)) {
        return res.status(400).json({ message: `Geçersiz koordinatlar: x: ${x}, y: ${y}` });
      }
      if (game.board[x][y] !== '') {
        return res.status(400).json({ message: `(${x}, ${y}) konumunda zaten bir harf var.` });
      }
    }

    // Geçici board güncellemesi
    const tempBoard = JSON.parse(JSON.stringify(game.board));
    placed.forEach(({ x, y, letter }) => {
      tempBoard[x][y] = letter;
    });

    // Sınırları belirle (yalnızca ilgili alan taranacak)
    const xs = placed.map(p => p.x);
    const ys = placed.map(p => p.y);
    const minX = Math.max(0, Math.min(...xs) - 1);
    const maxX = Math.min(14, Math.max(...xs) + 1);
    const minY = Math.max(0, Math.min(...ys) - 1);
    const maxY = Math.min(14, Math.max(...ys) + 1);

    const foundWords = [];

    // Yatay kelime tarama
    for (let y = minY; y <= maxY; y++) {
      let word = '';
      let coords = [];
      for (let x = minX; x <= maxX + 1; x++) {
        const letter = tempBoard[x] && tempBoard[x][y];
        if (letter) {
          word += letter;
          coords.push({ x, y });
        } else if (word.length > 1) {
          foundWords.push({ word, coords });
          word = '';
          coords = [];
        } else {
          word = '';
          coords = [];
        }
      }
    }

    // Dikey kelime tarama
    for (let x = minX; x <= maxX; x++) {
      let word = '';
      let coords = [];
      for (let y = minY; y <= maxY + 1; y++) {
        const letter = tempBoard[x] && tempBoard[x][y];
        if (letter) {
          word += letter;
          coords.push({ x, y });
        } else if (word.length > 1) {
          foundWords.push({ word, coords });
          word = '';
          coords = [];
        } else {
          word = '';
          coords = [];
        }
      }
    }

    // Geçersiz kelime kontrolü
    for (const { word } of foundWords) {
      if (!validateWord(word)) {
        return res.status(400).json({ message: `Geçersiz kelime oluşturuluyor: ${word}` });
      }
    }

    // Puan hesapla
    let totalPoints = 0;
    const validWords = [];

    for (const { word, coords } of foundWords) {
      let wordPoints = 0;
      coords.forEach(({ x, y }) => {
        let letterPts = letterScore(tempBoard[x][y]);
        const bonusType = getTileBonus(x, y);
        if (bonusType) {
          letterPts = applyBonus(letterPts, bonusType);
        }
        wordPoints += letterPts;
      });
      totalPoints += wordPoints;
      validWords.push({ word, coords, points: wordPoints });
    }

    // Move oluştur
    const move = await Move.create({
      gameId: game._id,
      playerId,
      placed,
      validWords,
      totalPoints
    });

    // Asıl board'u güncelle
    placed.forEach(({ x, y, letter }) => {
      game.board[x][y] = letter;
    });

    game.score += totalPoints;
    game.moves = game.moves || [];
    game.moves.push({ playerId, placed });

    game.allValidWords = game.allValidWords || [];
    game.allValidWords.push(...validWords);

    await game.save();

    return res.status(201).json({
      move,
      board: game.board,
      score: game.score,
      foundWords
    });

  } catch (error) {
    console.error('Error in createMove function:', error);
    return res.status(500).json({ message: 'Sunucu hatası.', error: error.message });
  }
}

module.exports = {
  createMove,
};
