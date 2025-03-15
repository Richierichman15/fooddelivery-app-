# Financial Dashboard App

A complete financial tracking application built with the MERN stack (MongoDB, Express, React, Node.js). This application allows users to track their earnings, expenses, and view comprehensive analytics on their financial data.

## Features

- 🔐 **User Authentication**: Secure login and registration system
- 💰 **Earnings Management**: Track and manage all income sources 
- 💸 **Expense Tracking**: Monitor where your money is going
- 📊 **Analytics Dashboard**: Visualize your financial data with charts and summaries
- 📱 **Responsive Design**: Works great on both desktop and mobile devices

## Project Structure

The project is divided into two main parts:

- **Frontend**: React application with Redux for state management
- **Backend**: Node.js/Express API with MongoDB for data storage

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fd-app.git
   cd fd-app
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

### Configuration

1. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. The application will be available at `http://localhost:3000`

## Testing

Currently, the application has two types of tests for the backend:

1. Unit tests for controllers
2. Integration tests for authentication routes

Run tests with:
```
cd backend
npm test
```

## Mock Authentication

For testing purposes, you can use the following mock credentials:

- Email: `admin@example.com` / Password: `admin123`
- Email: `user@example.com` / Password: `user123`

## Technologies Used

### Frontend
- React.js
- Redux Toolkit for state management
- Material-UI for UI components
- Formik and Yup for form validation
- Chart.js for data visualization
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Jest for testing

## Future Improvements

- Add more comprehensive analytics
- Add budgeting features
- Implement data export functionality
- Add recurring transactions
- Create a mobile app with React Native

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Material-UI](https://mui.com/)
- [Chart.js](https://www.chartjs.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [MongoDB](https://www.mongodb.com/) 