import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/*** Route handler for accessing all the comments of a video ***/
const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const comments = await Comment.aggregatePaginate([
        {
            $match: {video : mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup :{
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails',
            }
        },
        {
            $unwind: '$ownerDetails'
        },
        {
            $project : {
                content: 1,
                createdAt: 1,
                owner: {
                    username:1,
                    avatar: 1
                }
            }
        }
    ], options)

    return res.status(200)
    .json(
        new ApiResponse(200, comments.docs, "Comments successfully accessed")
    )
})


/*** Route handler for adding comment for a video ***/
const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user._id

    const video = await getVideoById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    return res.status(200)
    .json(
        new ApiResponse(200, comment, "Comment posted successfully")
    )

})


/*** Route handler for updating a comment ***/
const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    const comment = await Comment.findById(commentId);

    if(!comment) {
        throw new ApiError(404, "Comment does not exist")
    }

    // check if the user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(404, "You are not authorized to update this comment")
    }

    comment.content = content
    await comment.save()


    return res.status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})


/*** Route handler for deleting a comment ***/
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const comment = await Comment.findOneAndDelete({ _id: commentId })

    if(!comment) {
        throw new ApiError(400, "Failed to delete the comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, null, "Comment successfully deleted")
    )
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment }