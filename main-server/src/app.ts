import "utils/bootstrap";
import express from "express";
import cors from "cors";
import routes_v1 from "./routes/v1/app.route";
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
import { openapiSpecification } from "config/swagger";
import setReqVariables from "middlewares/utilities/set-req-variables";

const app = express();

if (ENV.NODE_ENV === "development") {
  app.use(
    "/reference",
    apiReference({
      agent: {
        disabled: true,
      },
      content: openapiSpecification,
      pageTitle: "API Reference - Uptube",
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
  req.requestSent = false;

  next();
});

// app.use(limiter);
app.use(payloadEncryptionMiddleware);
app.use(validateRequest);
app.use(setReqVariables);
app.use(responseFormat);

app.use("/api/v1", routes_v1);

app.use(errorHandler);

app.use((req, res) => {
  req._error("Not found", 404);
});

export default app;
