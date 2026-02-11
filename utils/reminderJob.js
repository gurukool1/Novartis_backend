const cron = require('node-cron');
const { Op } = require('sequelize');
const  User  = require('../models/userModel');
const  UserCase  = require('../models/userCaseModel');
const Mailer = require('../services/mailers');  // Your email sending function
const { date } = require('joi');
 
// This cron job will run once every day for checking 15-day cases
cron.schedule('0 0 * * *', async () => { // Runs every day at midnight
  try {
    // Get current date
    const currentDate = new Date();
 
    // Calculate the date 15 days ago
    const date15DaysAgo = new Date(currentDate);
    date15DaysAgo.setDate(currentDate.getDate() - 15);
    // Find all cases where the assignedAt is 15 or more days ago and not yet submitted
    const casesToRemind = await UserCase.findAll({
      where: {
        assignedAt: {
          [Op.lte]: date15DaysAgo,  // Find cases assigned 15 or more days ago
        },
        status: {
          [Op.ne]: 'submitted',  // Exclude cases that have already been submitted
        },
      },
      include: [{
        model: User,  // Include User to get the email
        attributes: ['email'],  // Only retrieve the email field
      }],
    });
 
    console.log('Cases to remind:', casesToRemind);
 
    // Loop through the cases and send emails to the users
    for (const userCase of casesToRemind) {
      const userEmail = userCase.User.email;
      console.log('Sending reminder to:', userEmail);
 
      try {
        // Send the reminder email for each user
        await Mailer.sendReminderEmail(userEmail);  // Assuming Mailer.sendReminderEmail is a promise
        console.log(`Reminder email sent to: ${userEmail}`);
      } catch (emailError) {
        console.error(`Error sending email to ${userEmail}:`, emailError.message);
      }
    }
 
    console.log('Reminder emails sent successfully!');
  } catch (error) {
    console.error('Error in sending reminder emails:', error);
  }
});

 
 