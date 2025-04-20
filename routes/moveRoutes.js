const express = require('express');
const router = express.Router();
const moveController = require('../controllers/moveController');

// Hamle işlemleri
router.post('/', moveController.createMove);
router.get('/game/:oyunId', moveController.getMovesByGame);
router.get('/player/:oyunId/:kullaniciId', moveController.getMovesByPlayer);
router.get('/:id', moveController.getMoveById);
router.put('/:id', moveController.updateMove);
router.get('/mines/triggered', moveController.getMineTriggeredMoves);
router.get('/rewards/earned', moveController.getRewardEarnedMoves);
router.get('/words/stats', moveController.getWordStats);
router.get('/game/:oyunId/last', moveController.getLastMoveByGame);
router.delete('/:id', moveController.deleteMove);

module.exports = router;
