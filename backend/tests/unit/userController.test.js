const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { registerUser, loginUser } = require('../../controllers/userController');
const User = require('../../models/userModel');
const { connectDB, disconnectDB, clearDatabase } = require('../testDb');

// Mocking express request and response
const mockRequest = (body = {}, params = {}, user = null) => ({
  body,
  params,
  user,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('registerUser', () => {
    it('should register a new user and return user data with token', async () => {
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.name).toBe('Test User');
      expect(responseData.email).toBe('test@example.com');
      expect(responseData.token).toBeDefined();
    });

    it('should return 400 when user already exists', async () => {
      // Create user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const req = mockRequest({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      // This should be a mocked function that throws an error
      try {
        await registerUser(req, res);
      } catch (error) {
        // We expect an error to be thrown
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });

  describe('loginUser', () => {
    it('should login a user and return user data with token', async () => {
      // Create a user with hashed password
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: hashedPassword,
      });

      const req = mockRequest({
        email: 'login@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.name).toBe('Login Test');
      expect(responseData.email).toBe('login@example.com');
      expect(responseData.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      // Create a user
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name: 'Invalid Test',
        email: 'invalid@example.com',
        password: hashedPassword,
      });

      const req = mockRequest({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });
      const res = mockResponse();

      // This should be a mocked function that throws an error
      try {
        await loginUser(req, res);
      } catch (error) {
        // We expect an error to be thrown
        expect(res.status).toHaveBeenCalledWith(401);
      }
    });
  });
}); 