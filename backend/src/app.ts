import express from "express";
import cors from "cors";
import routes from "./routes/app.route";
import errorHandler from "./middlewares/error/global";
import { validateRequest } from "./middlewares/error/validation";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { User } from "generated/prisma";

const app = express();

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
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(validateRequest);
// app.use(limiter);
app.use((req, res, next) => {
  req._success = (json: any, status?: number) => {
    res.status(status || 200).json({
      success: true,
      statusCode: status || 200,
      data: json,
    });
  };
  req._error = (message: any, status?: number) => {
    res.status(status || 400).json({
      success: false,
      statusCode: status || 400,
      error: message,
    });
  };
  next();
});

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
