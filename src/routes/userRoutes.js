import { Router } from "express";
import {upload} from "../middlewares/multer.js"
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { changePassword, 
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateCoverImage, 
    updateProfile, 
    updateUserAvatar
} from "../controllers/userController.js";

const router = Router();

//signup
router.route("/register").post(

    upload.fields([

        {
            name: "avatar",
            maxCount: 1
        },

        {
            name: "coverImage",
            maxCount: 1
        }
    ]), 
    registerUser
);

//login
router.route("/login").post(loginUser);

//logout
router.route("/logout").post(isAuthenticated, logoutUser);

//referesh token
router.route("/getrefreshtoken").post(refreshAccessToken);

//cahnge password
router.route("/updatepassword").post(isAuthenticated, changePassword);

//get current user
router.route("/profile").get(isAuthenticated, getCurrentUser);

//update profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

//updating avatar image
router.route("/avatar").put(isAuthenticated, upload.single("avatar"), updateUserAvatar);

//updating cover image
router.route("/coverimage").put(isAuthenticated, upload.single("coverImage"), updateCoverImage);


export default router;

