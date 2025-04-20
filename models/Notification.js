const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  kullanici_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mesaj: {
    type: String,
    required: true
  },
  tur: {
    type: String,
    enum: ['bilgilendirme', 'sira', 'davet'],
    required: true
  },
  okundu: {
    type: Boolean,
    default: false
  },
  tarih: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
