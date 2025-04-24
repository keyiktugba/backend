const express = require('express');
const router = express.Router();
const {createMove} = require('../controllers/moveController');

// Hamle işlemleri
router.post('/create-Move', createMove);

module.exports = router;
