import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js" 
import { User } from "../models/User.model.js";

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

    const avatarLocalPath = req.files ?.avatar[0]?.path;
});