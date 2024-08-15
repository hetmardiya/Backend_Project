import express from "express";
const app = express()
import cookieParser from "cookie-parser";
import cors from "cors"

// cors is for use the middlewares and other configuration
app.use(cors({
    origin : process.env.CORS_ORIGIN,               //THIS TWO LINES ARE NOT COMPALSORY BUT USED FOR CONFIG THE ORIGIN AND OTHER THINGS
    Credential : true
}))
                                                                 //THESE FOUR LINE ARE BASICALLY FOR CONFIGURE THE THINGS WHICH IS USE IN PROJECT
app.use(express.json({limit:"16kb"}))                            //comes input in json format so it is for that with 16kb limit
app.use(express.urlencoded({limit:"16kb" , extended:true}))        //comes input in url format so it is for that with 16kb limit
app.use(express.static("public"))                                //the static path of public folder when any thing you want to store in so
app.use(cookieParser())                                          //this is for configure cookie

// import routes
import router from './routes/user.routes.js';

// routes declaration
app.use("/api/v1/users" , router)


export { app }