// index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const setupSocket = require('./socket');
const apiRoutes = require('./api');

dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

mongoose.connect("mongodb+srv://medihatugbakeyik:Hh5U8sFS421LnavH@wordmine1.klza6gv.mongodb.net/wordmines")
  .then(() => console.log("MongoDB bağlantısı başarılı"))
  .catch(err => console.error("MongoDB bağlantı hatası:", err));

app.get('/', (req, res) => {
  res.send('Kelime Mayınları API çalışıyor');
});

const server = http.createServer(app);
const io = setupSocket(server); 
global.io = io;
server.listen(PORT, () => {
  console.log(`Sunucu çalışıyor 🚀`);
});
