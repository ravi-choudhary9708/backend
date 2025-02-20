import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js"

const registerUser= asyncHandler(async (req,res)=>{

    //get user detail from froentend - req.body
    //validation- not empty
    //check if user already exists: username,email
    //check for images and avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token from res
    //check for user creation
    //return res

   const {fullName, email, username, password}= req.body;
   console.log('email',email);

   if (
    [fullName,username,email,password].some((feild)=>
    feild?.trim() === "")
   ) {
    throw new apiError(400,"All feilds are required");
    
   }

  const existedUser= await User.findOne({
    $or: [{username},{email}]
   })

   if(existedUser){
    throw new apiError(409,"user with email or username already exists")
   }

   const  avatarLocalPath=req.files?.avatar[0]?.path; 
   const  coverImageLocalPath=req.files?.coverImage[0]?.path; 

   if (!avatarLocalPath) {
    throw new apiError(400,"avatar is required");
   }

 const avatar= await uploadOnCloudinary(avatarLocalPath);
 const coverImage= await uploadOnCloudinary(coverImageLocalPath);

 if (!avatar) {
  throw new apiError(400,"avatar is required");
 }

 const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url|| "",
  username:username.toLowerCase(),
  password,
  email
 })

 const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
 )
if(!createdUser){
  throw new apiError(500,"something went wrong while registering a user")
}

return res.status(201).json(
  new apiResponse(200,createdUser,"user register succesfully")
)

   console.log("req body",req.body)
console.log("req file",req.files)

})

export {registerUser}