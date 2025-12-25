import { Video } from "../models/video.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose, { isValidObjectId } from "mongoose"
import { deleteFromCloudinary } from "../utils/cloudinary.js"


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // TODO get video, upload to cloudinary, create video

    //validate title description
    if (
        [title, description].some((feild) => {
            feild.trim() === ""
        })
    ) {
        throw new apiError(400, "all feilds are required")
    }


    //get video and thumnail
    const videoPath = req.files?.videoFile[0].path;
    if (!videoPath) {
        throw new apiError(400, "video path is required");
    }
    const thumbnailPath = req.files?.thumbnail[0].path;
    if (!thumbnailPath) {
        throw new apiError(400, "thumbnail Path is required");
    }

    //upload to cloudinary
    const videoFile = await uploadOnCloudinary(videoPath);
    console.log("videofile by clodinary:", videoFile.duration)
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!videoFile) {
        throw new apiError(400, "video is required");
    }

    if (!thumbnail) {
        throw new apiError(400, "video is required");
    };


    // duration- get from cloudinary
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished: true
    })

    if (!video) {
        throw new apiError(400, "video object dont created")
    };

    return res
        .status(200)
        .json(
            new apiResponse(200, video, "video Uploaded successfully")
        )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    console.log("query:",page,limit,query,sortBy,sortType,userId);

    const pipeLine = [];

    //filter video if user id is provided
    if (userId) {
        pipeLine.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    //filter by query
    if (query) {
        pipeLine.push({
            $match: {
                $or: [{
                    title: { $regex: query, $options: "i" }
                }, {
                    description: { $regex: query, $options: "i" }
                }
                ]
            }
        })
    }

    //sort
    if (sortBy && sortType) {
        pipeLine.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    } else {
        pipeLine.push({
            $sort: { createdAt: -1 }
        })
    }


    //fetch owners deatils
    pipeLine.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    }
                }
            ]
        }
    })

    //get first element of array-->owner
    pipeLine.push({ $unwind: "$ownerDetails" })

    

    const videoAggregate = await Video.aggregate(pipeLine)
      console.log("videoAggregate",videoAggregate);

    /*
        What is aggregatePaginate?
In a real-world app like YouTube, you don't load all 1,000,000 videos at once. You load them in "chunks" (e.g., 10 videos at a time). This is called Pagination.

aggregatePaginate is a plugin for Mongoose. It takes a complex aggregation pipeline and automatically handles the math for "skipping" videos and "limiting" the result count, while also telling you how many pages are left.
    */


const options={
    page:parseInt(page,10),
    limit:parseInt(limit,10)
}

    const videos = await Video.aggregatePaginate(videoAggregate,options);
    console.log("videos",videos)

    return res
    .status(201)
    .json(
        new apiResponse(200,videos,"fetched all the videos ")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    if(!isValidObjectId(videoId)){
        throw new apiError(400,"videoId is not valid")
    }

    const video= await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment views by 1
        { new: true }           // Return the updated document
    ).populate("owner","username fullName avatar");

    if(!video){
        throw new apiError(400,"video not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,video,"fetched video successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new apiError(200,"video id is required")
    }
    //TODO: update video details like title, description, thumbnail
    const { title, description}= req.body;
    const thumbnailLocalPath= req.file?.path;

    if(!title && !description && thumbnailLocalPath){
        throw new apiError(200,"atleat one feild( title, desc, thumbnail) is req")
    }

    const oldVideo = await Video.findById(videoId);
    if(!oldVideo){
        throw new apiError(200,"video not found")
    }


    let thumbnail
   
    if(thumbnailLocalPath){
 thumbnail= await uploadOnCloudinary(thumbnailLocalPath);
 if(!thumbnail.url){
    throw new apiError(200,"error while uploading thumbnail")
 }

 const oldThumbnailUrl= oldVideo.thumbnail;
 if(oldThumbnailUrl){
    const publicId= oldThumbnailUrl.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
 }
    }
    
   

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title|| oldVideo.title,
                description:description||oldVideo.description,
                thumbnail:thumbnail?.url||oldVideo.thumbnail
            }
        },
        {new:true}
    )

    
if(!video){
  throw new apiError(200,"video not found");
}

   return res
   .status(200)
   .json(
    new apiResponse(200,video,"updated successfully")
   )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new apiError(200,"invalid videoid");
    }

    //get video
    const video= await Video.findById(videoId);
    if(!video){
        throw new apiError(200,"video not found");
    }

    //get url
    const videoFilePublicId= video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId= video.thumbnail.split("/").pop().split(".")[0];

    try {
        //delete from cloudinary
        await deleteFromCloudinary(videoFilePublicId);
        await deleteFromCloudinary(thumbnailPublicId);
    } catch (error) {
        throw new apiError(200,"error while deleting from cloudinary")
    }

   //delete from db
    await findbyIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new apiResponse(400,"successfully deleted video")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

  if(!videoId){
        throw new apiError(200,"invalid videoid");
    }

     //get video
    const video= await Video.findById(videoId);
    if(!video){
        throw new apiError(200,"video not found");
    }

    video.isPublished=!video.isPublished;
    await video.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(
        new apiResponse(200,video.isPublished,`Video has been ${video.isPublished ? "published" : "un-published"} successfully`)
    )
})


export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}