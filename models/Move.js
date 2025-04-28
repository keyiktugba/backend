const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    placed: [
      {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        letter: { type: String, required: true }
      }
    ],
    validWords: {
      type: [String],
      required: true
    },
    totalPoints: {
      type: Number,
      required: true
    },
    firstMove: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Move = mongoose.model('Move', moveSchema);

module.exports = Move;
