import { Router } from 'express';
import { addComment, deleteComment, getVideoComments, updateComment} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const route = Router();

route.use(verifyJWT); 


route.route("/:videoId").get(getVideoComments).post(addComment);

route.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default route