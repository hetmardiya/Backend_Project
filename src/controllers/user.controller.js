import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/API_Errors.js'
import { Api_Response } from '../utils/API_Response.js'
import { asyncHandlers } from '../utils/asyncHandlers.js'
import { uploadCloudinary } from '../utils/cloudinary.js'
import { use } from 'bcrypt/promises.js'
import mongoose from 'mongoose'
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

    if(!username && !email){
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
            $unset: {
                refreshToken : 1
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

const refreshAccessToken = asyncHandlers(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401 , "invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401 , "expired refresh token")
        }
    
        const option = {
            http: true,
            secure: true
        }
        const {accessToken , newRefreshToken} = await generatesAccessAndRefreshTocken(user._id)
    
        return res.status(200).cookie("accessToken" , accessToken , option).cookie("refreshToken" , newRefreshToken , option).json( new Api_Response(200 , {accessToken , refreshToken: newRefreshToken} , "access token refresh"))
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandlers(async (req,res)=>{
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.passwordCurrection(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400 , "invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new Api_Response(200 , {} , "password changed successfully"))
})

const getCurrentUser = asyncHandlers(async (req,res)=>{
    return res.status(200).json(new Api_Response(200 , req.user ,"current user fetch successfully"))
})

const updateAccountDetails = asyncHandlers(async (req,res)=>{
    const {fullname , email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400 , "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200).json(new Api_Response(200 , user , "account detail updated successfully"))
})

const updateUserAvtar = asyncHandlers(async (req,res)=>{
    const avtarLocalPath = req.file?.path

    if (!avtarLocalPath) {
        throw new ApiError(400 , "avtar file path is missing")
    }

    const avtar = await uploadCloudinary(avtarLocalPath)

    if (!avtar.url) {
        throw new ApiError(400 , "error while uploding on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avtar: avtar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(new Api_Response(
        200 , user , "avtar image uploded successfully"
    ))
})

const updateUserCoverImage = asyncHandlers(async (req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400 , "cover image file path is missing")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400 , "error while uploding on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(new Api_Response(
        200 , user , "cover image uploded successfully"
    ))
})

const getUserChennelProfile = asyncHandlers(async (req,res)=>{
    const {username} = req.params

    if (!username?.trim) {
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as : "subscibers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as : "subsciberedTo"
            }
        },
        {
            $addFields:{
                subscriberCount :{
                    $size : "$subscibers"
                },
                channelsSubscribedToCount:{
                    $size : "$subsciberedTo"
                },
                isSubscribed:{
                    $cond : {
                        if : {$in : [req.user?._id, "$subscibers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount : 1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avtar:1,
                coverImage:1,
                email : 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(400 , "channel doesn't exists")
    }

    return res.status(200).json(
        new Api_Response(200,channel[0],"user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandlers(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from : "users",
                            localField:"videoOwner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avtar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            videoOwner:{
                                $first: "$videoOwner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new Api_Response(200,user[0].watchHistory,"watch history fetched successfully")
    )
})

export {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChennelProfile,
    getWatchHistory
}