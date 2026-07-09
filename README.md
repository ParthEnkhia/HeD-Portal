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

## Local Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create `.env` in the project root:

   ```env
   MONGO_URI=your_mongodb_connection_string
   MONGO_DB_NAME=hed-portal
   JWT_SECRET=change_this_secret_before_deploying
   ADMIN_SIGNUP_KEY=private_key_required_for_admin_registration
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

## Production Deployment

The repository is configured as a single deployable Node service. The production build:

- compiles the React frontend into `frontend/dist`;
- serves the SPA and API from the same Express process;
- uses relative `/api` requests, so no production frontend URL is required;
- supports client-side routes through an SPA fallback;
- exposes `/api/health` for platform health checks.

### Deploy on Render

1. Push this repository to GitHub.
2. In Render, create a Blueprint and select the repository. Render reads `render.yaml`.
3. Enter `MONGO_URI` when prompted.
4. Deploy the service.
5. In MongoDB Atlas Network Access, allow connections from the deployment environment.

Render generates secure values for `JWT_SECRET` and `ADMIN_SIGNUP_KEY`. View the
`ADMIN_SIGNUP_KEY` environment value in Render when creating an administrator account.

For another Node hosting provider, use:

```text
Build command: npm ci
Start command: npm start
Health check: /api/health
```

Set `NODE_ENV=production`, `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, and
`ADMIN_SIGNUP_KEY`. `JWT_SECRET` must contain at least 32 characters and
`ADMIN_SIGNUP_KEY` must contain at least 12 characters.
