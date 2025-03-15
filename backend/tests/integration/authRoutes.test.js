const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userRoutes = require('../../routes/userRoutes');
const User = require('../../models/userModel');
const { connectDB, disconnectDB, clearDatabase } = require('../testDb');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('Auth Routes', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/users', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toEqual('Test User');
      expect(res.body.email).toEqual('test@example.com');
    });

    it('should return 400 if email already exists', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Another User',
          email: 'existing@example.com', // Same email
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Incomplete User',
          // Missing email and password
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with valid credentials', async () => {
      // Create a user with a hashed password
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: hashedPassword,
      });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toEqual('Login Test');
      expect(res.body.email).toEqual('login@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      // Create a user with a hashed password
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: hashedPassword,
      });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid');
    });
  });
}); 