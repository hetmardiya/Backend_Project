import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const DB_Connection = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`mongoose connected successfully !! DB_HOST ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log(`error from connection.js file${error}`);
    }
}

export default DB_Connection