import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens= async (userId)=>{
 try {
  const user =await User.findById(userId)

  
  const accessToken= user.generateAccessToken()
  

  
  const refreshToken =user.generateRefreshToken()
    
 
  user.refreshToken=refreshToken;

  //validation kuchh mat lgao sidha lakr save kr do enail password kuchh nhi chahiye
  await user.save({validateBeforeSave:false});
 
  return {refreshToken, accessToken}
 } catch (error) {
  throw new apiError(500,"something goes wrong while generating access and refresh tokens")
 }
}

const registerUser= asyncHandler(async (req,res)=>{

    //get user detail from froentend (matlab postman se data le sakte hai) - req.body 
    //validation- not empty
    //check if user already exists: username,email
    //check for images and avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token from res
    //check for user creation
    //return res



    //details from froentend
   const {fullName, email, username, password}= req.body;
   


   //validation
   if (
    [fullName,username,email,password].some((feild)=>
    feild?.trim() === "")
   ) {
    throw new apiError(400,"All feilds are required");
    
   }


   //check if user exist
  const existedUser= await User.findOne({
    $or: [{username},{email}]
   })

   if(existedUser){
    throw new apiError(409,"user with email or username already exists")
   }

   const  avatarLocalPath=req.files?.avatar[0]?.path; 
  //  const  coverImageLocalPath=req.files?.coverImage[0]?.path; 
   
   
   let coverImageLocalPath;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
  coverImageLocalPath=req.files?.coverImage[0]?.path;
}

   if (!avatarLocalPath) {
    throw new apiError(400,"avatar is required");
   }
  


   //upload on cloudinary
 const avatar= await uploadOnCloudinary(avatarLocalPath);
 const coverImage= await uploadOnCloudinary(coverImageLocalPath);

 if (!avatar) {
  throw new apiError(400,"avatar is required");
 }



 //create db object
 const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url||"",
  username:username,
  password,
  email
 })

 //refresh token aur password hat jayega
 const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
 )
if(!createdUser){
  throw new apiError(500,"something went wrong while registering a user")
}


//return res
return res.status(201).json(
  new apiResponse(200,createdUser,"user register succesfully")
)

  

})

const loginUser = asyncHandler(async (req,res)=>{

  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send coockies

  const {email,username,password}= req.body;
  
  
  if (!(username || email)) {
    throw new apiError(400,"username or email is required");
  }

  console.log('mail',email,email);
  
  const user = await User.findOne({
    $or: [{username},{email}]
  })

  console.log('user:',user);

  if (!user) {
    throw new apiError(400,"user does not exist");

  }

  const isPasswordValid=await user.isPasswordCorrect(password)
if (!isPasswordValid) {
  throw new apiError(401,"invalid password");
}
 const {refreshToken,accessToken}= await generateAccessAndRefreshTokens(user._id)
 console.log('accesstoken',accessToken);
 console.log('refreshToken',refreshToken);
const loggedInUser= await User.findById(user._id).select(" -password -refreshToken")

 
 const options={
  httpOnly: true,
  secure:true
 }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new apiResponse(200,{
      user:loggedInUser,accessToken,refreshToken
    },
  "user logged in successfully"
)
  )

})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      },
     
    },{
      new:true
    }

  )

  const options={
    httpOnly: true,
    secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new apiResponse(200,{},"user logged out"))
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken=  req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
      throw new apiError(401,"unauthorized request");
    }


    try {
          //verify token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )


  const user = await User.findById(decodedToken?._id);

  if(!user){
    throw new apiError(401,"invalid refresh token")
  }

  if(incomingRefreshToken!== user?.refreshToken){
    throw new apiError(401, "refresh token is expires or used")
  }

  const options={
    httpOnly:true,
    secure:true
  };

  const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id);

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newRefreshToken,options)
  .json(
    new apiResponse(
      201,{
        accessToken,refreshToken:newRefreshToken
      },
        "access token refreshed"
    )
  )
    } catch (error) {
      throw new apiError(401,error?.message || "invalid refresh token")
    }
})

const changeCurrentUserPassword= asyncHandler(async (req,res)=>{
  //take password
  //find user
  //compare password
  //save password
  //res 

  const {oldPassword,newPassword,confirmPassword}= req.body;

  if(!(newPassword===confirmPassword)){
      throw new apiError(401,"password doesn't match")
  }

      const user= await User.findById(req.user?._id);

        const correctPaawordUser =await user.isPasswordCorrect(oldPassword);

        if(!correctPaawordUser){
          throw new apiError(401,"old password is not correct")
        };

        user.password=newPassword;
       await user.save({validateBeforeSave:false});

       return res
       .status(201)
       .json(new apiResponse(200,
        {},
        "password change successfully"
      ))
})


const getCurrentUser= asyncHandler( async (req,res)=>{
  return res
  .status(200)
  .json(new apiResponse(200,
    req.user,
    "current user fetched"
  ))
})

const updateAccountDetails= asyncHandler( async (req, res)=>{
   const {fullName, email}= req.body;

   if(!fullName || !email){
    throw new apiError(401,"email and fullname are required")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email,
      },
      
    },
    {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new apiResponse(200,user,"account detailed updated"))
})

const updateUserAvatar= asyncHandler(async (req,res)=>{
         const avatarLocalPath= req.file?.path;
         if(!avatarLocalPath){
          throw new apiError(400,"avatar file is missing");
         }

         const avatar= await uploadOnCloudinary(avatarLocalPath);

         if(!avatar.url){
          throw new apiError(400,"error while uploading avatar");

         }

         const user=await User.findByIdAndUpdate(
          req.user?._id,
          {
            $set:{
              avatar:avatar.url
            }
          },
          {new:true}
         ).select("-password")

          return res
         .status(201)
         .json(new apiResponse(
          201,user,"updated succesfully avatar image"
         ))
})  


const updateUserCoverImage= asyncHandler(async (req,res)=>{
         const coverImageLocalPath= req.file?.path;
         if(!coverImageLocalPath){
          throw new apiError(400,"coverImage file is missing");
         }

         const coverImage= await uploadOnCloudinary(coverImageLocalPath);

         if(!coverImage.url){
          throw new apiError(400,"error while uploading coverImage");

         }

        const user= await User.findByIdAndUpdate(
          req.user?._id,
          {
            $set:{
              coverImage:coverImage.url
            }
          },
          {new:true}
         ).select("-password")

         return res
         .status(201)
         .json(new apiResponse(
          201,user,"updated succesfully cover image"
         ))
})     


const getUserChannelProfile= asyncHandler(async (req,res)=>{
     const {username}= req.params;

   
     

     if(!username?.trim()){
      throw new apiError(401,"username is missing");

     }

     //array return hoga
     const channel =await User.aggregate([
      {
        $match:{
          username:username?.toLowerCase()
        }

      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"
        },
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        },
      },{
        $addFields:{
          subscribersCount:{
            $size:"$subscribers"
          },
          channelSubscribedToCount:{
            $size:"$subscribedTo"
          },
          isSubscribed:{
            $cond:{
              if:{$in:[req.user?._id,"$subscribers.subscriber"]},
              then:true,
              else:false
            }
          }
        }
      },
      {
        $project:{
          fullName:1,
          username:1,
          subscribersCount:1,
          channelSubscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1
        }
      }
     ])

     console.log("ag channel:",channel);

     if(!channel?.length){
      throw new apiError(404,"channel doesn't exists")
     }

     return res
     .status(201)
     .json(
      new apiResponse(200,channel[0],"user channel fetched successfully")
     )
})


const getUserWatchHistory= asyncHandler(async (req,res)=>{
            const user= await User.aggregate([
            {
                      $match:{
                        _id:new mongoose.Types.ObjectId(req.user._id)
                      }
              },
              {
                $lookup:{
                  from:"videos",
                  localField:"watchHistory",
                  foreignField:"_id",
                  as:"userWatchHistory",
                  pipeline:[
                    {
                      $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                          {
                            $project:{
                              fullName:1,
                              username:1,
                              avatar:1
                            }
                          }
                        ]
                      }
                    },
                    {
                      $addFields:{
                        owner:{
                          $first:"$owner"
                        }
                      }
                    }
                  ]
                }
              }
            ])

            return res
            .status(200)
            .json(
              new apiResponse(201,
                user[0].userWatchHistory,
                "watch history success"
              )
            )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentUserPassword,
  updateUserAvatar,
  updateAccountDetails,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
}