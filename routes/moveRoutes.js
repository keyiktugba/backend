const express = require('express');
const router = express.Router();
const {createMove} = require('../controllers/moveController');

// Hamle işlemleri
router.post('/createMove', createMove);

module.exports = router;
