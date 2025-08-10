const request = require('supertest');
const App = require('../src/app');

describe('Marriage Hall Backend API', () => {
  let app;

  beforeAll(async () => {
    app = new App();
    await app.start();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getApp())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app.getApp())
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Marriage Hall Backend API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Categories API', () => {
    it('should return empty categories list initially', async () => {
      const response = await request(app.getApp())
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return category statistics', async () => {
      const response = await request(app.getApp())
        .get('/api/categories/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalCategories');
      expect(response.body.data).toHaveProperty('totalImages');
      expect(response.body.data).toHaveProperty('averageImagesPerCategory');
    });
  });

  describe('Images API', () => {
    it('should return empty images list initially', async () => {
      const response = await request(app.getApp())
        .get('/api/images')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return homepage data', async () => {
      const response = await request(app.getApp())
        .get('/api/images/homepage')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return image statistics', async () => {
      const response = await request(app.getApp())
        .get('/api/images/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalImages');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('averageViews');
      expect(response.body.data).toHaveProperty('featuredImages');
      expect(response.body.data).toHaveProperty('totalFileSize');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app.getApp())
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app.getApp())
        .get('/api/categories/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
