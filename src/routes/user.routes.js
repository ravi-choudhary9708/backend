
import {changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserCoverImage, updateUserAvatar,getUserWatchHistory} from "../controllers/user.controller.js"
import { Router } from "express";
import {upload} from "../middilewares/multer.middileware.js"
import { verifyJWT } from "../middilewares/auth.middileware.js";


const router = Router();

// Debug: Route define karne se pehle

router.route("/register")
  .get((req, res) => {
    console.log("DEBUG: GET /register hit");
    res.status(200).json({ message: "GET route working" });
  })
  .post(
    upload.fields([
{
  name:"avatar",
  maxCount:1
},
{
  name:"coverImage",
  maxCount:1
}
    ]),

    registerUser
  )


  

   router.route("/login").post(loginUser);

  //secured routes

  router.route("/logout").post(verifyJWT,logoutUser);
  router.route("/refresh-token").post(refreshAccessToken)
  router.route("/change-password").post(verifyJWT,changeCurrentUserPassword)
  router.route("/current-user").get(verifyJWT,getCurrentUser)
  router.route("/update-account").patch(verifyJWT,updateAccountDetails)
  router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
  router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
  router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
  router.route("/history").get(verifyJWT,getUserWatchHistory)

  
export default router;
