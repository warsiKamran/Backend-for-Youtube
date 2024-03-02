import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({

    username: {
        type: String,
        required: [true, "username is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,    //searching will be easy and optimised
    },

    email: {
        type: String,
        required: [true, "email is required"],
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        select: false,
        required: [true, "Password is required"],   
    },

    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },

    avatar: {
        type: String,
        required: true,
    },

    coverImage: {
        type: String,
    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],

    refreshToken: {
        type: String,
        select: false,
    },

}, {timestamps: true});


userSchema.pre("save", async function(next){

    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isValidPassword = async function(password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.getJWTtoken = function(){

    return jwt.sign({_id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

userSchema.methods.getRefreshToken = function(){

    return jwt.sign({_id: this._id}, process.env.REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_EXPIRE
    });
};

export const User = mongoose.model("User", userSchema);
