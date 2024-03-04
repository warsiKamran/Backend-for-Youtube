import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const isAuthenticated = asyncHandler(async(req, _ , next) => {

    try {
        const token = req.cookies;
    
        if(!token){
            throw new apiError(401, "You are not logged in");
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id);
        next();
    } 
    catch (error) {
        throw new apiError(401, error?.message || "invalid token");
    }
});

