import dotenv from "dotenv"

import mongoose from "mongoose";

import connectdb from "./db/index.js";
dotenv.config({
  path:"./env"
})

connectdb()
/*
( async ()=>{
 try {
   await mongoose.connect(`${process.env.local.MONGODB_URI}/{DB_NAME}`)
 } catch (error) {
    console.log('error',error);
    
 }
})()
*/