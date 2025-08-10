require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const router = require('./routes');


const app = express();
app.use(express.json());

app.use(morgan('dev'));
app.use(cors());
app.use(compression());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router); 

const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
