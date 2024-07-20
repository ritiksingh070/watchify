import express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "13kb"}))
app.use(express.urlencoded({extended: true, limit: "13kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// import route
import userRoute from "./routes/user.route.js";
import commentRoute from "./routes/comment.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import healthcheckRoute from "./routes/healthcheck.js";
import likeRoute from "./routes/like.route.js";
import playlistRoute from "./routes/playlist.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import tweetRoute from "./routes/tweet.route.js";
import videoRoute from "./routes/video.route.js";

// declaration
app.use("/api/v1/users", userRoute)
app.use("/api/v1/comment", commentRoute)
app.use("/api/v1/dashboard", dashboardRoute)
app.use("api/v1/healthcheck", healthcheckRoute)
app.use("/api/v1/playlist", playlistRoute)
app.use("api/v1/like", likeRoute)
app.use("api/v1/subscription", subscriptionRoute)
app.use("api/v1/tweet", tweetRoute)
app.use("api/v1/video", videoRoute)



export { app }