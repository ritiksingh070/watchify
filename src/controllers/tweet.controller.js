import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/*** Route handler for creating a tweet ***/
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const userID = req.user._id

    const user = await User.findById(userID)

    if(!user) {
        throw new ApiError(403, "You are not authorized to post a tweet") 
    }

    const tweet = await Tweet.create({
        content,
        owner: userID
    })

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )

})


/*** Route handler for deleting a tweet ***/
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    const tweet = await Tweet.findOneAndDelete({ _id: tweetId })

    if(!tweet) {
        throw new ApiError(400, "Failed to delete a tweet")
    }

    return res.status(200)
    .json(
        new ApiResponse (200, null, "Tweet successfully deleted")
    )
})


/*** Route handler for updating a tweet ***/
const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    const userId = req.user.id

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "Tweet not found")
    }

    // check if the user is the owner of the tweet
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content

    await tweet.save()
    
    return res.status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})


/*** Route handler for accessing user tweets ***/
const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const user = await User.findById(userId)

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.aggregate([
        { 
            $match : { owner : mongoose.Types.ObjectId(userId) }
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
    ])

    return res.status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fethched successfully")
    )
})


export {
    createTweet,
    deleteTweet,
    updateTweet,
    getUserTweets }