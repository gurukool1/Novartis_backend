const jwt  = require("jsonwebtoken");
const env = require("dotenv");
const Token = require("../models/tokensModel")
env.config();


const verifyToken = async(req,res,next)=>{
   // const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    const token = req.headers['authorization']?.split(' ')[1];
    //console.log("Token from headers:", token);
    
    if(!token){
       return res.status(200).json({
      status: false,
      message: "Unauthorized! Token is required.",
    });
    }
    // const tokenData = await Token.findOne({ where: { jwt_token: token } }); //check for token in databse and delete it 
    // if (!tokenData) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Token not found. Please login again.",
    //      });    
    // }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    }catch(error){
        return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
    }   
}


module.exports = verifyToken;