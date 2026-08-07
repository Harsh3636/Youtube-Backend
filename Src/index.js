// require('dotenv').config({path: './env'})
// is trike se dotenv ko use krna code ki syntax ke trike se dekha jaye to khrb kr rha hai to islie hum sidhe import bhi kra skte h use krne k lie dotenv.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";
//NOW WE LEARN SECOND METHOD OF STROING DATA OR CALL IT IN DATABASE.

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
    console.log("Errr: ", error);
    throw error;
})
    //agr server nhi mila to is port pe run hojyega project lkin crash nhi hoga.
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at port: ${process.env.PORT}`);
    })
})

.catch((error) => {
    console.log("MONGO db connection failed ", error);
})


  








//this is the first approach of storing data in database and call it here. it is the first method.

// import express from "express"
// const app = express()

// ( async () => {
//     try {
//         mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Database is not able to talk with server.", error);
//             throw error
//         })

//     app.listen(process.env.PORT, () => {
//         console.log(`App is listening on port ${process.env.PORT}`);
//     })

//     } catch (error) {
//         console.log("ERROR: ", error)
//         throw err 
        
//     }

// })()
