import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnImageKit } from "../utils/imagekit.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) =>
{
    try {
        const user = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
      
     user.refreshToken = refreshToken
    await  user.save({validateBeforeSave: false }) 

       return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "something went wrong.")
    }
}


 
const registerUser = asyncHandler(async (req, res) => {
   
    //hum kya kya krenge step by step ya kya kya kra humne.
    // 1=> get user details from frontend.
    //2=> validation kra ki empty na ho - non empty.
    //3=> check if user already exists: username, email.
    //4=> check for images, check for avatar
    //5=> upload them to imagekit, avatar
    //6=> create user object - create entry in db
    //7=> remove password and refresh token field from reponse.
    //8=> check for user creation.
    //9=> return response to user.




    console.log("🔥🔥🔥 NEW PROJECT CONTROLLER HIT 🔥🔥🔥");
    const { fullname, email, username, password } = req.body;

    // ⭐ FIX: pehle wala check hamesha false tha (boolean ko string se compare kar raha tha)
    if ([fullname, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existedUser = await User.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // let coverImageLocalPath2;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //   coverImageLocalPath = req.files.coverImage[0].path        
    // } 



    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnImageKit(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(500, "Avatar upload failed");
    }

    let coverImage = null;

    // ⭐ FIX: uploadOnCloudinary import nahi tha, isliye coverImage bhejte hi crash ho jata tha.
    // Ab dono avatar aur coverImage ImageKit se hi upload honge.
    if (coverImageLocalPath) {
        coverImage = await uploadOnImageKit(coverImageLocalPath);
    }

    const user = await User.create({
        fullname: fullname.trim(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: normalizedEmail,
        password,
        username: normalizedUsername,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
   //Todo for login krane k lie.
   // req body se data bhi lana hai.
   // username or email   signup hui ya nhi. or yha pe hum ye krenge ki agr koi email se login kre ya username se dono se hojaye login. => same as Industry Level.
   //find the user.
   //password check verify that is correct or not.
   //acces and refresh tokenn generate and send to user.
   // now send cookies.
   // check krke token shi h fir login kra denge.

   const {email, username, password} = req.body
    console.log("LOGIN BODY:", req.body) 
if (!(username || email)) {
    throw new ApiError(400, "username or email is required")
}

const user = await User.findOne({
    $or: [
        { username: username?.toLowerCase().trim() },
        { email: email?.toLowerCase().trim() }
    ]
})
 console.log("USER FOUND:", user) 

if (!user) {
    throw new ApiError(404, "User does not exist.")
}
     
    const isPasswordValid = await user.isPasswordCorrect(password)

       if (!isPasswordValid) {
        throw new ApiError(401, "Password is not correct.")
        
    }
     
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //now we sent cookies.
    const options = {
        httpOnly: true,
        secure: true  
    }
      
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully."
        )

    )
    
})
 //now logout user.
  
  const logoutUser = asyncHandler(async(req, res) => {
    User.findByIdAndUpdate(
       req.user._id,
       {
        $set: {
            refreshToken: undefined
        }
       },
       {
        new:true 
       }
    )
    const options = {
        httpOnly: true,
        secure: true  
    }

    return res.status(200).clearCookie("accessToken", options)
    .clearCookie("refreshToken",  options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async(req, res) => {
  const incomingRefreshToken =   req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }
try {
    const decodedToken =   jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    
      )
       
      const user = await User.findById(decodedToken?._id)
        if (!user) {
        throw new ApiError(401, "Invalid Refresh Token")
      }
    
      if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
      }
    
      const options = {
        httpOnly: true,
        secure: true 
    
      }
    
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", refreshToken, options)
       .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
       )
    
    
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
    
}

})



export { registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken
     };
