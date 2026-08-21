import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { uploadOnImageKit, deleteFromImageKit } from "../utils/imagekit.js";


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnImageKit(videoLocalPath);
    if (!videoFile?.url) {
        throw new ApiError(500, "Video upload failed");
    }

    const thumbnail = await uploadOnImageKit(thumbnailLocalPath);
    if (!thumbnail?.url) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        videoFileId: videoFile.fileId,
        thumbnail: thumbnail.url,
        thumbnailFileId: thumbnail.fileId,
        title: title.trim(),
        description: description.trim(),
        duration: videoFile.duration || 0, // imagekit returns duration (seconds) for video uploads
        owner: req.user._id,
    });

    const createdVideo = await Video.findById(video._id);

    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video published successfully"));
});


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const match = { isPublished: true };

    if (query) {
        match.title = { $regex: query, $options: "i" };
    }

    if (userId && mongoose.isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const aggregate = Video.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }],
            },
        },
        { $addFields: { owner: { $first: "$owner" } } },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
    ]);

    const result = await Video.aggregatePaginate(aggregate, {
        page: Number(page),
        limit: Number(limit),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "username fullname avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // log it in the viewer's watch history, if they're logged in
    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: video._id },
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this video");
    }

    if (title?.trim()) video.title = title.trim();
    if (description?.trim()) video.description = description.trim();

    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnImageKit(thumbnailLocalPath);
        if (!thumbnail?.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        if (video.thumbnailFileId) {
            await deleteFromImageKit(video.thumbnailFileId);
        }
        video.thumbnail = thumbnail.url;
        video.thumbnailFileId = thumbnail.fileId;
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }

    if (video.videoFileId) await deleteFromImageKit(video.videoFileId);
    if (video.thumbnailFileId) await deleteFromImageKit(video.thumbnailFileId);

    await video.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Publish status toggled"));
});


export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
