# HeD Leave Portal

MERN leave management app with role-based access for admins and employees.

## Project Structure

```text
backend/   Express API, MongoDB models, routes, and auth middleware
frontend/  React app, Tailwind CSS, and Vite config
```

## Features

- Sign up and sign in with JWT authentication.
- Choose either `admin` or `employee` role during signup.
- Employees can create leave requests and view their request history.
- Admins can view all requests, accept requests, ignore requests, or delete requests from MongoDB.
- Tailwind CSS responsive frontend.

## Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create `.env` in the project root:

   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=change_this_secret_before_deploying
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the frontend:

   ```text
   http://localhost:5173
   ```

The frontend runs on `http://localhost:5173`.
The API runs on `http://localhost:5000/api` by default.
