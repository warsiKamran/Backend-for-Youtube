import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js" 
import { User } from "../models/User.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

export const registerUser = asyncHandler(async(req, res) => {
    
    const {username, email, password, fullname} = req.body;

    if(!username || !email || !password || !fullname){
        throw new apiError(404, "Enter all the fields");
    }

    let user = await User.findOne({

        $or: [{email}, {username}]
    });

    if(user){
        throw new apiError(409, "User with email or username already exists");
    }

    const avatarImageLocalPath = req.files ?.avatar[0]?.path;
    const coverImageLocalPath = req.files ?.coverImage[0]?.path;

    if(!avatarImageLocalPath){
        throw new apiError(404, "avatar image not found");
    }

    //uploading on cloudinary
    const avatar = await uploadOnCloudinary(avatarImageLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new apiError(404, "avatar image not found");
    }

    const newUser = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage ?.url || " ",
    });

    //checking if user is successfully created or not
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if(!createdUser){
        throw new apiError(500, "Something went wrong");
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    );
});

