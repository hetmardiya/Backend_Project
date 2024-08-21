import {Router} from 'express'
import { registerUser , loginUser , logOutUser , refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvtar, updateUserCoverImage, getUserChennelProfile, getWatchHistory } from './../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJWY } from './../middlewares/auth.middlewares.js';


const router = Router()

router.route("/register").post(
    upload.fields(
        [
            {
                name : "avtar",
                maxCount : 1
            },
            {
                name : "coverImage",
                maxCount : 1
            }
        ]
    ),
    registerUser
)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWY ,  logOutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWY , changeCurrentPassword)
router.route("/current-user").get(verifyJWY,getCurrentUser)
router.route("/update-account").patch(verifyJWY,updateAccountDetails)

router.route("/avtar").patch(verifyJWY,upload.single("avtar"), updateUserAvtar)

router.route("/cover-image").patch(verifyJWY,upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWY,getUserChennelProfile)
router.route("/history").get(verifyJWY,getWatchHistory)

export default router