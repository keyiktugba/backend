const express = require('express');
const router = express.Router();

// Import routes
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const wordRoutes = require('./routes/wordRoutes');
const moveRoutes = require('./routes/moveRoutes');

// Use routes
router.use('/users', userRoutes);
router.use('/games', gameRoutes);
router.use('/words', wordRoutes);
router.use('/moves', moveRoutes);

module.exports = router;