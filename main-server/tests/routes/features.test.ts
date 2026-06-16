import { describe, it, expect } from "vitest";
import express, { Request, Response } from "express";
import request from "supertest";
import responseFormat from "../../src/middlewares/utilities/response-format";
import globalErrorHandler from "../../src/middlewares/error/global";
import { CLIENT_FLAGS } from "../../src/config/FLAGS/index";

// Build a minimal app that includes the features route
function createFeaturesApp() {
  const app = express();
  app.use(express.json());
  app.use(responseFormat);

  // Inline the features route logic (doesn't depend on external services)
  app.get("/api/v1/public/features", (req: Request) => {
    req._success({
      encryption_public_key: "test-public-key",
      FEATURE_FLAGS: CLIENT_FLAGS,
    });
  });

  app.use(globalErrorHandler);

  // 404 handler
  app.use((req: Request, res: Response) => {
    req._error("Not found", 404);
  });

  return app;
}

describe("Features Route", () => {
  const app = createFeaturesApp();

  it("GET /api/v1/public/features returns 200 with feature flags", async () => {
    const res = await request(app).get("/api/v1/public/features");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.encryption_public_key).toBe("test-public-key");
    expect(res.body.data.FEATURE_FLAGS).toBeDefined();
    expect(res.body.data.FEATURE_FLAGS).toEqual(CLIENT_FLAGS);
  });

  it("GET /api/v1/public/features includes ENCRYPT_REQUESTS flag", async () => {
    const res = await request(app).get("/api/v1/public/features");

    expect(res.body.data.FEATURE_FLAGS.ENCRYPT_REQUESTS).toBeDefined();
    expect(typeof res.body.data.FEATURE_FLAGS.ENCRYPT_REQUESTS).toBe("boolean");
  });

  it("GET /unknown returns 404", async () => {
    const res = await request(app).get("/api/v1/unknown");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Not found");
  });
});
