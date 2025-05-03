const express = require('express');
const router = express.Router();
const {
  addWord,
  listWords,
  verifyWord,
  searchWords,
} = require('../controllers/wordController');


router.post('/', addWord);

router.get('/', listWords);

router.get('/verify/:word', verifyWord);

router.get('/search', searchWords);

module.exports = router;
