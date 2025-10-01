import express from "express";
import cors from "cors";
import routes from "./routes/app.route";
import errorHandler from "./middlewares/error/global";
import { validateRequest } from "./middlewares/error/validation";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { User } from "generated/prisma";
import morgan from "morgan";
import "utils/encryption";
import ENV from "config/env";
import path from "path";
import FLAGS from "config/FLAGS";
import responseFormat from "middlewares/utilities/response-format";
import payloadEncryptionMiddleware from "middlewares/utilities/payload-encryption";

const app = express();

(["log", "warn", "error", "info"] as const).forEach((level) => {
  const original = console[level].bind(console);
  (console as any)[level] = (...args: any[]) => {
    if (ENV.NODE_ENV === "development") {
      const stack = new Error().stack?.split("\n")[2];
      const match =
        stack?.match(/at (.+):(\d+):(\d+)/) ||
        stack?.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        const [_, fileOrMethod, maybeLine, maybeColumn, file, line, column] =
          match;
        if (file) {
          const relativeFile = path.relative(path.join(__dirname, "../"), file);
          original(
            `[${level}][${relativeFile}:${line}:${column}] ${fileOrMethod}:`,
            ...args
          );
        } else {
          const relativeFile = path.relative(
            path.join(__dirname, "../"),
            fileOrMethod
          );
          original(
            `[${level}][${relativeFile}:${maybeLine}:${maybeColumn}]:`,
            ...args
          );
        }
      } else {
        original(...args);
      }
    } else {
      FLAGS.STOP_CONSOLE_AT_PROD ? null : original(...args);
    }
  };
});

declare global {
  namespace Express {
    interface Request {
      _success: (json: any, status?: number) => void;
      _error: (message: any, status?: number) => void;
      user?: User | null;
    }
  }
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
app.use(validateRequest);
// app.use(limiter);
app.use(responseFormat);
app.use(payloadEncryptionMiddleware);

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
