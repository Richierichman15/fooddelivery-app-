const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generates a JWT token for DoorDash API authentication
 * @returns {string} JWT token
 */
const generateDoorDashToken = () => {
  const developerId = process.env.DEVELOPER_ID;
  const keyId = process.env.KEY_ID;
  const signingSecret = process.env.SIGNING_SECRET;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('Missing DoorDash API credentials in environment variables');
  }

  const data = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: Math.floor(Date.now() / 1000 + 300), // Token expires in 5 minutes
    iat: Math.floor(Date.now() / 1000), // Issued at current time
  };

  const headers = { 
    algorithm: 'HS256', 
    header: { 'dd-ver': 'DD-JWT-V1' } 
  };

  try {
    const token = jwt.sign(
      data,
      Buffer.from(signingSecret, 'base64'),
      headers,
    );
    return token;
  } catch (error) {
    console.error('Error generating DoorDash JWT token:', error);
    throw new Error('Failed to generate authentication token for DoorDash API');
  }
};

module.exports = {
  generateDoorDashToken
}; 