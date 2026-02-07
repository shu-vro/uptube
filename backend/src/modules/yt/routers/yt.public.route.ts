import { Router } from "express";
import {
  do_something,
  getDownloadData,
  getVideoInfo,
  home,
  searchVideos,
  showSuggestions,
  updateDislikes,
} from "../controllers/yt.controller";
import isEncrypted from "middlewares/auth/is_encrypted";

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
 * /api/v1/public/yt/download-data/{id}:
 *   post:
 *     summary: Get download data for a YouTube video
 *     description: Retrieves streaming data for a YouTube video based on the provided ID and optional format options in the request body.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: YouTube video ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 description: Format type (e.g., "any")
 *               type:
 *                 type: string
 *                 description: Media type (e.g., "video+audio")
 *               quality:
 *                 type: string
 *                 description: Quality (e.g., "360p")
 *               # Add other properties from Types.FormatOptions as needed
 *     responses:
 *       200:
 *         description: Streaming data for the video
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Fetched download data"
 *                     data:
 *                       type: object
 *                       properties:
 *                         itag:
 *                           type: integer
 *                           example: 18
 *                         url:
 *                           type: string
 *                           example: "https://rr1---sn-n0hhpujvh-q5jd.googlevideo.com/videoplayback?..."
 *                         width:
 *                           type: integer
 *                           example: 640
 *                         height:
 *                           type: integer
 *                           example: 360
 *                         last_modified:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-08-06T15:20:09.240Z"
 *                         last_modified_ms:
 *                           type: string
 *                           example: "1754493609240158"
 *                         content_length:
 *                           type: integer
 *                           example: 33143489
 *                         quality:
 *                           type: string
 *                           example: "medium"
 *                         fps:
 *                           type: integer
 *                           example: 25
 *                         quality_label:
 *                           type: string
 *                           example: "360p"
 *                         projection_type:
 *                           type: string
 *                           example: "RECTANGULAR"
 *                         average_bitrate:
 *                           type: integer
 *                           example: 420232
 *                         bitrate:
 *                           type: integer
 *                           example: 420282
 *                         audio_quality:
 *                           type: string
 *                           example: "AUDIO_QUALITY_LOW"
 *                         approx_duration_ms:
 *                           type: integer
 *                           example: 630955
 *                         audio_sample_rate:
 *                           type: integer
 *                           example: 44100
 *                         audio_channels:
 *                           type: integer
 *                           example: 2
 *                         is_drc:
 *                           type: boolean
 *                           example: false
 *                         mime_type:
 *                           type: string
 *                           example: "video/mp4; codecs=\"avc1.42001E, mp4a.40.2\""
 *                         is_type_otf:
 *                           type: boolean
 *                           example: false
 *                         has_audio:
 *                           type: boolean
 *                           example: true
 *                         has_video:
 *                           type: boolean
 *                           example: true
 *                         has_text:
 *                           type: boolean
 *                           example: false
 *                         language:
 *                           type: string
 *                           example: "en"
 *                         is_dubbed:
 *                           type: boolean
 *                           example: false
 *                         is_auto_dubbed:
 *                           type: boolean
 *                           example: false
 *                         is_descriptive:
 *                           type: boolean
 *                           example: false
 *                         is_secondary:
 *                           type: boolean
 *                           example: false
 *                         is_original:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid video ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post("/download-data/:id", getDownloadData);
/**
 * @openapi
 * /api/v1/public/yt/update-dislikes/{video_id}:
 *   put:
 *     summary: Update dislike count for a video
 *     description: Updates the dislike count for a given video ID. Checks if the video was disliked recently (within 7 days) to prevent frequent updates.
 *     parameters:
 *       - in: path
 *         name: video_id
 *         schema:
 *           type: string
 *         required: true
 *         description: YouTube video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dislike_count:
 *                 type: number
 *                 description: The new dislike count value
 *             required:
 *               - dislike_count
 *     responses:
 *       200:
 *         description: Dislike count updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: string
 *                   example: "ok"
 *       400:
 *         description: Invalid request (missing video ID, invalid dislike count, or rate limited)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.put("/update-dislikes/:video_id", isEncrypted, updateDislikes);
/**
 * @openapi
 * /api/v1/public/yt/do-something:
 *   get:
 *     summary: Do something (example endpoint)
 *     description: An example endpoint that performs a specific action.
 *     responses:
 *       200:
 *         description: Successful response with data
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
 *                   description: Result of the action performed
 *       500:
 *         description: Server error
 */
router.get("/do-something", do_something);

export default router;
