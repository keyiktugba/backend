//gameRoutes.js
const express = require('express');
const router = express.Router();
const {
  joinOrCreateGame,
  getActiveGames,
  getCompletedGames,
  getAllGames,
  getGameById,
  surrenderGame
} = require('../controllers/gameController');

// Oyuna katılma ya da yeni oyun oluşturma
router.post('/join-or-create', joinOrCreateGame);

// Aktif oyunları getirme
router.get('/active', getActiveGames);

// Biten oyunları getirme
router.get('/completed', getCompletedGames);

// Tüm oyunları getirme
router.get('/all', getAllGames);

// Tekil oyun bilgisi getirme (gameId ile)
router.get('/:id', getGameById);

//oyunu bitirmek için
router.post('/:id/surrender', surrenderGame);

module.exports = router;
