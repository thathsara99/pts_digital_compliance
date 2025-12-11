const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const db = require('./models');
const routes = require('./routes');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// CORS configuration to allow credentials and specific origin
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', routes);

// Sync DB (excluding documents table as we'll create it manually)
db.sequelize.sync({ force: false })
  .then(async () => {
    console.log('🛠️ Database synced!');
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
  });


  // Serve frontend build
app.use(express.static(path.join(__dirname, 'dist')));
app.get(/^\/(?!api|api-docs).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.error(`Error serving index.html: ${err.message}`);
      res.status(500).send("Server error");
    }
  });
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('PTS Node.js server is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
