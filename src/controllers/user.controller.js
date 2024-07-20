import { asyncHandler } from "../utils/asyncHandler.js"; 
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {cloudinaryUpload, cloudinaryDelete} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


/** method for generating access and refresh token **/
const generateAccessAndRefreshTokens = async (userId) => {

    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken

        await user.save( {validateBeforeSave : false} )

        return {accessToken, refreshToken}

    } catch(err){
        throw new ApiError(500, "Couldn't generate Acesss or Refresh token")
    }
}


/**** Defining a route handler for registering a user ****/
const regUser = asyncHandler( async (req, res) => {

    // Destructuring values from request body
    const { fullname, email, username, password } = req.body;

    const fields = [fullname, email, username, password];
    
    // Checking for empty fields and throw error i.e. validation
    for (const field of fields) {
        if (!field || !field.trim()) {
            throw new ApiError(400, "Empty fields are not acceptable");
        }
    }
    
    // Checking if a user already exists with the provided email or username
    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });
    
    if (existingUserByEmail || existingUserByUsername) {
        throw new ApiError(409, "User already exists");
    }

    // handle the avatar and coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!");
    }
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //upload both on cloudinary
    const avatar = await cloudinaryUpload(avatarLocalPath)
    // console.log('Avatar upload response:', avatar);

    const coverImage = await cloudinaryUpload(coverImageLocalPath)
    // console.log('Cover image upload response:', coverImage);

    if(!avatar) {
        throw new ApiError(400, "Avatar file upload failed!");
    }

    // create user object (entry in db)
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:  coverImage?.url || "", // Use coverImageLocalPath if uploaded, otherwise use a null value
        username : username.toLowerCase(),
        password,
        email
    }
    )

    //search for user and remove passowrd and refresh token (excluding sensitive information)
    const checkForUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check if user is created
    if(!checkForUser){
        throw new ApiError(500, "Couldn't register the user");
    }

    //return respone
    return res.status(201).json(
        new ApiResponse(200, checkForUser, "User successfully registered!")
    )
    
})


/*** Defining a route handler for logging In a user ****/
const loginUser = asyncHandler(async (req, res) => {

    // get data from req body
    const {username, email, password} = req.body

    // login with username or email
    if(!email && !username) {
        throw new ApiError(400, "One of the field is required")
    }

    // search for the user
    const user =  await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(402, "User doesn't exist")
    }

    // check for password
    const validPassword = await user.isPasswordCorrect(password)

    if(!validPassword) {
        throw new ApiError(403, "Password Incorrect")
    }

    // generate access and refresh token
    const {accessToken, refreshToken} = await 
    generateAccessAndRefreshTokens(user._id)

    const loggedUser = await User.findById(user._id).
    select("-password -refreshToken")

    // send these tokens in cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})


/*** Route handler for logging Out a user ****/
const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User Logged Out Successfully") )
})


/*** Route handler for refreshing the access token using a valid refresh token ****/
const refreshAccessToken = asyncHandler(async (req, res) => {

    // Extract refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(402, "Invalid request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Refresh Token Invalid")
        }
    
        // Check if the stored refresh token matches the incoming refresh token
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Expired refresh token or used token")
        }
    
        // Generate new access and refresh tokens for the user
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        // Set the new access and refresh tokens as cookies in the response
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( new ApiResponse(
            200,
            {
                accessToken, newRefreshToken
            },
            "Access token refreshed successfully"
        ) )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


/***Route hanlder for changing password ***/
const changePassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const validPassword = await user.isPasswordCorrect(oldPassword)

    if(!validPassword) {
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})


/***Route handler for getting current user ***/
const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
})

/*** Route handler for updating user details ***/
const updateUserDetails = asyncHandler(async (req, res) => {
    
    const {fullname, email} = req.body
    
    if(!fullname && !email) {
        throw new ApiError(400, "One of the field is required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                fullname, 
                email
            }
        }, {new: true})
        .select("-password")

        return res.status(200).json(
            new ApiResponse(200, user, "User Details updated successfully")
        )
})


/*** Route handler for Updating Avatar ***/
const updateUserAvatar = asyncHandler(async (req, res) => {

    // get the local path of uploaded avatar
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!");
    }

    //upload the avatar on cloudinary
    const avatar = await cloudinaryUpload(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Avatar file upload failed!");
    }

    // Get the old avatar URL from the user data
    const oldImageUrl = req.user.avatar;

    // Delete the old avatar image
    const oldImageDeleted = await cloudinaryDelete(oldImageUrl);
    
    // Check if the old avatar deletion was successful
    if (!oldImageDeleted) {
        throw new ApiError(500, "Failed to delete old avatar image.");
    }

    // Update the user's avatar URL in the database
    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                avatar: avatar.url
            }
        }, {new: true})
        .select("-password")

    return res.status(200)
    .json( 
        new ApiResponse(200, user, "Avatar updated successfully")
    ) 
})


/*** Route handler for Updating Cover Image ***/
const updateUserCoverImage = asyncHandler(async (req, res) => {

    //get the local path of uploaded cover image
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing!");
    }

    // upload the cover image on cloudinary
    const coverImage = await cloudinaryUpload(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Avatar file upload failed!");
    }

    // Get the old cover URL from the user data
    const oldImageUrl = req.user.coverImage;

    // Delete the old cover image
    const oldImageDeleted = await cloudinaryDelete(oldImageUrl);
        
    if (!oldImageDeleted) {
        throw new ApiError(500, "Failed to delete old avatar image.");
    }

    // Update the user's coverImage URL in the database
    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                coverImage: coverImage.url
            }
        }, {new: true})
        .select("-password")

    return res.status(200)
    .json( 
        new ApiResponse(200, user, "Cover Image updated successfully")
    ) 
})


/*** Route handler for getting channel details***/
const userChannelProfile = asyncHandler(async (req, res) => {

    const {username} = req.params

    if(!username.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channelInfo = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        }, 
        {
            // getting total subscibers
            $lookup: {
                from: "subscriptions", // from Subscription model
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, 
        {
            // total channel subscribed to
            $lookup: {
                from: "subscriptions", // from Subscription model
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannel"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedChannelCount: {
                    $size: "$subscribedChannel"
                },
                subscribedStatus: {
                    $cond: {
                        if: { 
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: false,
                        else: true
                    }
                }
            }
        }, 
        {
            $project: {
                username: 1,
                fullname: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedChannelCount: 1,
                subscribedStatus: 1
            }
        }
    ])

    console.log(channelInfo)

    if(!channelInfo?.length){
        throw new ApiError(404, "channel not found")
    }

    return res.status(200).json(
        new ApiResponse(200, channelInfo[0], "channel fetched successfully")
    )

})


/*** Route Handler for getting watch history **/
const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // Lookup to get video details from the 'videos' collection based on watchHistory
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        // Nested lookup to retrieve owner details from the 'users' collection
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    // Projecting relevant owner fields
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // Adding a new field 'owner' by extracting the first element from the 'owner' array
                        $addFields:{
                            owner:{
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


/*** Route handler for deleting user channel ***/
const deleteUserChannel = asyncHandler(async (req, res) => {
    
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Delete the user channel and related data
    const deletionResult = await User.deleteOne({ _id: userId });

    if (deletionResult.deletedCount === 0) {
        throw new ApiError(404, "User channel not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "User channel deleted successfully")
    );
});



export { loginUser,
        regUser,
        logoutUser, 
        refreshAccessToken, 
        changePassword, 
        getCurrentUser,
        updateUserDetails,
        updateUserAvatar,
        updateUserCoverImage, 
        userChannelProfile,
        getWatchHistory,
        deleteUserChannel }  