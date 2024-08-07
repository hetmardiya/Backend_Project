import { type } from 'express/lib/response';
import { mongoose , Schema } from 'mongoose';
import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt'
let UserSchema = new Schema(
    {
        username:{
            type : String,
            required : true,
            unique : true,
            lowercase: true,
            trim : true,
            index: true
        },
        email:{
            type : String,
            required : true,
            unique : true,
            lowercase: true,
            trim : true,
        },
        fullname:{
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avtar : {
            type:String,        //using cloudinary URL
            required:true
        },
        coverImage : {
            type :String        //using cloudinary URL
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password:{
            type : String,
            required : [true , "Password Is Required."]
        },
        refreshToken:{
            type : String
        }
    },
    {
        timestamps:true
    }
)

UserSchema.pre("save", function (next) { 
    if(!this.isModified("password")) next()
    
    this.password = bcrypt.hash(this.password , 10)
    next()
 })

UserSchema.methods.passwordCurrection = async function(password) {
    return await bcrypt.compare(password , this.password)
}

UserSchema.methods.genrateAccessToken = function(){
    return jsonwebtoken.sign(
        {
            _id : this._id,
            username : this.username,
            email : this.email,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.genrateRefreshToken = function(){
    return jsonwebtoken.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",UserSchema)