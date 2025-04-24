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

    console.log("Game found:", game);  // Debugging step

    // Eğer game.board yoksa başlat
    if (!game.board) {
      game.board = Array(15).fill().map(() => Array(15).fill(''));
    }

    // 2) Geçersiz koordinatlar kontrolü
    placed.forEach(({ x, y }) => {
      if (!inBounds(x, y)) {
        console.error(`Invalid coordinates: x: ${x}, y: ${y}`);
        return res.status(400).json({ message: `Geçersiz koordinatlar: x: ${x}, y: ${y}` });
      }
    });

    // 3) Tahtayı güncelle
    placed.forEach(({ x, y, letter }) => {
      if (inBounds(x, y)) {
        game.board[x][y] = letter;
      }
    });

    // 4) Yatay ve dikey kelime tarama
    const directions = [
      { dx: 1, dy: 0 },  // Yatay (soldan sağa)
      { dx: 0, dy: 1 },  // Dikey (yukarıdan aşağıya)
      { dx: -1, dy: 0 }, // Yatay (sağdan sola)
      { dx: 0, dy: -1 }, // Dikey (aşağıdan yukarıya)
    ];

    const foundSet = new Set();

    placed.forEach(({ x, y, letter }) => {
      directions.forEach(({ dx, dy }) => {
        let bx = x, by = y;

        // Taramanın başladığı noktayı bul: boş hücreleri geç
        while (inBounds(bx - dx, by - dy) && game.board[bx - dx][by - dy] !== '') {
          bx -= dx; by -= dy;
        }

        // Kelimeyi oluştur ve koordinatları topla
        let word = '', coords = [];
        let cx = bx, cy = by;

        // Yatay ve dikey tarama: Başlangıç noktasından itibaren devam et
        while (inBounds(cx, cy) && game.board[cx][cy] !== '') {
          word   += game.board[cx][cy];
          coords.push({ x: cx, y: cy });
          cx += dx; cy += dy;
        }

        // Kelime uzunluğu > 1 olduğunda geçerli kelimeyi ekle
        if (word.length >= 1) {  // Kelime en az 2 harf olmalı
          foundSet.add(JSON.stringify({ word, coords }));
        }
      });
    });

    // 5) Geçerli kelimeleri filtrele ve puanla
    let totalPoints = 0;
    const validWords = [];
    for (const json of foundSet) {
      const { word, coords } = JSON.parse(json);
      if (validateWord(word)) {
        let wordPoints = 0;

        // Her bir harfi kontrol et ve bonus taşları uygulayarak puan hesapla
        coords.forEach(({ x, y }) => {
          let letterPts = letterScore(game.board[x][y]);

          // Bonus taşlarını kontrol et ve puanı uygula
          const bonusType = getTileBonus(x, y);
          if (bonusType) {
            letterPts = applyBonus(letterPts, bonusType);  // Bonus türüne göre puanı uygula
          }

          wordPoints += letterPts;
        });

        totalPoints += wordPoints;
        validWords.push({ word, coords, points: wordPoints });
      }
    }

    // 6) Move kaydet ve oyunu güncelle
    const move = await Move.create({
      gameId: game._id,
      playerId,
      placed,
      validWords,
      totalPoints
    });

    // 7) Game skorunu ve hareket geçmişini güncelle
    game.score += totalPoints;

    // Game.moves'i kontrol et
    console.log("Before checking moves:", game.moves);  // Debugging step

    // Ensure moves array is initialized
    if (!game.moves) {
      game.moves = [];  // Initialize moves if it's undefined
    }

    console.log("After ensuring moves:", game.moves);  // Debugging step

    game.moves.push({ playerId, placed });
    await game.save();

    // 8) Yanıt dön
    return res.status(201).json({
      move,
      board: game.board,
      score: game.score
    });

  } catch (error) {
    console.error('Error in createMove function:', error);
    return res.status(500).json({ message: 'Sunucu hatası.', error: error.message });
  }
}

module.exports = {
  createMove,
};
