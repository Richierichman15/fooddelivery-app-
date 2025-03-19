const { generateDoorDashToken } = require('../utils/doordashAuth');
const doordashService = require('../services/doordashService');
require('dotenv').config();

// Test DoorDash JWT token generation
const testTokenGeneration = () => {
  try {
    console.log('\n=== Testing DoorDash JWT Token Generation ===');
    const token = generateDoorDashToken();
    console.log('Token successfully generated:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('Error generating token:', error.message);
    process.exit(1);
  }
};

// Test DoorDash delivery creation
const testDeliveryCreation = async (token) => {
  try {
    console.log('\n=== Testing DoorDash Delivery Creation ===');
    
    // Example delivery data
    const deliveryData = {
      external_delivery_id: `TEST-${Date.now()}`,
      pickup_address: '901 Market Street 6th Floor San Francisco, CA 94103',
      pickup_business_name: 'Test Restaurant',
      pickup_phone_number: '+16505555555',
      pickup_instructions: 'Please call when you arrive',
      dropoff_address: '901 Market Street 6th Floor San Francisco, CA 94103',
      dropoff_business_name: 'Test Customer',
      dropoff_phone_number: '+16505555555',
      dropoff_instructions: 'Leave at door',
      order_value: 1999, // $19.99 in cents
    };
    
    // This will use our service to call the DoorDash API
    console.log('Creating test delivery with data:', deliveryData);
    
    // Note: Uncomment the below line to actually make the API call
    // This is commented out by default to avoid making real API calls
    
    // const response = await doordashService.createDelivery(deliveryData);
    // console.log('Delivery creation response:', response);
    
    console.log('Test complete. Note: API call was not actually made to avoid creating a real delivery.');
    console.log('To make a real API call, uncomment the code in the testDeliveryCreation function.');
    
  } catch (error) {
    console.error('Error creating delivery:', error.message);
  }
};

// Main test function
const runTests = async () => {
  console.log('=== DoorDash Integration Test ===');
  
  // Verify environment variables
  if (!process.env.DEVELOPER_ID || !process.env.KEY_ID || !process.env.SIGNING_SECRET) {
    console.error('Error: Missing required environment variables for DoorDash API.');
    console.error('Please make sure DEVELOPER_ID, KEY_ID, and SIGNING_SECRET are set in your .env file.');
    process.exit(1);
  }
  
  console.log('Environment variables verified.');
  
  // Test token generation
  const token = testTokenGeneration();
  
  // Test delivery creation
  await testDeliveryCreation(token);
  
  console.log('\n=== Test Completed ===');
};

// Run the tests
runTests(); 