import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/*** Route handler for toggling like on a video ***/
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    try {
            const existingLike = await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id })
        
            if (!existingLike) {
                await Like.create({ video: videoId, likedBy: req.user._id })
            }
        
            const likeCount = await Like.countDocuments({ video: videoId }).lean()
        
            return res.status(200).json(
                new ApiResponse(200, {
                    likeCount : likeCount.toString(), 
                    userLiked: existingLike !== null 
                }, "Video like status updated successfully")
            )
    } catch (error) {
        throw new ApiError(400, "Failed to toggle like status for video") 
    }

})


/*** Route handler for toggling like on a comment ***/
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    try {
            const existingLike = await Like.findOneAndDelete({ comment: commentId, likedBy: req.user._id })
        
            if (!existingLike) {
                await Like.create({ comment: commentId, likedBy: req.user._id })
            }
        
            const likeCount = await Like.countDocuments({ comment: commentId }).lean()
        
            return res.status(200).json(
                new ApiResponse(200, {
                    likeCount : likeCount.toString(), 
                    userLiked: existingLike !== null 
                }, "Comment like status updated successfully")
            )
    } catch (error) {
        throw new ApiError(400, "Failed to toggle like status for comment")   
    }
})


/*** Route handler for toggling like on a tweet ***/
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    try {
        
        const existingLike = await Like.findOneAndDelete({tweet : tweetId, likedBy : req.user._id})

        if(!existingLike) {
            await Like.create({tweet: tweetId, likedBy: req.user._id})
        }

        const likeCount = await Like.countDocuments({tweet: tweetId}).lean()

        return res.status(200)
        .json(
            new ApiResponse(200, {
                likeCount: likeCount.toString(), 
                userLiked: existingLike !== null
            }, "Tweet like status updated successfully")
        )

    } catch (error) {
        throw new ApiError(400, "Faile to toggle like status for tweet")
    }
})


/*** Route handler for getting all the liked videos ***/
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: mongoose.Types.ObjectId(userId),
                    video: { $exists: true }
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'videoDetails'
                }
            },
            {
                $addFields: {
                    videoDetails: {
                        $arrayElemAt: ['$videoDetails', 0]
                    }
                }
            }
        ]);

        if(likedVideos.length === 0) {
            throw new ApiError(400, "No liked videos were found")
        }

        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        )

    } catch (error) {
        throw new ApiError(500, "Failed to retrieve liked videos");
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos }