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

    // 3) Tahtayı geçici olarak güncelle (geçici olarak yerleştir)
    placed.forEach(({ x, y, letter }) => {
      if (inBounds(x, y)) {
        game.board[x][y] = letter;
      }
    });

    // 4) Yalnızca soldan sağa ve yukarıdan aşağıya kelime tarama
    const directions = [
      { dx: 1, dy: 0 },  // Yatay (soldan sağa)
      { dx: 0, dy: 1 },  // Dikey (yukarıdan aşağıya)
    ];

    const foundWords = []; // Bulunan kelimeleri tutacağımız array

    // Komşuluk ve kelime kontrolü
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

        // Yalnızca yatay ve dikey yönlerde tarama
        while (inBounds(cx, cy) && game.board[cx][cy] !== '') {
          word   += game.board[cx][cy];
          coords.push({ x: cx, y: cy });
          cx += dx; cy += dy;
        }

        // Kelime uzunluğu > 1 olduğunda geçerli kelimeyi ekle
        if (word.length > 1 && validateWord(word)) {  // Kelime en az 2 harf olmalı
          foundWords.push({ word, coords });
        }
      });
    });

    // Bulunan kelimeleri yazdır
    console.log("Bulunan Kelimeler:", foundWords);

    // 5) Geçersiz kelimeler varsa hata mesajı
    for (const { word } of foundWords) {
      if (!validateWord(word)) {  // Eğer kelime geçerli değilse
        // Geçersiz kelime bulundu, tahtadan geri al
        placed.forEach(({ x, y }) => {
          game.board[x][y] = '';  // Yerleştirilen kelimeyi geri al
        });
        return res.status(400).json({ message: `Geçersiz kelime oluşturuluyor: ${word}` });
      }
    }

    // 6) Geçerli kelimeleri filtrele ve puanla
    let totalPoints = 0;
    const validWords = [];
    for (const { word, coords } of foundWords) {
      if (validateWord(word)) {
        let wordPoints = 0;

        // Her bir harfi kontrol et ve bonus taşlarını uygulayarak puan hesapla
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

    // 7) Move kaydet ve oyunu güncelle
    const move = await Move.create({
      gameId: game._id,
      playerId,
      placed,
      validWords,
      totalPoints
    });

    // 8) Game skorunu ve hareket geçmişini güncelle
    game.score += totalPoints;

    // Game.moves'i kontrol et
    if (!game.moves) {
      game.moves = [];  // Initialize moves if it's undefined
    }

    game.moves.push({ playerId, placed });
    await game.save();

    // 9) Yanıt dön
    return res.status(201).json({
      move,
      board: game.board,
      score: game.score,
      foundWords  // Bulunan kelimeleri JSON yanıtında ekleyelim
    });

  } catch (error) {
    console.error('Error in createMove function:', error);
    return res.status(500).json({ message: 'Sunucu hatası.', error: error.message });
  }
}

module.exports = {
  createMove,
};
