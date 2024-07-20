import { Router } from 'express';
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const route = Router();

route.use(verifyJWT); 

route.route("/").post(createTweet);
route.route("/user/:userId").get(getUserTweets);
route.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default route