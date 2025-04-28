//moveRoutes.js
const express = require('express');
const router = express.Router();
const {
  createMove,
  getMovesByGame
} = require('../controllers/moveController');

// Oyuna katılma ya da yeni oyun oluşturma
router.post('/create-Move', createMove);
router.post('/getmovesbygame', getMovesByGame);
module.exports = router;