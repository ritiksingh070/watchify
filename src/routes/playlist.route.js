import { Router } from 'express';
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, 
                        removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const route = Router();

route.use(verifyJWT);


route.route("/").post(createPlaylist)

route.route("/:playlistId").get(getPlaylistById)
route.route("/:playlistId").patch(updatePlaylist)
route.route("/:playlistId").delete(deletePlaylist);

route.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
route.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

route.route("/user/:userId").get(getUserPlaylists);

export default route