
import {registerUser} from "../controllers/user.controller.js"
import { Router } from "express";
import {upload} from "../middilewares/multer.middileware.js"


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


export default router;
