const express = require('express');
const router = express.Router();
const moveController = require('../controllers/moveController');

// Hamle işlemleri
router.post('/createMove', moveController.createMove);

module.exports = router;
