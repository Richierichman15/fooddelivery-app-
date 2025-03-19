const axios = require('axios');
const { generateDoorDashToken } = require('../utils/doordashAuth');

const DOORDASH_API_URL = 'https://openapi.doordash.com/drive/v2';

/**
 * DoorDash service for handling delivery operations
 */
class DoorDashService {
  /**
   * Creates a new delivery on DoorDash
   * @param {Object} deliveryData - The delivery data
   * @returns {Promise<Object>} Delivery response
   */
  async createDelivery(deliveryData) {
    try {
      // Generate authentication token
      const token = generateDoorDashToken();

      // Set default values for required fields if not provided
      const payload = {
        external_delivery_id: deliveryData.external_delivery_id || `DD-${Date.now()}`,
        pickup_address: deliveryData.pickup_address,
        pickup_business_name: deliveryData.pickup_business_name,
        pickup_phone_number: deliveryData.pickup_phone_number,
        dropoff_address: deliveryData.dropoff_address,
        dropoff_business_name: deliveryData.dropoff_business_name,
        dropoff_phone_number: deliveryData.dropoff_phone_number,
        order_value: deliveryData.order_value,
        ...deliveryData // Include any additional fields provided
      };

      // Make API request to DoorDash
      const response = await axios.post(
        `${DOORDASH_API_URL}/deliveries`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating DoorDash delivery:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to create DoorDash delivery');
    }
  }

  /**
   * Gets delivery status from DoorDash
   * @param {string} deliveryId - The DoorDash delivery ID
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(deliveryId) {
    try {
      const token = generateDoorDashToken();
      
      const response = await axios.get(
        `${DOORDASH_API_URL}/deliveries/${deliveryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting DoorDash delivery status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to get DoorDash delivery status');
    }
  }

  /**
   * Cancels a DoorDash delivery
   * @param {string} deliveryId - The DoorDash delivery ID
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelDelivery(deliveryId) {
    try {
      const token = generateDoorDashToken();
      
      const response = await axios.post(
        `${DOORDASH_API_URL}/deliveries/${deliveryId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error cancelling DoorDash delivery:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to cancel DoorDash delivery');
    }
  }
}

module.exports = new DoorDashService(); 