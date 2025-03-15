const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Connect to test database before all tests
const connectDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected to in-memory database at ${mongoUri}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Disconnect from database after all tests
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('MongoDB Disconnected and Memory Server Stopped');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Clear all collections before each test
const clearDatabase = async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany({});
  }
};

module.exports = { connectDB, disconnectDB, clearDatabase }; 