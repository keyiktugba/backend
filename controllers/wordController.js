const Word = require('../models/Word');
const asyncHandler = require('express-async-handler');

const addWord = asyncHandler(async (req, res) => {
  const { word, difficulty, category, language } = req.body;

  const wordExists = await Word.findOne({ word: word.toLowerCase() });
  if (wordExists) {
    return res.status(400).json({ message: 'Bu kelime zaten mevcut' });
  }
  const newWord = await Word.create({
    word: word.toLowerCase(),
    length: word.length,
    difficulty: difficulty || 'medium',
    category: category || 'general',
    language: language || 'tr'
  });

  res.status(201).json(newWord);
});
const listWords = asyncHandler(async (req, res) => {
  const { difficulty, category, language, length } = req.query;
  const filter = {};

  if (difficulty) filter.difficulty = difficulty;
  if (category) filter.category = category;
  if (language) filter.language = language;
  if (length) filter.length = parseInt(length);

  const words = await Word.find(filter).limit(100);
  res.json(words);
});
const verifyWord = asyncHandler(async (req, res) => {
  const word = req.params.word.toLowerCase();
  const wordExists = await Word.findOne({ word });

  if (wordExists) {
    res.json({ valid: true, word: wordExists });
  } else {
    res.json({ valid: false });
  }
});
const searchWords = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Arama sorgusu gereklidir' });
  }
  const words = await Word.find({
    word: { $regex: new RegExp(q, 'i') }
  }).limit(20);

  res.json(words);
});
module.exports = {
  addWord,
  listWords,
  verifyWord,
  searchWords,
};
