# Jest Assignment — Backend API Automation

A Jest and Supertest-based API automation suite for testing the authentication and booking functionality of a salon backend application.

The test suite focuses on positive and negative scenarios, authentication, authorization, HTTP status codes, response validation, business rules, and the complete end-to-end booking workflow.

---

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Jest
- Supertest
- Babel
- MongoDB
- JWT Authentication

---

## Prerequisites

Before running the project, make sure the following are installed:

- Node.js
- npm
- MongoDB
- Git

MongoDB should be running locally because the application and automated tests use MongoDB for data storage.

---

## Project Structure

```text
Jest-assignment/
│
├── app.ts
├── index.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── babel.config.js
├── jest.config.js
├── .gitignore
│
├── controllers/
│   ├── authController.ts
│   ├── bookingController.ts
│   └── salonController.ts
│
├── middleware/
│   └── authMiddleware.ts
│
├── models/
│   ├── Booking.ts
│   ├── Salon.ts
│   ├── Service.ts
│   ├── Stylist.ts
│   └── User.ts
│
├── routes/
│   ├── authRoutes.ts
│   ├── bookingRoutes.ts
│   └── salonRoutes.ts
│
└── tests/
    └── api.test.ts

Installation
Clone the repository and install all dependencies:
git clone https://github.com/harsh2005-singh/Jest-assignment.git
cd Jest-assignment
npm install

Environment Setup
The application uses environment variables for MongoDB, JWT authentication, and the application port.
Application Environment
Create a .env file in the project root:
MONGO_URI=mongodb://localhost:27017/salon-db
JWT_SECRET=your-secret-key
PORT=3000

Test Environment
The automated test suite uses a separate test database.
Create a .env.test file in the project root:
MONGO_URI=mongodb://localhost:27017/salon-db-test
JWT_SECRET=my-test-secret-123

The .env and .env.test files are ignored by Git and should not be committed to the repository.
Setup Assumptions
- MongoDB is running locally.
- The test database is separate from the normal application database.
- Test data is created during test execution.
- Unique test data is used where required to avoid conflicts.
- Test records are removed after the test suite finishes.
- The Jest tests use the Express application directly, so the backend server does not need to be started separately before running npm test.
Running the Application
Start the application in development mode:
npm run dev

The application runs on:
http://localhost:3000

Build the TypeScript application:
npm run build

Start the compiled application:
npm start

Jest API Automation
Running the Tests
Run the complete automated test suite with:
npm test

Jest is configured to run in-band because the tests share a database connection and test data.
The Jest configuration is defined in:
jest.config.js

The automated tests are located in:
tests/api.test.ts

Test Configuration
The Jest configuration includes:
- Node.js test environment
- Test files inside the tests directory
- 30-second test timeout
- Mock clearing between tests
- Verbose test output
- In-band test execution
TypeScript test files are transformed using Babel.
Babel configuration:
babel.config.js

Jest configuration:
jest.config.js

APIs Covered
The test suite covers the following APIs.
API	Method	Purpose
/api/register	POST	Register a new user
/api/login	POST	Authenticate a user and receive a JWT
/api/salons/:salonId/available-slots	GET	Retrieve available booking slots
/api/bookings	POST	Create a booking
/api/bookings/:bookingId/cancel	POST	Cancel a booking


Test Coverage
1. Authentication API
Registration
The registration tests cover:
- Successful user registration
- Duplicate email registration
- HTTP status validation
- Response message validation
Login
The login tests cover:
- Successful login
- Invalid login credentials
- JWT token generation
- User ID validation
- User role validation
- HTTP status validation
2. Available Slots API
The available-slots tests cover:
- Successfully retrieving available slots
- Missing date
- Missing service ID
- Invalid salon
- Invalid service
- Response data validation
- HTTP status validation
3. Booking API
The booking tests cover:
- Successful booking creation
- Missing date
- Invalid or missing service
- Overlapping booking
- Missing authentication
- Booking response validation
- HTTP status validation
- Booking data validation
4. Booking Cancellation API
The cancellation tests cover:
- Successful cancellation
- Cancellation of a non-existent booking
- Unauthorized cancellation by another user
- Cancellation of an already cancelled booking
- Missing authentication
- Response validation
- HTTP status validation
Authentication and Authorization Testing
Protected booking endpoints use JWT authentication.
The test suite validates:
- Request without an authentication token
- Request with an invalid token
- Request with a valid token
- Access by the booking owner
- Unauthorized access by another user
- Authorization behavior for booking cancellation
This ensures that authentication and authorization are tested separately rather than only testing successful authenticated requests.
Positive and Negative Scenarios
The automation suite includes both positive and negative test cases.
Positive Scenarios
Examples include:
- Registering a new user
- Logging in with valid credentials
- Retrieving available slots
- Creating a booking
- Cancelling a booking
- Completing the full booking workflow
Negative Scenarios
Examples include:
- Registering with an already existing email
- Logging in with invalid credentials
- Accessing protected APIs without authentication
- Using an invalid authentication token
- Missing required request fields
- Using an invalid salon or service
- Creating an overlapping booking
- Cancelling a non-existent booking
- Cancelling a booking belonging to another user
- Cancelling an already cancelled booking
End-to-End Workflow
The test suite includes the complete booking flow required by the assignment:
Register
   ↓
Login
   ↓
Receive JWT Token
   ↓
Create Booking
   ↓
Cancel Booking
   ↓
Verify Cancellation

The E2E scenario verifies that the different APIs work together as a complete user flow instead of being tested only in isolation.
Test Data Strategy
The test suite creates its own test data instead of depending on existing data.
The test setup includes:
- A unique test customer
- A second test customer for authorization testing
- A test salon
- A test service
- A test stylist
Unique values are generated where necessary so repeated test executions do not fail because of duplicate test data.
Test data is removed during teardown after the test suite completes.
Setup and Teardown
Jest lifecycle hooks are used to prepare and clean up the test environment.
Before Tests
The test setup:
1. Connects to the test MongoDB database.
2. Creates the required test entities.
3. Creates test users.
4. Performs login where required.
5. Generates authentication tokens used by protected endpoints.
After Tests
The test teardown:
1. Removes test records.
2. Cleans up the test database data.
3. Closes the MongoDB connection.
This keeps the test environment isolated and prevents test data from accumulating between runs.
Assertions
The tests validate both the API response and the expected business behavior.
Assertions include:
- HTTP status codes
- Response body structure
- Response messages
- Authentication tokens
- User IDs
- User roles
- Booking IDs
- Booking status
- Required fields
- Authentication behavior
- Authorization behavior
- Available slot data
- Booking conflict rules
- Booking cancellation rules
Maintainability
The automation suite is organized to keep the tests readable and maintainable.
Key design considerations include:
- Dedicated Jest configuration
- Separate test database
- Reusable test data
- Reusable authentication tokens
- Logical test grouping
- Positive and negative scenarios separated clearly
- Shared setup and teardown
- E2E workflow validation
- Express application separated from server startup
The application uses app.ts for the Express app and index.ts for database connection and server startup. This allows the Jest tests to import the Express application directly without starting a separate HTTP server.
Test Result
The current automated test suite contains:
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Snapshots:   0 total

The 21 tests cover:
- Authentication
- Available slots
- Booking creation
- Booking cancellation
- Authentication failures
- Authorization failures
- Negative scenarios
- Business-rule validation
- Complete end-to-end booking workflow
Assignment Deliverables
GitHub Repository
This repository contains:
- Jest automation suite
- API test cases
- Test data setup
- Test setup and teardown
- Jest configuration
- Babel configuration
- Supporting project configuration
- README documentation
Loom 1 — Code Walkthrough
The code walkthrough should demonstrate:
1. Test folder and file structure
2. API automation approach
3. Test data strategy
4. Authentication and authorization handling
5. Positive and negative test scenarios
6. End-to-end workflow
7. Important assertions
8. Design decisions and trade-offs
Loom 2 — Test Execution
The test execution video should demonstrate:
1. Application/test environment setup
2. Running the Jest test suite
3. Test execution output
4. End-to-end workflow execution
5. Important passing scenarios
Author
Harshit Singh
B.Tech Computer Science Engineering