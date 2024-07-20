import { Router } from 'express';
import { getLikedVideos, toggleCommentLike, toggleVideoLike, 
            toggleTweetLike } from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const route = Router();
route.use(verifyJWT); 

route.route("/toggle/v/:videoId").post(toggleVideoLike);
route.route("/toggle/c/:commentId").post(toggleCommentLike);
route.route("/toggle/t/:tweetId").post(toggleTweetLike);
route.route("/videos").get(getLikedVideos);

export default route