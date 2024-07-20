import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "src/models/video.model.js"
import {User} from "src/models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {cloudinaryUpload, cloudinaryDelete} from "../utils/cloudinaryUpload.js"


/*** Route handler for uploading video ***/
const publishVideo = asyncHandler(async (req, res) => {
    
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Both video file and thumbnail are required!");
    }
    
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Both title and description are required!");
    }

    // For Video
    const videoFilePath = req.files.videoFile[0]?.path;

    if (!videoFilePath) {
        throw new ApiError(400, "Video file is required!");
    }

    const videoCloudinaryResponse = await cloudinaryUpload(videoFilePath);
   //  console.log(videoCloudinaryResponse)

    if (!videoCloudinaryResponse.url) {
        throw new ApiError(500, "Video upload failed!");
    }

    // For Thumbnail
    const thumbnailFilePath = req.files.thumbnail[0]?.path;

    if (!thumbnailFilePath) {
        throw new ApiError(400, "Thumbnail file is required!");
    }
    
    const thumbnailCloudinaryResponse = await cloudinaryUpload(thumbnailFilePath);

    if (!thumbnailCloudinaryResponse || !thumbnailCloudinaryResponse.url) {
        await cloudinaryDelete(videoCloudinaryResponse.url);
        throw new ApiError(500, "Thumbnail upload failed!");
    } 

    // a new video document in the database
    const newVideo = new Video({
        videoFile: videoCloudinaryResponse.url,
        thumbnail: thumbnailCloudinaryResponse.url,
        description,
        title,
        duration: videoCloudinaryResponse?.info?.duration || 0,
        owner: req.user._id
    });

    const savedVideo = await newVideo.save();

    return res.status(201).json( 
        new ApiResponse(200, savedVideo, "Video published successfully"))

});


/*** Route handler for deleting video ***/
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const videoResult = await Video.findById(videoId)

    if(!videoResult){
        throw new ApiError(404, "Couldn't find video")
    }

    const videoURL = videoResult.videoFile; 

    const deletionResult = await cloudinaryDelete(videoURL);

    if(!deletionResult) {
        throw new ApiError(500, "Video deletion failed")
    }

    await Video.deleteOne({ _id: videoId });

    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    )

})


/*** Route handler for accessing a video ***/
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const videoResult = await Video.findById(videoId)

    if (!videoResult) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new ApiResponse(200, videoResult, "video fetched successfully")
    )
})


/*** Route handler for updating a video ***/
const updateVideo = asyncHandler(async (req, res) => {

    try {
            const { videoId } = req.params
            const { title, description} = req.body
            const thumbnailFilePath = req.file?.path
    
            if (!thumbnailFilePath) {
                throw new ApiError(400, "Thumbnail file is missing!");
            }
    
            const uploadThumbnail = await cloudinaryUpload(thumbnailFilePath);
    
            if (!uploadThumbnail || !uploadThumbnail.url) {
                throw new ApiError(500, "Thumbnail upload failed!");
            } 
    
            const existingVideo = await Video.findById(videoId);
            const oldThumbnailURL = existingVideo.thumbnail;
    
            if (oldThumbnailURL) {
                await cloudinaryDelete(oldThumbnailURL);
            }
    
            const video = await Video.findByIdAndUpdate(videoId,
                {
                    $set: {
                        title: title || "",
                        thumbnail: uploadThumbnail.url,
                        description: description || ""
                    }
                }, {new: true})
    
            return res.status(200)
            .json( 
                new ApiResponse(200, video, "Video updated successfully")
            ) 

    } catch (error) {
        throw new ApiError(401, error?.message || "Video update failed");
    }
})


/*** Route handler for toggling publish status of a video ***/
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the publish status
    video.isPublished = !video.isPublished;

    try {
        const updatedVideo = await video.save();
        return res.status(200).json(new ApiResponse(200, updatedVideo, "Published status updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error updating published status");
    }
})


/*** Route handler for accessing all the videos based on queries ***/
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
            };
        
            const result = await Video.aggregatePaginate(
                [
                    { 
                        $match: {
                            $or: [
                                query ? { title: { $regex: new RegExp(query, 'i') } } : {},
                                userId ? { owner: userId } : {},
                            ],
                        }
                    },
                    { 
                        $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 },
                    }
        
                ], options);
        
            res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        currentPage: result.page,
                        totalPages: result.totalPages,
                        totalResults: result.totalDocs,
                        nextPage: result.hasNextPage ? result.nextPage : null,
                        videos: result.docs,
                    },
                    "Videos fetched successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Error fetching videos") 
    }
    
});



export {
    publishVideo, 
    deleteVideo, 
    getVideoById,
    updateVideo,
    togglePublishStatus,
    getAllVideos
}