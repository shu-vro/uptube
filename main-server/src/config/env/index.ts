/**
 * NOTE: all key value pairs are for contributors to run the project locally, even without .env files.
 * PRODUCTION USAGE OF THESE CREDS IS HIGHLY DISCOURAGED.
 * I REPEAT, DO NOT USE THESE CREDENTIALS IN PRODUCTION.
 */

const ENV = Object.freeze({
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "JWT_TOKEN",
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || "JWT_ADMIN_TOKEN",
  JWT_ENCRYPTION_KEY: process.env.JWT_ENCRYPTION_KEY || "JWT_ENCRYPTION_KEY",
  QUERY_PUBLIC_KEY:
    process.env.QUERY_PUBLIC_KEY ||
    "EQVzJJaT/TiUlMdeQt69uiNXjTJ3cmr5xjgUCcSkcxo=",
  QUERY_PRIVATE_KEY:
    process.env.QUERY_PRIVATE_KEY ||
    "sd+39NZtv7nQ4TDtNoYVuIj9qd2C+hmmo7GNldbkjJM=",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
});

export default ENV;
