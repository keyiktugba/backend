const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  oyun_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  kullanici_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kullanici_adi: String,
  kelime: String,
  koordinatlar: [{
    x: Number,
    y: Number,
    harf: String
  }],
  puan: {
    type: Number,
    default: 0
  },
  hamle_zamani: {
    type: Date,
    default: Date.now
  },
  sira_no: {
    type: Number,
    required: true
  },
  hamle_turu: {
    type: String,
    enum: ['kelime', 'pas', 'teslim', 'harf_tasima'],
    default: 'kelime'
  },
  
  // Mayın etkisi
  mayin: {
    tetiklendi_mi: {
      type: Boolean,
      default: false
    },
    tip: String,
    etki: String
  },
  
  // Ödül etkisi
  odul_kazanildi: {
    kazanildi_mi: {
      type: Boolean,
      default: false
    },
    tip: String
  },
  odul_kullanildi: {
    kullanildi_mi: {
      type: Boolean,
      default: false
    },
    tip: String,
    etki: String
  }
}, {
  timestamps: true
});

const Move = mongoose.model('Move', moveSchema);

module.exports = Move;