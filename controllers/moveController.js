const { validateWord, letterScore, getTileBonus, applyBonus } = require('../utils/wordUtils');
const Move = require('../models/Move');
const Game = require('../models/Game');

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
    if (!game) {
      console.error(`Game with ID ${gameId} not found`);
      return res.status(404).json({ message: 'Game bulunamadı.' });
    }

    // 2) Oyuncu sırası kontrolü
    if (game.lastPlayerId === playerId) {
      return res.status(400).json({ message: 'Sıra diğer oyuncuda.' });
    }
    game.lastPlayerId = playerId;

    // Eğer game.board yoksa başlat
    if (!game.board) {
      game.board = Array(15).fill().map(() => Array(15).fill(''));
    }

    // 3) Aynı koordinata birden fazla harf koyulmasın
    const coordSet = new Set();
    for (const { x, y } of placed) {
      const key = `${x},${y}`;
      if (coordSet.has(key)) {
        return res.status(400).json({ message: `Aynı koordinata birden fazla harf koyulamaz: (${x},${y})` });
      }
      coordSet.add(key);
    }

    // 4) Geçersiz koordinatlar kontrolü
    placed.forEach(({ x, y }) => {
      if (!inBounds(x, y)) {
        console.error(`Invalid coordinates: x: ${x}, y: ${y}`);
        return res.status(400).json({ message: `Geçersiz koordinatlar: x: ${x}, y: ${y}` });
      }
    });
    

    // 5) Tahtayı geçici olarak güncelle (önce çakışma var mı kontrol et)
    for (const { x, y, letter } of placed) {
      if (game.board[x][y] !== '') {
        return res.status(400).json({ message: `(${x}, ${y}) konumunda zaten bir harf var.` });
      }
      game.board[x][y] = letter;
    }

    // 6) Kelime bulma işlemi
    const directions = [
      { dx: 1, dy: 0 },  // Yatay
      { dx: 0, dy: 1 },  // Dikey
    ];

    const foundWords = []; // Bulunan kelimeleri tutacağımız array

    // Komşuluk ve kelime kontrolü
    placed.forEach(({ x, y }) => {
      directions.forEach(({ dx, dy }) => {
        let bx = x, by = y;

        // Taramanın başladığı noktayı bul: boş hücreleri geç
        while (inBounds(bx - dx, by -dy) && game.board[bx - dx][by - dy] !== '') {
          bx -= dx; by -= dy;
        }

        // Kelimeyi oluştur ve koordinatları topla
        let word = '', coords = [];
        let cx = bx, cy = by;

        while (inBounds(cx, cy) && game.board[cx][cy] !== '') {
          word += game.board[cx][cy];
          coords.push({ x: cx, y: cy });
          cx += dx; cy += dy;
        }

        if (word.length > 1) {
          foundWords.push({ word, coords });
        }
      });
    });

    // 7) Geçersiz kelime kontrolü: Hem yerleştirilen kelimenin, hem de etrafındaki komşulukları kontrol et
    for (const { word, coords } of foundWords) {
      if (!validateWord(word)) {
        // Geçersiz kelime bulundu, tahtadan geri al
        placed.forEach(({ x, y }) => {
          game.board[x][y] = '';  // Yerleştirilen harfleri geri al
        });
        return res.status(400).json({ message: `Geçersiz kelime oluşturuluyor: ${word}` });
      }
    }

    // 8) Geçerli kelimeleri puanla
    let totalPoints = 0;
    const validWords = [];

    for (const { word, coords } of foundWords) {
      if (validateWord(word)) {
        let wordPoints = 0;

        coords.forEach(({ x, y }) => {
          let letterPts = letterScore(game.board[x][y]);
          const bonusType = getTileBonus(x, y);
          if (bonusType) {
            letterPts = applyBonus(letterPts, bonusType);
          }
          wordPoints += letterPts;
        });

        totalPoints += wordPoints;
        validWords.push({ word, coords, points: wordPoints });
      }
    }

    // 9) Move kaydet ve oyunu güncelle
    const move = await Move.create({
      gameId: game._id,
      playerId,
      placed,
      validWords,
      totalPoints
    });

    game.score += totalPoints;

    if (!game.moves) {
      game.moves = [];
    }

    game.moves.push({ playerId, placed });

    // Valid kelimeleri tüm oyuna ekle
    if (!game.allValidWords) {
      game.allValidWords = [];
    }
    game.allValidWords.push(...validWords);

    await game.save();

    // 10) Yanıt dön
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
