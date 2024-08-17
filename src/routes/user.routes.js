import {Router} from 'express'
import { registerUser , loginUser , logOutUser } from './../controllers/user.controller.js';
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

export default router