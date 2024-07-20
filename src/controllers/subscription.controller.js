import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/*** Route handler for toggling subscription ***/
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { _id: subscriberId } = req.user

    // check if the user is already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    })

    if (existingSubscription) {
        // user is already subscribed; unsubscribe
        await Subscription.findOneAndDelete({
        subscriber: subscriberId,
        channel: channelId,
        })

        res.status(200)
        .json(
            new ApiResponse(200, null, 'Unsubscribed successfully') 
        )

    } else {
        // user is not subscribed; subscribe
        const newSubscription = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
        })

        res.status(201)
        .json(
            new ApiResponse(201, newSubscription, 'Subscribed successfully') 
        )
    }
})


/*** Route handler for getting subscriber list for a channel***/
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriberDetails'
            }
        },
        {
            $unwind: '$subscriberDetails'
        },
        {
            $project: {
                subscriber: {
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscriber list fetched successfully")
    )
    
})


/*** Route handler for finding subscribed channels for a given subscriber***/
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    try {
        // fetch channel list for the given subscriber
        const subscribedChannels = await Subscription.aggregate([
            {
                $match: { subscriber: mongoose.Types.ObjectId(subscriberId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'channel',
                    foreignField: '_id',
                    as: 'channelDetails'
                }
            },
            {
                $unwind: '$channelDetails'
            },
            {
                $project: {
                    channel: {
                        username: 1,
                        fullname: 1,
                        avatar:1
                    }
                }
            }
        ])

        res.status(200).json(
            new ApiResponse(200, subscribedChannels, 'Subscribed channels fetched successfully')
        )

    } catch (error) {
        throw new ApiError(500, 'Error fetching subscribed channels')
    }
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}