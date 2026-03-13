import { Router } from "express";
import { shortsRandom } from "../controllers/shorts.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/public/shorts/random:
 *   get:
 *     summary: Get a random short
 *     description: Return a single random short from the database.
 *     responses:
 *       200:
 *         description: A random short
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: The random short
 *       500:
 *         description: Server error
 */
router.get("/random", shortsRandom);

export default router;
