//Game.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { validWordSchema } = require('../models/Move');

const gameSchema = new Schema({
  // Oyuna katılmış oyuncular (1 veya 2 kişi)
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Oyun süresi/ türü: 2dk, 5dk, 12saat, 24saat
  type: {
    type: String,
    enum: ['2dk', '5dk', '12saat', '24saat'],
    required: true
  },
  // Oyun oluşturulduğu veya başladığı zaman
  startedAt: {
    type: Date,
    default: Date.now,
    required: function() { return this.isActive; },
  },
  // Oyun bittiğinde set edilecek bitiş zamanı
  endedAt: {
    type: Date,
    default: null
  },
  // Oyunun aktif (başlamış ve iki oyunculu) olup olmadığı
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

  // Ödül bölgeleri: gizli ödül koordinatları
  rewards: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    type: {
      type: String,
      enum: ['bolge_yasagi', 'harf_yasagi', 'ekstra_hamle'],
      required: true
    }
  }],
  // Sıra hangi oyuncuda
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
  }]   
},
 {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
