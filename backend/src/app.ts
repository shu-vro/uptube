import "utils/bootstrap";
import express from "express";
import cors from "cors";
import routes from "./routes/app.route";
import errorHandler from "./middlewares/error/global";
import { validateRequest } from "./middlewares/error/validation";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import "utils/encryption";
import responseFormat from "middlewares/utilities/response-format";
import payloadEncryptionMiddleware from "middlewares/utilities/payload-encryption";
import ENV from "config/env";
import { apiReference } from "@scalar/express-api-reference";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

if (ENV.NODE_ENV === "development") {
  const openapiSpecification = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Uptube Backend",
        version: "1.0.0",
      },
      components: {
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string" },
              statusCode: { type: "integer", example: 400 },
            },
          },
        },
      },
    },
    apis: ["./**/*.ts"],
  });
  app.use(
    "/reference",
    apiReference({
      content: openapiSpecification,
    })
  );
}

// Middleware setup
app.use(morgan("short"));
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(
  express.json({
    limit: "2mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: req.query,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  next();
});

app.use(validateRequest);
// app.use(limiter);
app.use(responseFormat);
app.use(payloadEncryptionMiddleware);

app.use("/api/v1", routes);

app.use(errorHandler);

app.use((req, res) => {
  req._error("Not found", 404);
});

export default app;
