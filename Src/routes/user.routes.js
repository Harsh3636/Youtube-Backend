import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()
//middleware inject krani hoto ese hoti hai jo bhi method call ho rha hai just uske phle likh do.
router.route("/register").post(upload.fields([

    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
        name: "coverImage",
        maxCount: 1  
        }
    ]), 
]),

registerUser)


export default router 