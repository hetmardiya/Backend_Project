import {asyncHandlers} from '../utils/asyncHandlers'

const registerUser = asyncHandlers(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

export default registerUser