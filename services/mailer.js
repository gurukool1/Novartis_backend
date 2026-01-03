const path = require('path');
const ejs = require('ejs');
const axios = require('axios');
const nodemailer = require('nodemailer');

const sendPasswordResetMail = async (email, url) => {
  const subject = 'Reset Password | Your App Name';

  // Explicitly set the correct absolute path for the forgetPassword.ejs template
  const emailBody = await ejs.renderFile(path.join(__dirname, '..', 'Views', 'emails', 'forgetPassword.ejs'), { link: url });

  const sendData = {
      email: email,
      subject: subject,
      body: emailBody,
      app: process.env.APP_SLUG,  // Assuming it's in your environment variables
  };
//  console.log('sendData', sendData , process.env.SMTP_RESOURCES_API_URL, process.env.MEDIA_API_TOKEN , process.env.APP_SLUG);

  try {
      const response = await axios.post(process.env.SMTP_RESOURCES_API_URL, sendData, {
          headers: {
              'Authorization': `Bearer ${process.env.MEDIA_API_TOKEN}`,
          }
      });
// console.log('response', response.data);
      return response.data;
  } catch (error) {
      console.error('Error sending email via API:', error);
     return res.status(200).json({
      status: false,
      message: "Error in sending mail",
      error: error.message,
    });
  }
};



const sendMail = async (email, mailsubject, email_Body)  => {
    // const subject = 'Reset Password | Your App Name';
  
    // Explicitly set the correct absolute path for the forgetPassword.ejs template
    
  
    const sendData = {
        email: email,
        subject: mailsubject,
        body: email_Body,
        app: process.env.APP_SLUG,  // Assuming it's in your environment variables
    };
//   console.log('sendData48', sendData , process.env.SMTP_RESOURCES_API_URL, process.env.MEDIA_API_TOKEN , process.env.APP_SLUG);
    try {
        const response = await axios.post(process.env.SMTP_RESOURCES_API_URL, sendData, {
            headers: {
                'Authorization': `Bearer ${process.env.MEDIA_API_TOKEN}`,
            }
        });
  
        // console.log('response', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending email via API:', error);
        return { status: false, message: 'Error sending email' };
    }
  };

 const sendReminderEmail = async(email) => {
   const subject = 'Case Submission Reminder | Your App Name';
   const email_Body = await ejs.renderFile(path.join(__dirname, '..', 'Views', 'emails', 'reminderMessage.ejs'), {});
   const sendData = {
       email: email,
       subject: subject,
       body: email_Body,
       app: process.env.APP_SLUG,  // Assuming it's in your environment variables
   };
   try {
       const response = await axios.post(process.env.SMTP_RESOURCES_API_URL, sendData, {
           headers: {
               'Authorization': `Bearer ${process.env.MEDIA_API_TOKEN}`,
           }
       });
       return response.data;
   } catch (error) {
       console.error('Error sending email via API:', error);
       return res.status(200).json({
      status: false,
      message: "Error in sending mail",
      error: error.message,
    });
   }
 } 




// SMTP Configuration
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'novartistraining@gurukoolhub.com',
    pass: 'yolaakeaeelbtbdd'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

const sendMailsmtp = async (fromEmail, subject, htmlContent, fromName = '') => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return { 
        status: false, 
        message: 'Invalid email format' 
      };
    }

    // Configure email options
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: 'support@viblo.ai',
      subject: subject,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    if (info.messageId) {
      return {
        status: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      };
    } else {
      throw new Error('Failed to send email');
    }

  } catch (error) {
    console.error('Mail error:', error);
    return {
      status: false,
      message: `Email not sent: ${error.message}`
    };
  }
};


module.exports = { sendPasswordResetMail,sendMail ,sendReminderEmail, sendMailsmtp };
