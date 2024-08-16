import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDIRY_CLOUD_NAME, 
    api_key: process.env.CLOUDIRY_API_KEY, 
    api_secret: process.env.CLOUDIRY_API_SECRET
});

let uploadCloudinary = async (filePath)=>{
    try {
        if(!filePath) return null

        let response = await cloudinary.uploader.upload(filePath , {
            resource_type : 'auto'
        })
        console.log(`file uploded on cloudinary` , response.url);
        fs.unlinkSync(filePath)
        return response
        
    } catch (error) {
        fs.unlinkSync(filePath)          //remove the locally saved temporary file as a upload opration goes failed
        return null
    }
}

export {uploadCloudinary}