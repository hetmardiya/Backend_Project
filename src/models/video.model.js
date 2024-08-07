import { type } from "express/lib/response";
import { mongoose , Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
let VideoSchema =new Schema(
    {
        videoFile : {
            type : String,        //using cloudinary URL
            required : true
        },
        thumbnail : {
            type : String,        //using cloudinary URL
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number,       //using cloudinary URL
            required : true
        },
        views : {
            type : Number,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        videoOwner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)
VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , VideoSchema)