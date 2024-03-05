import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/userController.js";
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

export default router;

