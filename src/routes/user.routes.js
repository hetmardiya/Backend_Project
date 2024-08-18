import {Router} from 'express'
import { registerUser , loginUser , logOutUser , refreshAccessToken } from './../controllers/user.controller.js';
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

export default router