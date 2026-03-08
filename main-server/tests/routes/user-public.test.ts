import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import responseFormat from "../../src/middlewares/utilities/response-format";
import globalErrorHandler from "../../src/middlewares/error/global";
import { validateRequest } from "../../src/middlewares/error/validation";

// Mock prisma globally before importing controllers
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Set global.prisma so controllers can use it
(global as any).prisma = mockPrisma;

// We import the route directly since it only uses global.prisma, not DB-heavy yt stuff
import userPublicRouter from "../../src/modules/user/routers/user.public.route";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(validateRequest);
  app.use(responseFormat);

  app.use("/api/v1/public/users", userPublicRouter);

  app.use(globalErrorHandler);
  app.use((req: Request, res: Response) => {
    req._error("Not found", 404);
  });

  return app;
}

describe("User Public Routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/public/users/:id", () => {
    it("returns a user when found", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app).get("/api/v1/public/users/user-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("user-123");
      expect(res.body.data.email).toBe("test@example.com");
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        omit: { password: true },
      });
    });

    it("returns null data when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/v1/public/users/nonexistent");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it("returns 500 on database error", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("DB connection lost")
      );

      const res = await request(app).get("/api/v1/public/users/user-123");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/public/users", () => {
    it("creates a user and returns 201", async () => {
      const newUser = {
        id: "user-new",
        email: "new@example.com",
        name: "New User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const res = await request(app)
        .post("/api/v1/public/users")
        .send({
          email: "new@example.com",
          name: "New User",
          password: "secret123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.email).toBe("new@example.com");
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it("passes hashed password to prisma.user.create", async () => {
      mockPrisma.user.create.mockResolvedValue({ id: "user-x" });

      await request(app)
        .post("/api/v1/public/users")
        .send({ email: "a@b.com", name: "A", password: "raw-password" });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      // password should be hashed, not the raw value
      expect(createCall.data.password).not.toBe("raw-password");
      expect(typeof createCall.data.password).toBe("string");
      expect(createCall.data.password.length).toBeGreaterThan(0);
    });

    it("returns 500 on create failure", async () => {
      mockPrisma.user.create.mockRejectedValue(new Error("Duplicate email"));

      const res = await request(app)
        .post("/api/v1/public/users")
        .send({ email: "dup@example.com", name: "Dup", password: "pass" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
