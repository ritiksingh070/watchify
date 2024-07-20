import { Router } from "express";
import {publishVideo, deleteVideo, getVideoById, togglePublishStatus, getAllVideos} from "../controllers/video.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const route = Router()

route.use(verifyJWT)

route.route("/publish").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), publishVideo )

route.route("/delete-video/:videoId").delete(deleteVideo);
route.route("/get-video/:videoId").get(getVideoById);
route.route("/update-video/:videoId").patch(upload.single("thumbnail"), updateVideo);
route.route("/toggle/publish/:videoId").patch(togglePublishStatus);
route.route("/get-video").get(getAllVideos)

export default route