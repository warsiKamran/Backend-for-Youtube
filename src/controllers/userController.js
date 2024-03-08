import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.getJWTtoken();
        const refreshToken = user.getRefreshToken();

        //putting in database
        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new apiError(500, "Internal server error");
    }
};

export const registerUser = asyncHandler(async (req, res) => {

    const { username, email, password, fullname } = req.body;

    if (!username || !email || !password || !fullname) {
        throw new apiError(404, "Enter all the fields");
    }

    let user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (user) {
        throw new apiError(409, "User with email or username already exists");
    }

    // let avatarImageLocalPath;
    let coverImageLocalPath;

    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    //     avatarImageLocalPath = req.files.avatar[0].path;
    // }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // if(!avatarImageLocalPath){
    //     throw new apiError(404, "file not found");
    // }

    //uploading on cloudinary
    // const avatar = await uploadOnCloudinary(avatarImageLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // if(!avatar){
    //     throw new apiError(404, "avatar image not found");
    // }

    const newUser = await User.create({
        username: username.toLowerCase(),
        password,
        email,
        fullname,
        // avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    //checking if user is successfully created or not
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new apiError(500, "Something went wrong");
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    );
});


export const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;

    if (!email || !password) {
        throw new apiError(400, "email or password is required");
    }

    let user = await User.findOne({
        $or: [{ email }, { username }]
    }).select("+password");

    if (!user) {
        throw new apiError(404, "signup first");
    }

    const isPasswordCorrect = await user.isValidPassword(password);

    if (!isPasswordCorrect) {
        throw new apiError(401, "password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    //the user which we will send , we dont want to sent it's password or refresh token to the frontend
    const loggedInUser = await User.findById(user._id);

    //sending cookies
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "User logged in successfully")
        );
});


export const logoutUser = asyncHandler(async(req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    });

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "User logged out successfullly")
        )
});


export const refreshAccessToken = asyncHandler(async(req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new apiError(401, "Unauthorized request");
    }

    try {
        const decoded = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_SECRET
        );
    
        const user = await User.findById(decoded._id);
    
        if(!user){
            throw new apiError(401, "User not found");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new apiError(401, "Refresh token has been expired or has been used");
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(200, {
                    accessToken,
                    refreshToken: newRefreshToken
                }, "Access token refreshed")
            )
    } 
    catch (error){
        throw new apiError(401, error?.message || "Invalid refresh token");
    }
});


export const changePassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if(!oldPassword || !newPassword){
        throw new apiError(401, "Password fields are empty");
    } 

    const isPasswordCorrect = await user.isValidPassword(oldPassword);

    if(!isPasswordCorrect){
        throw new apiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(
        new apiResponse(200, "Password changed successfully")
    );
});


export const getCurrentUser = asyncHandler(async(req, res) => {

    const user = await User.findById(req.user._id);

    if(!user){
        throw apiError(400, "User is not logged in");
    }

    return res.status(200).json(
        new apiResponse(200, user)
    );
});


export const updateProfile = asyncHandler(async(req, res) => {

    const {fullname, email} = req.body;
    const user = await User.findById(req.user._id);

    if(fullname){
        user.fullname = fullname;
    }

    if(email){
        user.email = email;
    }

    await user.save();

    return res.status(200).json(
        new apiResponse(200, "Profile updated successfully")
    );
});


export const updateUserAvatar = asyncHandler(async(req, res) => {

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new apiError(401, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new apiError(400, "Error while uploading the avatar image");
    }

    //updating 
    const user = await User.findByIdAndUpdate(

        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true},

    ).select("-password");

    return res.status(200).json(
        new apiResponse(200, user, "Avatar image updated successfully")
    );
});


export const updateCoverImage = asyncHandler(async(req, res) => {

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new apiError(401, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new apiError(400, "Error while uploading the cover image");
    }

    //updating 
    const user = await User.findByIdAndUpdate(

        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true},

    ).select("-password");

    return res.status(200).json(
        new apiResponse(200, user, "Cover image updated successfully")
    );
});


export const getUserChannelProfile = asyncHandler(async(req, res) => {

    const {username} = req.params;

    if(!username?.trim()){
        throw new apiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",    // Subscription will change to subscriptions
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup :{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ]);
});
