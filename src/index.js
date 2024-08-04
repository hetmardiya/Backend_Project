import 'dotenv/config'
import { app } from './app.js'
import DB_Connection from "./db/connection.js"
let port = process.env.PORT || 4000

DB_Connection()
.then(()=>{
    app.listen(port , ()=>{
        console.log(`app is listing to port no ${port}`);
        
    })
})
.catch((err)=>{
    console.log(`error from index.js file in DB_Connection method ${err}`);
    
})