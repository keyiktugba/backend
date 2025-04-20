const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  durum: {
    type: String,
    enum: ['bekliyor', 'aktif', 'bitti', 'iptal'],
    default: 'bekliyor'
  },
  baslangic_zamani: {
    type: Date,
    default: Date.now
  },
  bitis_zamani: {
    type: Date,
    default: null
  },
  oyun_turu: {
    type: String,
    enum: ['2dk', '5dk', '12saat', '24saat'],
    required: true
  },
  
  // Oyun havuzundaki harfler
  harf_havuzu: [{
    harf: String,
    puan: Number,
    kalan_adet: Number
  }],
  
  // Oyun tahtası 15x15 matris
  tahta: {
    type: [[{
      harf: String,
      kullanan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      puan_katsayisi: String,
      ozellik: {
        tip: String,
        aktif: Boolean
      }
    }]],
    validate: {
      validator: function(v) {
        return v.length <= 15 && v.every(row => row.length <= 15);
      },
      message: props => 'Tahta 15x15 boyutlarını aşamaz!'
    }
  },
  
  // Oyuncular
  oyuncular: [{
    kullanici_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    kullanici_adi: String,
    sira_no: {
      type: Number,
      enum: [1, 2]
    },
    puan: {
      type: Number,
      default: 0
    },
    sira_bende_mi: {
      type: Boolean,
      default: false
    },
    mevcut_harfler: [{
      harf: String,
      puan: Number
    }],
    kazanilan_oduller: [{
      tip: String,
      kullanildi_mi: {
        type: Boolean,
        default: false
      }
    }],
    kazandi_mi: {
      type: Boolean,
      default: false
    }
  }],
  
  // Mayınlar
  mayinlar: [{
    x: Number,
    y: Number,
    tip: {
      type: String,
      enum: [
        'Puan Bölünmesi', 
        'Puan Transferi', 
        'Harf Kaybı', 
        'Ekstra Hamle Engeli', 
        'Kelime İptali'
      ]
    },
    aktif_mi: {
      type: Boolean,
      default: true
    }
  }],
  
  // Ödüller
  oduller: [{
    x: Number,
    y: Number,
    tip: {
      type: String,
      enum: [
        'Bölge Yasağı', 
        'Harf Yasağı', 
        'Ekstra Hamle Jokeri'
      ]
    },
    alindi_mi: {
      type: Boolean,
      default: false
    }
  }],
  
  son_hamle_zamani: {
    type: Date,
    default: Date.now
  },
  mevcut_sira: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  kazanan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Mayın ve ödülleri rastgele yerleştirme methodu
gameSchema.methods.mayinOdulYerlestir = function() {
  // Mayınları yerleştir
  const mayinTipleri = [
    { tip: 'Puan Bölünmesi', adet: 5 },
    { tip: 'Puan Transferi', adet: 4 },
    { tip: 'Harf Kaybı', adet: 3 },
    { tip: 'Ekstra Hamle Engeli', adet: 2 },
    { tip: 'Kelime İptali', adet: 2 }
  ];
  
  // Ödülleri yerleştir
  const odulTipleri = [
    { tip: 'Bölge Yasağı', adet: 2 },
    { tip: 'Harf Yasağı', adet: 3 },
    { tip: 'Ekstra Hamle Jokeri', adet: 2 }
  ];
  
  // Rastgele konumları belirleyip yerleştirme mantığı buraya gelecek
  // ...
};

// Harf havuzunu başlatma
gameSchema.methods.harfHavuzuOlustur = function() {
  const harfler = [
    { harf: 'A', adet: 12, puan: 1 },
    { harf: 'B', adet: 2, puan: 3 },
    // ... diğer harfler
    { harf: 'Z', adet: 2, puan: 4 },
    { harf: 'JOKER', adet: 2, puan: 0 }
  ];
  
  this.harf_havuzu = harfler;
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;