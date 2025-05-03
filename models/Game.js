//Game.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { validWordSchema } = require('../models/Move');

const gameSchema = new Schema({
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['2dk', '5dk', '12saat', '24saat'],
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    required: function() { return this.isActive; },
  },
  endedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  allValidWords: {
    type: [validWordSchema],
    default: []
  },
  mines: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: {
      type: String,
      enum: ['puan_bolunmesi', 'puan_transferi', 'harf_kaybi', 'ekstra_hamle_engeli', 'kelime_iptali'],
      required: true
    }
  }],
  rewards: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: {
      type: String,
      enum: ['bolge_yasagi', 'harf_yasagi', 'ekstra_hamle'],
      required: true
    }
  }],
  currentTurn: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: [{
    player: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  matchedMines: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: {
      type: String,
      enum: ['puan_bolunmesi', 'puan_transferi', 'harf_kaybi', 'ekstra_hamle_engeli', 'kelime_iptali'],
      required: true
    }
  }],
  matchedRewards: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: {
      type: String,
      enum: ['bolge_yasagi', 'harf_yasagi', 'ekstra_hamle'],
      required: true
    }
  }],
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }   
},
 {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
