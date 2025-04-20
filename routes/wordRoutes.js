const express = require('express');
const router = express.Router();
const {
  addWord,
  listWords,
  verifyWord,
  searchWords,
} = require('../controllers/wordController');

// @desc    Kelime ekle
// @route   POST /api/words
// @access  Admin
router.post('/', addWord);

// @desc    Kelimeleri listele
// @route   GET /api/words
// @access  Admin
router.get('/', listWords);

// @desc    Kelime doğrula
// @route   GET /api/words/verify/:word
// @access  Public
router.get('/verify/:word', verifyWord);

// @desc    Kelime ara
// @route   GET /api/words/search
// @access  Public
router.get('/search', searchWords);

module.exports = router;
