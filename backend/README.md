# Backend API Project

This project is a backend API built with TypeScript. It serves as the main entry point for handling requests and managing data interactions.

## Project Structure

- **src/**: Contains the source code for the application.
  - **app.ts**: Initializes the application and sets up middleware.
  - **server.ts**: Configures the server and listens for incoming requests.
  - **config/**: Contains configuration files for the application.
    - **cors/**: CORS configuration.
    - **env/**: Environment variable loading.
    - **logger/**: Logger setup using Pino.
  - **lib/**: Utility functions and libraries.
    - **async/**: Asynchronous utility functions.
    - **hash/**: Hashing functions for secure data handling.
    - **token/**: Functions for generating and verifying tokens.
  - **middlewares/**: Middleware functions for handling requests.
    - **auth/**: Authentication middleware.
    - **error/**: Error handling middleware.
  - **modules/**: Contains different modules of the application.
    - **common/**: Common controllers.
    - **user/**: User-related controllers, routers, and validators.
  - **routes/**: Main application routes.
  - **types/**: Type definitions used throughout the application.
  - **utils/**: Utility functions for error handling and response formatting.

- **scripts/**: Contains scripts for database operations.
  - **db/**: Database seeding scripts.

- **prisma/**: Contains the Prisma schema for database interactions.

- **.env.sample**: Sample environment configuration file.

- **.gitignore**: Specifies files to be ignored by version control.

- **app.config.json**: Application-specific configuration settings.

- **package.json**: Lists project dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file.

## Getting Started

1. Clone the repository.
2. Install dependencies using `npm install` or `yarn install`.
3. Set up your environment variables by copying `.env.sample` to `.env` and updating the values.
4. Run the application using `npm start` or `yarn start`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.