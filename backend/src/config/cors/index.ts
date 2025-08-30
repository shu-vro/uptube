import { CorsOptions } from "cors";
import ENV from "../env";

const corsOptions: CorsOptions = {
  origin: ENV.CORS_ORIGIN, // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed HTTP methods
  preflightContinue: false, // Pass the CORS preflight response to the next handler
  optionsSuccessStatus: 204, // Response status for successful OPTIONS requests
};

export default corsOptions;
