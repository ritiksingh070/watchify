import { Router } from 'express';
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const route = Router()

route.use(verifyJWT)

route.route("/channel-stats").get(getChannelStats)
route.route("/channel-videos").get(getChannelVideos)

export default route