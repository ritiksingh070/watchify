import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/*** Route handler for creating a playlist ***/
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(400, "Both the fileds are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user._id
    })

    return res.status(200)
    .json(
        new ApiResponse(200, playlist , "Playlist created successfully")
    )
})


/*** Route handler for adding video to a playlist ***/
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const video = await Playlist.findById(videoId);

    if(!video) {
        throw new ApiError(400, "video not found")
    }

    const playlist = await Playlist.findByIdAndUpdate( playlistId, 
        {
            $push: {videos: videoId}
        }, 
        {new : true} 
    )

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "Video added to the playlist")
    )
})


/*** Route handler for removing video from playlist ***/
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid id");
    }

    const playlist = await Playlist.findByIdAndUpdate( playlistId,
        {
            $pull : {videos: videoId}
        },
        {new : true}
    )

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "video removed from playlist")
    )
})


/*** Route handler for updating the playlist ***/
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(400, "name or description is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findByIdAndUpdate( playlistId, 
        {
            $set : {
                name,
                description
            }
        },
        {new : true}
    )

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "updated playlist")
    )
})


/*** Route handler for deleting playlist ***/
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid id");
    }

    const playlist = await Playlist.findOneAndDelete({ _id : playlistId})

    if(!playlist) {
        throw new ApiError(400, "Failed to delete the playlist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, null, "Playlist successfully deleted")
    )
})


/*** Route handler for accessing user's playlist ***/
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const user = await Playlist.findById(userId)

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { owner: mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails',
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videoDetails',
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: {
                    username: 1,
                    avatar: 1
                },
                videos: {
                    $map: {
                        input: '$videoDetails',
                        as: 'video',
                        in: {
                            title: '$$video.title',
                            description: '$$video.description',
                            videoFile: '$$video.videoFile',
                            thumbnail: '$$video.thumbnail',
                            duration: '$$video.duration',
                            views : '$$video.views'
                        }
                    }
                }
            }
        }
    ]);
    

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "User's playlist fetched successfully")
    )
})


/*** Route handler for accessing playlist ***/
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    const playlist = await Playlist.aggregate([
        {
            $match : {_id : mongoose.Types.ObjectId(playlistId)}
        },
        {
            $lookup : {
                from : 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videoDetails'
            }
        },
        {
            $project :{
                name : 1,
                description: 1,
                videos : {
                    $map : {
                        $input : '$videoDetails',
                        $as : 'video',
                        $in : {
                            title: '$$video.title',
                            description: '$$video.description',
                            videoFile: '$$video.videoFile',
                            thumbnail: '$$video.thumbnail',
                            duration: '$$video.duration',
                            views : '$$video.views'
                        }
                    }
                }
            }
        }
    ])

    if (playlist.length === 0) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})


export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    getUserPlaylists,
    getPlaylistById }