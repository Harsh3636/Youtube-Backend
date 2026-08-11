import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import router from "../routes/user.routes.js";

const registerUser = asyncHandler((req, res)=> {
     res.status(200).json({ 
        message:"ok"
    })
})

export {registerUser}