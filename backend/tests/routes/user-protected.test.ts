import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import responseFormat from "../../src/middlewares/utilities/response-format";
import globalErrorHandler from "../../src/middlewares/error/global";
import { validateRequest } from "../../src/middlewares/error/validation";

// Mock prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};
(global as any).prisma = mockPrisma;

import { authenticate } from "../../src/middlewares/auth/index";
import userProtectedRouter from "../../src/modules/user/routers/user.protected.route";

// Create a test app that bypasses real auth by injecting a mock user
function createApp(mockUser?: any) {
  const app = express();
  app.use(express.json());
  app.use(validateRequest);
  app.use(responseFormat);

  // Mock auth middleware: inject user if provided, otherwise reject
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (mockUser) {
      req.user = mockUser;
      next();
    } else {
      req._error("Unauthorized", 401);
    }
  });

  app.use("/api/v1/protected/users", userProtectedRouter);

  app.use(globalErrorHandler);
  app.use((req: Request, res: Response) => {
    req._error("Not found", 404);
  });

  return app;
}

describe("User Protected Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("without authentication", () => {
    const app = createApp(); // no mock user = unauthorized

    it("PUT /api/v1/protected/users/:id returns 401", async () => {
      const res = await request(app)
        .put("/api/v1/protected/users/user-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("DELETE /api/v1/protected/users/:id returns 401", async () => {
      const res = await request(app).delete("/api/v1/protected/users/user-123");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("with authentication", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };
    const app = createApp(mockUser);

    describe("PUT /api/v1/protected/users/:id", () => {
      it("updates own user and returns 200", async () => {
        const updatedUser = {
          id: "user-123",
          email: "updated@example.com",
          name: "Updated Name",
        };
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const res = await request(app)
          .put("/api/v1/protected/users/user-123")
          .send({
            email: "updated@example.com",
            name: "Updated Name",
            password: "newpass",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Updated Name");
      });

      it("returns 403 when trying to update another user", async () => {
        const res = await request(app)
          .put("/api/v1/protected/users/other-user")
          .send({ name: "Hacked" });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe("Unauthorized");
      });

      it("returns 500 on database failure", async () => {
        mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

        const res = await request(app)
          .put("/api/v1/protected/users/user-123")
          .send({ name: "fail" });

        expect(res.status).toBe(500);
      });
    });

    describe("DELETE /api/v1/protected/users/:id", () => {
      it("deletes own user and returns 200", async () => {
        mockPrisma.user.delete.mockResolvedValue({});

        const res = await request(app).delete(
          "/api/v1/protected/users/user-123"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBe("User deleted");
      });

      it("returns 403 when trying to delete another user", async () => {
        const res = await request(app).delete(
          "/api/v1/protected/users/other-user"
        );

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it("returns 500 on database failure", async () => {
        mockPrisma.user.delete.mockRejectedValue(new Error("DB error"));

        const res = await request(app).delete(
          "/api/v1/protected/users/user-123"
        );

        expect(res.status).toBe(500);
      });
    });
  });
});
