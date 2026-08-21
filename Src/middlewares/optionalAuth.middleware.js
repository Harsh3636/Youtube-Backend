import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Same idea as verifyJWT, but never throws — if there's no/invalid token,
// req.user just stays undefined and the request continues.
// Use this on routes that should work for guests too (e.g. watching a video),
// but still want to know who's logged in when someone is.
export const verifyJWTOptional = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) return next();

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (user) req.user = user;
        next();
    } catch (error) {
        next();
    }
};
