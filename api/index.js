// api/index.js
const App = require('../src/app');
const database = require('../src/config/database');
const cloudinaryConfig = require('../src/config/cloudinary');

let cachedApp;

// This function will be called for each request
module.exports = async (req, res) => {
  try {
    if (!cachedApp) {
      const appInstance = new App();

      // Connect to DB
      await database.connect();

      // Configure Cloudinary
      cloudinaryConfig.configure();

      cachedApp = appInstance.getApp();
    }

    return cachedApp(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
