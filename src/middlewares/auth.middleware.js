import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt  from "jsonwebtoken"

const verifyJWT = asyncHandler(async(req, res, next) => {

try {
        // Extract token from cookie or Authorization header
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer", "") 
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        // Verify the access token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Find user based on the decoded user ID from the token
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Access Token Invalid")
        }
    
        // Attach the user to the request for further use in subsequent middleware/routes
        req.user = user
        next()

} catch (error) {
    throw new ApiError(402, error?.message || "Access Token Invalid")
}

})


export {verifyJWT}