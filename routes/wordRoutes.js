const express = require('express');
const router = express.Router();
const Word = require('../models/Word');

// @desc    Kelime ekle
// @route   POST /api/words
// @access  Admin
router.post('/', async (req, res) => {
  try {
    const { word, difficulty, category, language } = req.body;
    
    // Kelime kontrolü
    const wordExists = await Word.findOne({ word: word.toLowerCase() });
    if (wordExists) {
      return res.status(400).json({ message: 'Bu kelime zaten mevcut' });
    }
    
    // Yeni kelime oluştur
    const newWord = await Word.create({
      word: word.toLowerCase(),
      length: word.length,
      difficulty: difficulty || 'medium',
      category: category || 'general',
      language: language || 'tr'
    });
    
    res.status(201).json(newWord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Kelimeleri listele
// @route   GET /api/words
// @access  Admin
router.get('/', async (req, res) => {
  try {
    const { difficulty, category, language, length } = req.query;
    const filter = {};
    
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (language) filter.language = language;
    if (length) filter.length = parseInt(length);
    
    const words = await Word.find(filter).limit(100);
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Kelime doğrula
// @route   GET /api/words/verify/:word
// @access  Public
router.get('/verify/:word', async (req, res) => {
  try {
    const word = req.params.word.toLowerCase();
    const wordExists = await Word.findOne({ word });
    
    if (wordExists) {
      res.json({ valid: true, word: wordExists });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Kelime ara
// @route   GET /api/words/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Arama sorgusu gereklidir' });
    }
    
    const words = await Word.find({
      word: { $regex: new RegExp(q, 'i') }
    }).limit(20);
    
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;