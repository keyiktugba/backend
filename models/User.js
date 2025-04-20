const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  kullanici_adi: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta adresi zorunludur'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Geçerli bir e-posta adresi giriniz'
    ]
  },
  sifre_hash: {
    type: String,
    required: [true, 'Şifre zorunludur'],
    minlength: 8
  },
  genel_puan: {
    type: Number,
    default: 0
  },
  kazanilan_oyun: {
    type: Number,
    default: 0
  },
  toplam_oyun: {
    type: Number,
    default: 0
  },
  basari_yuzdesi: {
    type: Number,
    default: 0
  },
  olusturma_tarihi: {
    type: Date,
    default: Date.now
  },
  son_giris: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('sifre_hash')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.sifre_hash = await bcrypt.hash(this.sifre_hash, salt);
});

// Şifre kontrolü için metod
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.sifre_hash);
};

// Başarı yüzdesini hesaplama
userSchema.methods.hesaplaBasariYuzdesi = function() {
  if (this.toplam_oyun === 0) return 0;
  return (this.kazanilan_oyun / this.toplam_oyun) * 100;
};

const User = mongoose.model('User', userSchema);

module.exports = User;