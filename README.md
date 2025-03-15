# Food Delivery Earnings & Productivity Tracker

A comprehensive application for food delivery workers to track earnings, expenses, and optimize their workflow using AI-powered insights.

## Features

- **Earnings Tracking**: Log and analyze your earnings across multiple delivery platforms
- **Expense Management**: Track fuel, maintenance, and other delivery-related expenses
- **Mileage Tracking**: Record miles driven for tax deduction purposes
- **AI-Powered Insights**: Get recommendations for optimal working hours and locations
- **Performance Analytics**: View detailed metrics on your earnings per hour, per mile, and per delivery
- **Tax Preparation**: Export reports for tax filing with categorized deductible expenses
- **Multi-Platform Support**: Works with UberEats, DoorDash, GrubHub, Postmates, and more

## Tech Stack

- **Frontend**: React with Material-UI
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based auth
- **Charts**: Chart.js for data visualization
- **AI/ML**: Custom algorithms for earnings prediction and optimization

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/food-delivery-app.git
   cd food-delivery-app
   ```

2. Install backend dependencies
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```

### Running the Application

#### Development Mode
```
# From the backend directory
npm run dev
```
This will start both the backend server and the React frontend in development mode.

#### Backend Only
```
# From the backend directory
npm run server
```

#### Frontend Only
```
# From the frontend directory
npm start
```

## API Documentation

The API provides the following endpoints:

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Authenticate user & get token
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Earnings
- `GET /api/earnings` - Get all earnings for a user (protected)
- `GET /api/earnings/summary` - Get earnings summary statistics (protected)
- `POST /api/earnings` - Create a new earning (protected)
- `GET /api/earnings/:id` - Get earning by ID (protected)
- `PUT /api/earnings/:id` - Update an earning (protected)
- `DELETE /api/earnings/:id` - Delete an earning (protected)

### Expenses
- `GET /api/expenses` - Get all expenses for a user (protected)
- `GET /api/expenses/summary` - Get expenses summary statistics (protected)
- `POST /api/expenses` - Create a new expense (protected)
- `GET /api/expenses/:id` - Get expense by ID (protected)
- `PUT /api/expenses/:id` - Update an expense (protected)
- `DELETE /api/expenses/:id` - Delete an expense (protected)

### Analytics
- `GET /api/analytics/profit` - Calculate profit metrics (protected)
- `GET /api/analytics/platform-performance` - Get performance metrics by platform (protected)
- `GET /api/analytics/optimal-hours` - Get optimal working hours (protected)
- `GET /api/analytics/earnings-prediction` - Predict weekly earnings (protected)

### Dashboard
- `GET /api/dashboard` - Get dashboard overview data (protected)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the food delivery workers who provided feedback during development
- Icons provided by Material-UI and FontAwesome 