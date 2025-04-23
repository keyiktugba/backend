// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const {
  createGame,
  joinGame,
  getGame,
  verifyWord,
  getActiveGames
} = require('../controllers/gameController');

// Yeni oyun başlat
router.post('/start', createGame);

// Oyuna katıl
router.post('/join', joinGame);

// Oyun bilgisini getir
router.get('/:id', getGame);

// Kelime doğrulama
router.post('/verify-word', verifyWord);

// Aktif oyunları listele
router.get('/', getActiveGames);

module.exports = router;
