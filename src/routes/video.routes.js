import { Router } from "express";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middilewares/multer.middileware.js";
import { verifyJWT } from "../middilewares/auth.middileware.js";

const router= Router();

router.route("/upload-video").post(
    verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishAVideo
)

router.route("/get-video").get(verifyJWT,getAllVideos)
export default router;