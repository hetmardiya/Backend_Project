import { ApiError } from "../utils/API_Errors.js";
import { asyncHandlers } from "../utils/asyncHandlers.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

export const verifyJWY = asyncHandlers(async (req , res , next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if (!token) {
            throw new ApiError(401 , "Unathorized error")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401 , "envalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid access token")
    }
})