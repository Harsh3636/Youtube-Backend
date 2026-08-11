import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import router from "../routes/user.routes.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler((req, res)=> {
    //for register a user we have to take information of user from frontend.
    //validation for checking all are complete requiremnent.=> not empty.
    //check if user already exits. by matching: username, email. or by any one of them.
    //check for images, check for avatar
    //upload them to cloudinary, avatar.
    //create user object - create entry in db.
    //remove password and refresh token field from response.
    // check for usercreation.
    //return response.

    // step 1- user detail kese leni h.

    const {fullname, email, username, password } = req.body
   console.log("email: ", email);

   if (fullname === "") {
    throw new ApiError(400, "fullname is required")
    
   }
    if (email === ""){
        throw new ApiError(400, "emal is required")
    }   
    if (username === "") {
        throw new ApiError(400, "username is required")
    }
    if (password === "") {
        throw new ApiError(400, "password is required")
    }

    //step-2 => check that whether the user is exist or not.
    const existedUser =    User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this email or username is already exists. ")
    }
       //step 3 => taking images or avatar in database.
       const avatarLocalPath = req.files?.avatar[0]?.path;
       const coverImageLocalPath =  req.files?.coverImage[0]?.path;
             
       if (!avatarLocalPath) {
         throw new ApiError(400, "Avatar file is required")
       } 
     
       //step 4 => now upload on cloudinary.
      const avatar = await  uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath)
      
      //step 5 => check that avatar is successfully uploaded or not.
      if(!avatar) {
        throw new ApiError(400, "Avatar file is required") 
      }

     const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
         email,
         password,
         username: username.toLowercase()
         
      })
        //step 6 => checking that user is already exist or not.

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
      )

      if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring a user. ")
        
      }
      return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully.")
      )
 

})

export {registerUser}