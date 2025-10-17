import { Router } from "express";
import {
  doSomething,
  getVideoInfo,
  home,
  searchVideos,
  showSuggestions,
} from "../controllers/yt.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/public/yt/video:
 *   get:
 *     summary: Get video info
 *     description: Returns parsed video/player information for a YouTube video id.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: YouTube video id or URL (will be sanitized)
 *     responses:
 *       200:
 *         description: Video info object
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
 *                   description: Raw parsed player/video info returned by youtubei.js
 *       400:
 *         description: Invalid video ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.get("/video", getVideoInfo);
/**
 * @openapi
 * /api/v1/public/yt/search:
 *   get:
 *     summary: Search YouTube videos and save results
 *     description: |
 *       Search YouTube for videos matching the query. Results are upserted into the local database
 *       and the response returns the ordered list of videos (creator and thumbnails included).
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *         required: false
 *         description: Maximum number of videos to return
 *     responses:
 *       200:
 *         description: Array of videos (ordered)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Video record (includes creator and thumbnails)
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/search", searchVideos);
/**
 * @openapi
 * /api/v1/public/yt/home:
 *   get:
 *     summary: List popular videos (home)
 *     description: Return paginated videos from the database ordered by view_count.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: Page number (pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Video record (includes creator and thumbnails)
 *       500:
 *         description: Server error
 */
router.get("/home", home);

/**
 * @openapi
 * /api/v1/public/yt/show-suggestions:
 *   get:
 *     summary: Show search suggestions
 *     description: Return search suggestions from YouTube for a given query.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Partial search string for suggestions
 *     responses:
 *       200:
 *         description: Array of suggestion strings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Query is required
 *       500:
 *         description: Server error
 */
router.get("/show-suggestions", showSuggestions);
/**
 * @openapi
 * /api/v1/public/yt/do-something:
 *   get:
 *     summary: Example debug endpoint
 *     description: Runs a sample youtube search and returns the raw response. Useful for debugging.
 *     responses:
 *       200:
 *         description: Debug data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get("/do-something", doSomething);

export default router;
