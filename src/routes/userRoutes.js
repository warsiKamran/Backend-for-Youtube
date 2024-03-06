import { Router } from "express";
import { changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateProfile } from "../controllers/userController.js";
import {upload} from "../middlewares/multer.js"
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

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

export default router;

