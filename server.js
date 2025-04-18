const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS ayarları
app.use(cors());

// JSON isteği kabul et
app.use(express.json());

// API yönlendirmelerini buradan ekleyeceğiz
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Ana API endpoint
app.get('/', (req, res) => {
  res.send('Kelime Mayınları API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});