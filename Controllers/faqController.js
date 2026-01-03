const Faq = require("../models/faqModel");
const User = require("../models/userModel");



const viewFaqs = async (req,res)=>{
    const userId = req.user.id;
    if(!userId){
        return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
    }
    try {
        const user = await User.findByPk(userId);
        if(!user || user.isDeleted === 1){
            return res.status(200).json({
                status: false,
                message: "User not found."
            });
        }
        const faqs = await Faq.findAll(
            {
                order: [["updatedAt", "DESC"]],
            }
        );
        return res.status(200).json({
            status: true,
            data: {
              message: "FAQs fetched successfully",
              faqs: faqs,
            },
          });
    } catch (error) {
        console.error("Error fetching FAQs:", error);
       return res.status(200).json({
       status: false,
       message: "Something went wrong",
       error: error.message,
    });
    }
}

const addFaq = async (req,res)=>{
    const userId = req.user.id;
   
    if(!userId){
        return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
    } 
    try {
        const user = await User.findByPk(userId);
        if(!user || user.isDeleted === 1){
            return res.status(200).json({
                status: false,
                message: "User not found."
            });
        }
        if(user.role !== 'admin'){
            return res.status(200).json({
                status: false,
                message: "Unauthorized! Only admins can add FAQs."
            });
        }
       
        
        const { question, answer } = req.body;
       
        
        if (!question || !answer) {
            return res.status(200).json({
                status: false,
                message: "Question and answer are required."
            });
        }

        const faq = await Faq.create({ question, answer, creattedBy: userId });
       return res.status(201).json({
      status: true,
      data: {
        message: "FAQs added successfully",
        faq:faq,
      },
    });
    } catch (error) {
        console.error("Error adding FAQ:", error);
       return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
    }
}


const editFaq = async (req,res)=>{
     const userId = req.user.id;
     const faqId = req.params.id;
    if(!userId){
        return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
    }
    if(!faqId){
        return res.status(200).json({
      status: false,
      message: "FAQ ID is required.",
    });
    }
    try {
        const user = await User.findByPk(userId);
        if(!user || user.isDeleted === 1){
            return res.status(200).json({
                status: false,
                message: "User not found."
            });
        }
        if(user.role !== 'admin'){
            return res.status(200).json({
                status: false,
                message: "Unauthorized! Only admins can add FAQs."
            });
        }
        const { question, answer } = req.body;
        if (!question || !answer) {
            return res.status(200).json({
                status: false,
                message: "Question and answer are required."
            });
        }
        const faq = await Faq.findByPk(faqId);
        if(!faq){
            return res.status(200).json({
                status: false,
                message: "FAQ not found."
            });
        }
        faq.question = question;
        faq.answer = answer;
        faq.creattedBy = userId;
        await faq.save();
        return res.status(200).json({
            status: true,
            data: {
              message: "FAQs updated successfully",
              faq:faq,
            },
          });
        

    } catch (error) {
        console.error("Error adding FAQ:", error);
       return res.status(200).json({
        status: false,
         message: "Something went wrong",
        error: error.message,
    });
    }

}

const deleteFaq = async (req, res)=>{
     const userId = req.user.id;
     const faqId = req.params.id;
    if(!userId){
        return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
    }
    if(!faqId){
        return res.status(200).json({
      status: false,
      message: "FAQ ID is required.",
    });
    }
    try {
        const user = await User.findByPk(userId);
        if(!user || user.isDeleted === 1){
            return res.status(200).json({
                status: false,
                message: "User not found."
            });
        }
        if(user.role !== 'admin'){
            return res.status(200).json({
                status: false,
                message: "Unauthorized! Only admins can delete FAQs."
            });
        }
        const faq = await Faq.findByPk(faqId);
        if(!faq){
            return res.status(200).json({
                status: false,
                message: "FAQ not found."
            });
        }
        await faq.destroy();
        return res.status(201).json({
      status: true,
      data: {
        message: "Deleted FAQs successfully",
      },
    });
    } catch (error) {
        console.error("Error deleting FAQ:", error);
       return res.status(200).json({
        status: false,
         message: "Something went wrong",
        error: error.message,
    });
    }

}



module.exports = {
    viewFaqs,
    addFaq,
    editFaq,
    deleteFaq
};