const express = require('express');
const router = express.Router();

// Import routes
const userRoutes = require('./userRoutes');
const gameRoutes = require('./gameRoutes');
const wordRoutes = require('./wordRoutes');
const moveRoutes = require('./moveRoutes');

// Use routes
router.use('/users', userRoutes);
router.use('/games', gameRoutes);
router.use('/words', wordRoutes);
router.use('/moves', moveRoutes);

module.exports = router;