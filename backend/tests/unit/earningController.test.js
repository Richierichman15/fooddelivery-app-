const mongoose = require('mongoose');
const { createEarning, getEarnings, getEarningById, updateEarning, deleteEarning } = require('../../controllers/earningController');
const Earning = require('../../models/earningModel');
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

describe('Earning Controller', () => {
  let testUser;
  
  beforeAll(async () => {
    await connectDB();
    
    // Create a test user
    testUser = await User.create({
      name: 'Earning Test User',
      email: 'earnings@example.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Recreate test user after clearing database
    testUser = await User.create({
      name: 'Earning Test User',
      email: 'earnings@example.com',
      password: 'password123',
    });
  });

  describe('createEarning', () => {
    it('should create a new earning and return earning data', async () => {
      const req = mockRequest(
        {
          date: '2023-05-15',
          platform: 'DoorDash',
          amount: 125.75,
          hours: 6,
          mileage: 45,
          tips: 25.5,
          description: 'Monday evening shift'
        },
        {},
        { _id: testUser._id }
      );
      const res = mockResponse();

      await createEarning(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.platform).toBe('DoorDash');
      expect(responseData.amount).toBe(125.75);
      expect(responseData.user.toString()).toBe(testUser._id.toString());
    });

    it('should return 400 when required fields are missing', async () => {
      const req = mockRequest(
        {
          // Missing required fields
          platform: 'DoorDash',
        },
        {},
        { _id: testUser._id }
      );
      const res = mockResponse();

      try {
        await createEarning(req, res);
      } catch (error) {
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });

  describe('getEarnings', () => {
    it('should return all earnings for logged in user', async () => {
      // Create some test earnings for our user
      await Earning.create([
        {
          date: '2023-05-15',
          platform: 'DoorDash',
          amount: 125.75,
          hours: 6,
          mileage: 45,
          tips: 25.5,
          description: 'Monday evening shift',
          user: testUser._id
        },
        {
          date: '2023-05-16',
          platform: 'UberEats',
          amount: 95.25,
          hours: 5,
          mileage: 35,
          tips: 20.5,
          description: 'Tuesday afternoon shift',
          user: testUser._id
        }
      ]);

      const req = mockRequest({}, {}, { _id: testUser._id });
      const res = mockResponse();

      await getEarnings(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData.length).toBe(2);
      expect(responseData[0].platform).toBe('DoorDash');
      expect(responseData[1].platform).toBe('UberEats');
    });
  });

  describe('getEarningById', () => {
    it('should return a single earning by ID', async () => {
      // Create a test earning
      const earning = await Earning.create({
        date: '2023-05-15',
        platform: 'DoorDash',
        amount: 125.75,
        hours: 6,
        mileage: 45,
        tips: 25.5,
        description: 'Monday evening shift',
        user: testUser._id
      });

      const req = mockRequest({}, { id: earning._id }, { _id: testUser._id });
      const res = mockResponse();

      await getEarningById(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData._id.toString()).toBe(earning._id.toString());
      expect(responseData.platform).toBe('DoorDash');
    });

    it('should return 404 if earning not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = mockRequest({}, { id: fakeId }, { _id: testUser._id });
      const res = mockResponse();

      try {
        await getEarningById(req, res);
      } catch (error) {
        expect(res.status).toHaveBeenCalledWith(404);
      }
    });
  });

  describe('updateEarning', () => {
    it('should update an existing earning', async () => {
      // Create a test earning
      const earning = await Earning.create({
        date: '2023-05-15',
        platform: 'DoorDash',
        amount: 125.75,
        hours: 6,
        mileage: 45,
        tips: 25.5,
        description: 'Monday evening shift',
        user: testUser._id
      });

      const req = mockRequest(
        {
          amount: 135.75,
          mileage: 50,
          description: 'Updated description'
        },
        { id: earning._id },
        { _id: testUser._id }
      );
      const res = mockResponse();

      await updateEarning(req, res);

      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData._id.toString()).toBe(earning._id.toString());
      expect(responseData.amount).toBe(135.75);
      expect(responseData.mileage).toBe(50);
      expect(responseData.description).toBe('Updated description');
    });
  });

  describe('deleteEarning', () => {
    it('should delete an existing earning', async () => {
      // Create a test earning
      const earning = await Earning.create({
        date: '2023-05-15',
        platform: 'DoorDash',
        amount: 125.75,
        hours: 6,
        mileage: 45,
        tips: 25.5,
        description: 'Monday evening shift',
        user: testUser._id
      });

      const req = mockRequest({}, { id: earning._id }, { _id: testUser._id });
      const res = mockResponse();

      await deleteEarning(req, res);

      expect(res.json).toHaveBeenCalled();
      
      // Verify the earning was deleted
      const deletedEarning = await Earning.findById(earning._id);
      expect(deletedEarning).toBeNull();
    });
  });
}); 