import {asyncHandlers} from '../utils/asyncHandlers.js'
import {ApiError} from '../utils/API_Errors.js'
import {User} from '../models/user.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import { Api_Response } from '../utils/API_Response.js'
const registerUser = asyncHandlers (async (req,res)=>{
    let {username , email , fullname , password} = req.body
    console.log(email);
    
    if (
        [username , fullname ,email , password].some((field)=> field?.trim()==="")
    ) {
        throw new ApiError(400 , "All Fields Are Required")
    }
    
    const existedUser = User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409 , "the user already exists")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avtarLocalPath){
        throw new ApiError(400 , "avtar image is required")
    }

    const avtar = await uploadCloudinary(avtarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)
    if (!avtar) {
        throw new ApiError(400 , "avtar image is required")
    }

    const user = await User.create({
        fullname,
        avtar:avtar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 , "something went wrong while registring the data")
    }

    return res.status(201).json(
        new Api_Response(200 , createdUser , "user registered successfully")
    )
})

export default registerUser