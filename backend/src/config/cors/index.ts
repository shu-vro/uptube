import { CorsOptions } from 'cors';

const corsOptions: CorsOptions = {
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  preflightContinue: false, // Pass the CORS preflight response to the next handler
  optionsSuccessStatus: 204, // Response status for successful OPTIONS requests
};

export default corsOptions;