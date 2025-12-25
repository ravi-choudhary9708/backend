import dotenv from "dotenv"
import express from 'express';
import mongoose from "mongoose";
import { app } from "./app.js";  // Import the configured app

import connectdb from "./db/index.js";
dotenv.config({
  path:"./.env"
})


connectdb().then(()=>{
  app.listen(process.env.PORT , ()=>{
    console.log(`server is running at port : ${process.env.PORT}  `);
    
  })
}).catch((err)=>{
  console.log('mongodb connection fail',err);
  
})
/*
( async ()=>{
 try {
   await mongoose.connect(`${process.env.local.MONGODB_URI}/{DB_NAME}`)
 } catch (error) {
    console.log('error',error);
    
 }
})()
*/