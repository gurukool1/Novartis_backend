const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Token = require("../models/tokensModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Mailer = require("../services/mailers")
const env = require("dotenv");
const { json } = require("sequelize");
const { log } = require("console");
const { stat } = require("fs");
const e = require("express");  
const { sequelize } = require("../config/database");
env.config();
                   
const register = async (req, res) => {
  const {investigatorName, username, password, confirmPassword, email, siteNo, role, isActive ,country,company_name,study_name} =
    req.body;
 console.log("country",country);
 
  if (!investigatorName || !username || !email || !password || !confirmPassword  || !country || !company_name || !study_name)  {
    return res.status(200).json({
        status: false,
        message: "All fields are required.",
        
         });
  }
  if (password !== confirmPassword) {
     return res.status(200).json({
        status: false,
        message: "Passwords do not match.",
         });
  }
 

  try {
     const existingUser = await User.findOne({ where: { email: email } });
  if (existingUser) {
    return res.status(200).json({
        status: false,
        message: "Email is already used.",
         });
  }
   
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(req.body,"hello")
    const newUser = await User.create({
      investigatorName: investigatorName,
      siteNo: siteNo,
      username: username,
      company_name: company_name,
      study_name: study_name,
      email: email,
      password: hashedPassword,
      country: country,
      role: role || "user",
      isActive: isActive !== undefined ? isActive : 1,
    });
    // if(newUser){ 
    //   await Mailer.sendVerificationEmail(email);
    // }
    // else{
    //   return res.status(200).json({ 
    //     status: false,
    //     message: "Failed to send verification email",
    //      });
    // }
    delete newUser.dataValues.password; // Remove password from user object before sending response
    return res.status(201).json({ 
        status: true,
        message: "User registered successfully",
         user: newUser });
  } catch (error) {
    console.error("Error in user registration: ", error);
   return res.status(200).json({ 
    status: false,
    message: "Something went wrong",
    error: error.message });
  }
};  

const selectCountry = async (req, res) => { 
  try{
     const [countries, metadata] = await sequelize.query('SELECT * FROM countries');
    return res.status(200).json({ 
        status: true,
        message: "Country list fetched successfully",
         data: countries });
      }  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message
    });
  }
};

 const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(200).json({
        status: false,
        message: "Email and password are required.",
         });
  }
  try {
    const user = await User.findOne({ where: { email: email } });
   // console.log("User id:", user.id);

    if (!user || user.isDeleted === 1) {
       return res.status(200).json({
        status: false,
        message: "User not found.",
         });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       return res.status(200).json({
        status: false,
        message: "Invalid password.",
         });  
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );
 
  //   const tokenData = await Token.findOne({ where: { userId: user.id } });
  //   if (tokenData) {
  //     tokenData.jwt_token = token;
  //     await tokenData.save();
  //   }else{
  //   const saveTokenData  = await Token.create({ userId: user.id, jwt_token: token });  // save token to token table
  //   if(!saveTokenData){
  //     return res.status(200).json({
  //       status: false,
  //       message: "Login failed. token not saved",
  //        });
  //   }
  // }
   delete user.dataValues.password; // Remove password from user object before sending response
    return res.status(200).json({
        status: true,
        data:{
           message: "Login successful",
            user: user,
            token: token 
        },
       });
  } catch (error) {
    console.error("Error in user login: ", error);
    res.status(200).json({
        status: false,
        message: "Something went wrong",
        error: error.message,
        });
  }
};





const masterLogin = async (req, res) => {
    // Get request body
    const { email, password, useremail } = req.body;

    if (!email || !password || !useremail) {
     return res.status(200).json({
        status: false,
        message: "Missinig fields are required.",
         })
    }


    try {

      const masterUser = await User.findOne({ where: { email: email } });

      if (!masterUser || masterUser.isDeleted === 1) {
         return res.status(200).json({
          status: false,
          message: "Master User not found.",
           });
      }

      const isMatch = await bcrypt.compare(password, masterUser.password);

      if (!isMatch) {
         return res.status(200).json({
          status: false,
          message: "Invalid password.",
           });
      }

      const user = await User.findOne({ where: { email: useremail } });

      if (!user || user.isDeleted === 1) {
         return res.status(200).json({
          status: false,
          message: "User not found.",
           });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "15d" }  
      )
      delete user.dataValues.password; // Remove password from user object before sending response
      return res.status(200).json({
          status: true,
          data:{
             message: "Master Login successful",
              user: user,
              token: token 
          },
         });
    } catch (error) {
      console.error("Error in master login: ", error);
      res.status(200).json({
          status: false,
          message: "Something went wrong",
          error: error.message,
          });
    }

  }

    
   

    




const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "User ID is required.",
         });
    } 
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
         });    
    }

    const tokenData = await Token.findOne({ where: { userId: userId } }); //check for token in databse and delete it 
    if (!tokenData) {
      return res.status(200).json({
        status: false,
        message: "Token not found for the user.",
         });    
    }
    await tokenData.destroy();    
    return res.status(200).json({
        status: true,
        message: "Logout successful.",
         });
  } catch (error) {
    console.error("Error in user logout: ", error);
    return res.status(200).json({
        status: false,
        message: "An error occurred during logout",
        error: error.message
         });
  }
}
const profile = async (req, res) => {
  try {
    const userId = req.user.id;
   // console.log("User ID from token:", userId);
    if (!userId) {
    return res.status(200).json({
        status: false,
        message: "User ID is required.",
         });
    }
    // Fetch user details from the database using the userId
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id","investigatorName", "username", "company_name", "study_name","email", "siteNo", "role", "isActive", "isDeleted", "country", "createdAt", "updatedAt"],
    });
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found ",
         });
    }
    // Return the user's profile data
    return res.status(200).json({
        status: true,
        data:{
              message: "User profile fetched successfully",
              user: user
        },
         });
  } catch (error) {
    console.error(error);
    return res.status(200).json({
        status: false,
        message: "An error occurred while fetching user profile",
         error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone } = req.body;
   // const phoneNumber = phone.parseInt(phone);
 if (phone.toString().length !== 10) {
      
    return res.status(200).json({
        status: false,
        message: "Phone number must be exactly 10 digits.",
         });
    }
    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "User ID is required.",
         });
    }
    
    const user = await User.findOne({ where: { id: userId } });
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
         });
    }
    user.username = username || user.username;
    user.phone = phone || user.phone;
    await user.save();
    return res.status(200).json({ 
        status: true,
        data:{
              message: "Profile updated successfully",
              user: user
        },
         });
  } catch (error) {
    console.error("Error in updating profile:", error);
    return res.status(200).json({
           status: false,
           message: "An error occurred while updating profile",
        error: error.message
       });
  }
}

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "User ID is required.",
         });
    }
  
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
         });
    }
    if (user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User account is already deleted.",
         });
    }
    user.isDeleted = 1;
    await user.save();
    // Instruct client to remove token
    return res.status(200).json({
        status: true,
        data:{
            message: "User account deleted successfully.",
            
        },
         });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(200).json({
        status: false,
        message: "An error occurred while deleting account",
         error: error.message });
  }
};

// const forgotPassword = async (req, res) => { 
//   const { email } = req.body;
//   //console.log("Forgot password request for email:", email);
  
//   if (!email) {
//     return res.status(200).json({
//         status: false,
//         message: "Email is required.",
//          });
//   }
//   try {
//     const user = await User.findOne({ where: { email: email } });
//     if (!user || user.isDeleted === 1) {
//      return res.status(200).json({
//         status: false,
//         message: "User not found.",
//          });
//     }
    
    
//     let updatedToken;
//     const randomNumber = Math.floor(Math.random()*(99999-999+1))+999;
//     const resetURL = crypto.createHash('md5').update(randomNumber.toString()).digest('hex');
//     const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

//     //check if token already exists in token table 
    
    
//     const resetTokenData = await User.findOne({ where: { id: user.id } });
//     if (resetTokenData) {
//       resetTokenData.reset_token = resetURL;
//       resetTokenData.reset_token_expiry = resetTokenExpiry;
//       updatedToken =  await resetTokenData.save();
//     } else {
//      updatedToken =  await User.create({ userId: user.id, reset_token: resetURL, reset_token_expiry: resetTokenExpiry });
//     }
//    const resetLink = `http://localhost:3000/reset-password?token=${resetURL}`;
//     if(updatedToken){
//         let message;
//         console.log("Reset token generated:", resetURL);
//      const emailResponse =  await  Mailer.sendPasswordResetMail(email,resetLink);
//      if(emailResponse && emailResponse.status){
//          message = 'If an account exists with the provided email, you will receive an email. Please follow the instructions to reset your password.';
//         console.log("Email sent successfully:", emailResponse);
//      }else{
//         message = 'Failed to send email. Please try again later.';
//         console.error("Failed to send email:", emailResponse);
//      }
//     }
//     else{
//         console.error("Failed to update user with reset token.");
//         return res.status(200).json({
//         status: false,
//         message: "Failed to update user with reset token.",
//          });
//     }
//     return res.status(200).json({
//         status: true,
//             data:{
//             message: "Password reset token sent successfully.",
//             user: user
//         },
//          });
    
//   } catch (error) {
//     console.error("Error in forgot password:", error);
//     return res.status(200).json({
//         status: false,
//         message: "An error occurred while processing forgot password request",
//          error: error.message });
//   }
// };
const forgotPassword = async (req, res) => { 
  const { email } = req.body;
  //console.log("Forgot password request for email:", email);
  
  if (!email) {
    return res.status(200).json({
      status: false,
      message: "Email is required.",
    });
  }

  try {
    const user = await User.findOne({ where: { email: email } });
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    let updatedToken;
    const randomNumber = Math.floor(Math.random() * (99999 - 999 + 1)) + 999;
    const resetURL = crypto.createHash('md5').update(randomNumber.toString()).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    // Check if token already exists in token table 
    const resetTokenData = await User.findOne({ where: { id: user.id } });
    if (resetTokenData) {
      resetTokenData.reset_token = resetURL;
      resetTokenData.reset_token_expiry = resetTokenExpiry;
      updatedToken = await resetTokenData.save();
    } else {
      updatedToken = await User.create({ userId: user.id, reset_token: resetURL, reset_token_expiry: resetTokenExpiry });
    }

    const resetLink = `https://gurukooltraining.com/reset-password?token=${resetURL}`;
    if (updatedToken) {
      let message;
      console.log("Reset token generated:", resetURL);
      const emailResponse = await Mailer.sendPasswordResetMail(email, resetLink);

      if (emailResponse && emailResponse.status) {
        message = 'If an account exists with the provided email, you will receive an email. Please follow the instructions to reset your password.';
        console.log("Email sent successfully:", emailResponse);
      } else {
        message = 'Failed to send email. Please try again later.';
        console.error("Failed to send email:", emailResponse);
      }
      
      // Returning response here after handling email
      return res.status(200).json({
        status: true,
        data: {
          message: message,
          user: user
        },
      });
    } else {
      console.error("Failed to update user with reset token.");
      return res.status(200).json({
        status: false,
        message: "Failed to update user with reset token.",
      });
    }

  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(200).json({
      status: false,
      message: "An error occurred while processing forgot password request",
      error: error.message,
    });
  }
};

const resetPassword = async(req, res)=>{
    const jsonParams = req.body;
    const response = {status: false, message: 'Invalid request'};
   if(jsonParams && jsonParams.password && jsonParams.confirmPassword && jsonParams.password_token){
       const { password, confirmPassword, password_token } = jsonParams;
       if(password === confirmPassword){
        try {
            const user = await User.findOne({ where: { reset_token: password_token } });
            if(user){
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
                user.reset_token = null; // Clear the reset token
                user.reset_token_expiry = null; // Clear the expiry
               const newPassword = await user.save();
               if(newPassword){
                response.status = true;
                response.message = 'Password reset successfully.';
               }else{
                response.message = 'Failed to reset password. Please try again later.';
               }
            }else{
                response.message = 'Invalid reset token.';
            }
        } catch (error) {
            console.error("Error in resetting password:", error);
            return res.status(200).json({ error: 'Something went wrong, please try again later.' });
            
        }
       }else{
        response.message = 'Passwords do not match.';
       }
   } else{
       response.message = 'Invalid request parameters.';
   }
   return res.status(200).json(response);
}

module.exports = { register,selectCountry, login, masterLogin, logout, profile,updateProfile,deleteAccount, forgotPassword ,resetPassword};
