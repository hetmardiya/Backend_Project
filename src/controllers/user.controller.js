import {asyncHandlers} from '../utils/asyncHandlers.js'
import {ApiError} from '../utils/API_Errors.js'
import {User} from '../models/user.model.js'
import {uploadCloudinary} from '../utils/cloudinary.js'
import { Api_Response } from '../utils/API_Response.js'

const generatesAccessAndRefreshTocken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500 , "something went wrong while generating access and refresh token")
    }
}
const registerUser = asyncHandlers (async (req,res)=>{
    let {username , email , fullname , password} = req.body
    console.log(email);
    
    if (
        [username , fullname ,email , password].some((field)=> field?.trim()==="")
    ) {
        throw new ApiError(400 , "All Fields Are Required")
    }
    
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409 , "the user already exists")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avtarLocalPath){
        throw new ApiError(400 , "avtar image is required")
    }
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
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

const loginUser = asyncHandlers(async (req,res) =>{
    const {email , username , password} = req.body

    if(!(email || username)){
        throw new ApiError(400 , "email or password is required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if (!user) {
        throw new ApiError(404 , "user doesn't exists")
    }

    const passwordValid = await user.passwordCurrection(password)

    if (!passwordValid) {
        throw new ApiError(404 , "invalid password")
    }

    const {accessToken , refreshToken} = await generatesAccessAndRefreshTocken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken" , refreshToken , options).json(
        new Api_Response(
            200,
            {
                user: loggedInUser , accessToken ,refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logOutUser = asyncHandlers(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken" , options).clearCookie("refreshToken" , options).json(new Api_Response(200 , {} ,"user logged out") )
})

export {
    registerUser,
    loginUser ,
    logOutUser
} 