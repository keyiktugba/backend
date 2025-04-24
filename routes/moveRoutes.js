//moveRoutes.js
const express = require('express');
const router = express.Router();
const {
  createMove
} = require('../controllers/moveController');

// Oyuna katılma ya da yeni oyun oluşturma
router.post('/create-Move', createMove);

module.exports = router;