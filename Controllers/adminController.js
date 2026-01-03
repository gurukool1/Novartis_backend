const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const upload = require("../Middleware/multer");
const express = require("express");
const Case = require("../models/caseModel");
const userCase = require("../models/userCaseModel");
const { UserCase, Form } = require("../models");
const fs = require("fs");
const pdfConverter = require("../utils/pdfConverter");
const router = express.Router();




 

const uploadCase = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can upload case.",
      });
    }

    const { title } = req.body;
    const titlePresent = await Case.findOne({ where: { title: title } });
    if (titlePresent) {
      return res.status(200).json({
        status: false,
        message: "Case with this title already exists.",
      });
    }

    const file = req.file;
    if (!title || !file) {
      return res.status(200).json({
        status: false,
        message: "Title and file are required.",
      });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const fileUrl = file.path ? baseUrl + '/' + file.path.replace(/\\/g, '/') : null;
    const filePath = file.path; // Local file path for conversion

    // Convert to PDF using helper
    let pdfUrl = null;
   
    try {
      const pdfData = await pdfConverter(filePath);
      pdfUrl = baseUrl+pdfData.relativePath;

    } catch (conversionErr) {
      console.error("[uploadCase] PDF conversion failed:", {
              message: conversionErr.message,
              stack: conversionErr.stack,
              name: conversionErr.name,
            });      // Don't fail the upload, but log the error
      console.warn("Proceeding without PDF conversion");
    }

   

    // Create case with both file URL and PDF URL
    const newCase = await Case.create({
      title: title,
      fileUrl: fileUrl,
      pdfUrl: pdfUrl,
      uploadedBy: userId,
    });

    return res.status(201).json({
      status: true,
      data: {
        message: "Case uploaded successfully",
        case: {
          ...newCase.dataValues,
          fileUrl,
          pdfUrl,
        },
      },
    });
  } catch (error) {
    console.error("Error in uploading case: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


const viewUsers = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view.",
      });
    }
   const totalUsers = await User.findAll({
  where: {   role: "user" },
  order: [["createdAt", "DESC"]],
});
    if (totalUsers === 0) {
      return res.status(200).json({
        status: false,
        message: "No users found.",
      });
    }
    return res.status(200).json({
      status: true,
      data: {
        message: "Total users fetched successfully",
        totalUsers: totalUsers,
      },
    });
  } catch (error) {
    console.error("Error in fetching total users: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};        

const viewCases = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view cases.",
      });
    }
    const totalCases = await Case.findAll({
      where: { isDeleted: 0 },
      order: [["createdAt", "DESC"]],  
    });  
    if (totalCases === 0) {
      return res.status(200).json({
        status: false,
        message: "No cases found.",
      });
    }
  
    //  const casesWithFileUrl = totalCases.map(c => ({
    //   ...c.dataValues,
      
    // }));
    return res.status(200).json({
      status: true,
      data: {
        message: "Total cases fetched successfully",
        totalCases: totalCases,
      },
    });
  } catch (error) {
    console.error("Error in fetching cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


const fetchAllCaseData = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view all cases.",
      });
    }

    // 1. Get all non-deleted cases
    const totalCases = await Case.findAll({
      where: { isDeleted: 0 },
    });
    const totalCaseIds = totalCases.map(c => c.id);

    // 2. Get all unique assigned case IDs
    const assignedCases = await UserCase.findAll({
      where: { isDeleted: 0 },
      attributes: ['caseId'],
      group: ['caseId'],
    });
    const assignedCaseIds = new Set(assignedCases.map(ac => ac.caseId));

    // 3. Find unassigned case IDs
    const unassignedCaseIds = totalCaseIds.filter(id => !assignedCaseIds.has(id));

    // 4. Get unassigned case details
    const unassignedCases = totalCases.filter(c => unassignedCaseIds.includes(c.id));

    // 5. Get assigned case details
    const assignedCasesDetails = totalCases.filter(c => assignedCaseIds.has(c.id));

    // 6. Prepare response
    // const baseUrl = req.protocol + '://' + req.get('host');
    // const formatCase = (c) => ({
    //   ...c.dataValues,
    //   fileUrl: c.file_path ? baseUrl + '/' + c.file_path.replace(/\\/g, '/') : null
    // });

    return res.status(200).json({
      status: true,
      data: {
        message: "Cases summary fetched successfully",
        totalCases: totalCases.length,
        assignedCasesCount: assignedCasesDetails.length,
        unassignedCasesCount: unassignedCases.length,
      },
    });
  } catch (error) {
    console.error("Error in showAll: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



const assignCase = async (req, res) => {
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const { userId, caseId, formType } = req.body;
    if(!userId || !caseId){
      return res.status(200).json({
        status: false,
        message: "User ID and Case ID are required.",
      });
    } 

    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({ 
        status: false,
        message: "Admin not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can assign cases.",
      });
    }
    if (userId === adminId) {
      return res.status(200).json({
        status: false,
        message: "Admin cannot assign a case to themselves.",
      });
    } 
  const alreadyAssignedCase = await userCase.findOne({
      where: {
        userId: userId,
        caseId: caseId,
        formType: formType
      },
    });
    if(alreadyAssignedCase && alreadyAssignedCase.isDeleted === 1){
      alreadyAssignedCase.isDeleted = 0;
      await alreadyAssignedCase.save();
      return res.status(200).json({
        status: true,
        message: "Case assigned successfully.",
      });
    }
    if (alreadyAssignedCase) {
      return res.status(200).json({
        status: false,
        message: "Case already assigned to the user.",
      });
    }
     const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if(user.role === "admin"){
      return res.status(200).json({
        status: false,        
        message: "Admin cannot be assigned a case.",
      });
    }
     const caseToAssign = await Case.findByPk(caseId);
    if (!caseToAssign) {
      return res.status(200).json({
        status: false,
        message: "Case not found",
      });
    }
     
    const assignedCase = await userCase.create({
      userId: userId,
      caseId: caseId,
      formType: formType,
      assignedAt: new Date(),
    });

    return res.status(201).json({
      status: true,
      data: {
        message: "Case assigned successfully",
        assignedCase: assignedCase,
      },
    });
    // Logic to assign case goes here
  } catch (error) {
    console.error("Error in assigning case: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



const assignCaseToMultipleUsers = async (req, res) => {
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const { userIds, caseId, formType } = req.body;
    if (!userIds && !caseId && !formType) {
      return res.status(200).json({
        status: false,
        message: "User IDs and Case ID and Form Type are required.",
      });
    }
   
    
    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "Admin not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can assign cases.",
      });
    }
    if (userIds.includes(adminId)) {
      return res.status(200).json({
        status: false,
        message: "Admin cannot assign a case to themselves.",
      });
    }
    const caseToAssign = await Case.findByPk(caseId);
    if (!caseToAssign) {
      return res.status(200).json({
        status: false,
        message: "Case not found",
      });
    }

    const assignedCases = [];
    const skippedUsers = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const user = await User.findByPk(userId);
        if (!user || user.isDeleted === 1) {
          skippedUsers.push({ userId, reason: "User not found or deleted" });
          continue;
        }
        if (user.role === "admin") {
          skippedUsers.push({ userId, reason: "Admin cannot be assigned a case" });
          continue;
        }
        const alreadyAssignedCase = await userCase.findOne({
          where: { userId: userId, caseId: caseId, isDeleted: 0, alreadyAssigned: 0 },
        });
        
        if (alreadyAssignedCase) {
          skippedUsers.push({ userId, reason: "Case already assigned" });
          continue;
        }   
        const assignedCase = await userCase.create({
          userId: userId,
          caseId: caseId,
          status: "begin",
          formType: formType,
          assignedAt: new Date(),
        });
        assignedCases.push({ userId, status: "Assigned" });
      } catch (err) {
        errors.push({ userId, error: err.message , details: err.errors ? err.errors[0]?.message : undefined});
      }
    }

    return res.status(201).json({
      status: true,
      data: {
        message: "Case assignment process completed",
        assignedCases,
        skippedUsers,
        errors,
      },
    });
  } catch (error) {
    console.error("Error in assigning case to multiple users: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



const unAssignCase = async (req, res) => {
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "admin ID is required.",
    });
  }
  const { userCaseId } = req.body;
  if (!userCaseId) {
    return res.status(200).json({
      status: false,
      message: "UserCase ID  is required.",
    });
  }
  try {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "Admin not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can unassign cases.",
      });
    }
    const assignedCase = await userCase.findOne({
      where: {
        id: userCaseId,
       isDeleted:0,
      },
    });
    if (!assignedCase) {
      return res.status(200).json({
        status: false,
        message: "Case is not assigned to the user.",
      });
    }
   // console.log("Assigned case found:", assignedCase);
    assignedCase.isDeleted = 1;
    assignedCase.status = "begin";
     // Mark as deleted instead of destroying
    await assignedCase.save();

    const form =  await Form.findOne({where: {
      userCaseId: userCaseId,
    }})
    if (form) {
      form.isDeleted = 1
      await form.save()
    }
    return res.status(200).json({
      status: true,
      data: {
        message: "Case unassigned successfully",
      },
    });
  } catch (error) {
    console.error("Error in unassigning case: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const assignedCases = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view assigned cases.",
      });
    }
    const assignedCases = await userCase.findAll({
      
      include: [
        { model: Case, attributes: ["id", "title","fileUrl"] },
        { model: User, attributes: [ "username", "email"] },
      ],
      order: [["assignedAt", "DESC"]],
    });
    //  console.log("Assigned cases:", assignedCases);
    //   const baseUrl = req.protocol + '://' + req.get('host');
    //  const casesWithFileUrl = totalCases.map(c => ({
    //   ...c.dataValues,
    //   fileUrl: baseUrl + '/' + c.file_path.replace(/\\/g, '/')
    // }));
    if (assignedCases.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No cases assigned to the user.",
      });
    }
    
    const response = assignedCases.map((assignment, index) => {
      return {
         caseId: assignment.Case.id,
        // userId: assignment.User.id,
        userName: assignment.User.username,
        userEmail: assignment.User.email,

        //caseId: assignment.Case.id,
        caseNumber: assignment.Case.title,
        assignedAt: assignment.assignedAt,
        status: assignment.status,
      };
    });
    return res.status(200).json({
      status: true,
      data: {
        message: "Assigned cases fetched successfully",
        response: response,
      },
    });
  } catch (error) {
    console.error("Error in fetching assigned cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const getAssignedUsersForCase = async (req, res) => {
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  } 
  try {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view assigned users for a case.",
      });    
    }
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(200).json({
        status: false,
        message: "Case ID is required.",
      });
    }
   
        const assignedUser = await UserCase.findAll({
          where: {
            caseId: caseId,
             isDeleted:0
          },
          include: [{ model: User, attributes: ["id", "username", "email"] }],
        });
    if (!assignedUser) {
      return res.status(200).json({
        status: false,
        message: "No users assigned to this case.",
      });
    }
  
  

    return res.status(200).json({
      status: true,
      data: {
        message: "Assigned users fetched successfully",
        response: assignedUser,
      },
    });
  } catch (error) {
    console.error("Error in fetching assigned users for a case: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const getTotalAssignedUsers = async(req,res)=>{
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view total assigned users.",
      });
    }
    const {caseId} = req.body;
    if(!caseId){
      return res.status(200).json({
        status: false,
        message: "Case ID is required.",
      });
    }
    const userCase = await UserCase.findAll({
      where: { caseId: caseId },
      include: [{ model: User, attributes: ["id", "username"] }],
    });
    
    return res.status(200).json({
      status: true,
      data: {
        message: "Total assigned users fetched successfully",
        response: userCase,
      },
    });
  } catch (error) {
    console.error("Error in fetching total assigned users: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}
   
   
const submittedCases = async(req,res)=>{
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view submitted cases.",
      });
    }  
    // Logic to submit cases goes here
    const submittedCases = await userCase.findAll({
      where: { alreadyAssigned : 1 },
      include: [
        { model: Case, attributes: ["id", "title", "fileUrl","pdfUrl"] },
        { model: User, attributes: ["id", "username"] },
      ],
      order: [["updatedAt", "DESC"]],
    });
    


     const casesWithFileUrlAndFormId = await Promise.all(submittedCases.map(async (c) => {
    // Get formId for each case based on caseId and userId
    const form = await Form.findOne({ where: { caseId: c.Case.id, userId: c.User.id } });

    return {
      ...c.dataValues,
          formId: form ? form.id : null,
      
    };
  }));


    return res.status(200).json({
      status: true,
      data: {
        message: "Submitted cases fetched successfully",
        submittedCases: casesWithFileUrlAndFormId,
       
      },
    });

  } catch (error) {
    console.error("Error in submitting cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}


const filterByCaseId = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view filtered by case ID.",
      });
    }
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(200).json({
        status: false,
        message: "Case ID is required.",
      });
    }
    const userCase = await UserCase.findAll({
      where: { caseId: caseId },
      include: [{ model: User, attributes: ["id", "username", "email", "country",  "siteNo"] }],
    });
    return res.status(200).json({
      status: true,
      data: {
        message: "Filtered by case ID",
        response: userCase,
      },
    });
  } catch (error) {
    console.error("Error in filtering by case ID: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}




const isActive = async (req,res)=>{
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "admin ID is required.",
     });
  }
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(adminId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "You are not admin.",
      });    
    }
    const userToUpdate = await User.findByPk(userId);
    if (!userToUpdate) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if(userToUpdate.role === "admin"){
      return res.status(200).json({
        status: false,
        message: "Admin cannot be deactivated.",
      });
    }
    userToUpdate.isActive = userToUpdate.isActive === 1 ? 0 : 1;
    await userToUpdate.save();
    return res.status(200).json({
      status: true,
      data: {
        message: `User ${userToUpdate.isActive ? "activated" : "deactivated"} successfully`,
      },
    });
  } catch (error) {
    console.error("Error in submitting cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}
const deleteAccount = async (req, res) => {
 
    const adminId = req.user.id;
    if (!adminId) {
      return res.status(200).json({
        status: false,
        message: "admin ID is required.",
         });
    }
    const { userId } = req.body;
    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "User ID is required.",
         });
    }
   try {
    const admin = await User.findOne({ where: { id: adminId } });
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "admin not found.",
         });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "admin can only delete user accounts.",
         });
    }
    const user = await User.findOne({ where: { id: userId } });
    if (!user || user.isDeleted === 1) {  
      return res.status(200).json({
        status: false,
        message: "User not found.",
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
        message: "Something went wrong",
         error: error.message });
  }
};


const deleteCase = async(req,res)=>{
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "admin ID is required.",
    });
  }
  const { caseId } = req.body;
  if (!caseId) {
    return res.status(200).json({
      status: false,
      message: "Case ID is required.",
    });
  }
  try {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "Admin not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can delete cases.",
      });
    }
    const caseToDelete = await Case.findByPk(caseId);
    if (!caseToDelete) {
      return res.status(200).json({
        status: false,
        message: "Case not found",
      });
    }
    caseToDelete.isDeleted = 1;
    await caseToDelete.save();
    const assignedCase = await userCase.findOne({ where: { caseId: caseId } }); 
    if (assignedCase) {
      assignedCase.isDeleted = 1;
      await assignedCase.save();
    }
    return res.status(200).json({
      status: true,
      data: {
        message: "Case deleted successfully",
      },
    });
  } catch (error) {
    console.error("Error in deleting case: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const deleteUser = async(req,res)=>{
  const adminId = req.user.id;
  if (!adminId) {
    return res.status(200).json({
      status: false,
      message: "admin ID is required.",
    });
  } 
  const { userId } = req.body;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "Admin not found",
      });
    }
    if (admin.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can delete users.",
      });
    }
    const userToDelete = await User.destroy({ where: { id: userId } });
    if (!userToDelete) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: true,
      data: {
        message: "User deleted successfully",
      },
    });
  } catch (error) {
    console.error("Error in deleting user: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const adminDashBoard = async(req,res)=>{
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",        
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view dashboard.",
      });
    }
    // // Logic to get dashboard data goes here
    // const dashboardData = await userCase.findAll({
    //   //where: { status: "submitted" },
    //   include: [
    //     { model: Case, attributes: ["id", "title"] },
    //     { model: User, attributes: ["id", "username", "email","country"] },
    //     // { model: Form, attributes: ["id", "status","percentage"] },
        
    //   ],
    //   order: [["assignedAt", "DESC"]],
    // });
     // Get all users
    const allUsers = await User.findAll({
      where: { 
        role: "user",
        isDeleted: 0
      },
      attributes: ['id', 'username', 'email','investigatorName', 'country','company_name','study_name']
    });

      const userDetails = await Promise.all(allUsers.map(async (user) => {
      const assignments = await userCase.findAll({
        where: { 
          userId: user.id,
          isDeleted: 0
        },
        include: [
          { 
            model: Case, 
            attributes: ["id", "title"] 
          }
        ],
        attributes: ['formType','assignedAt', 'status', 'percentage', 'updatedAt']
      });
  
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          country: user.country,
          investigatorName:user.investigatorName,
          company_name:user.company_name,
          study_name:user.study_name,
          
        },
        caseAssignments: assignments.map(assignment => ({
          case: assignment.Case,
          assignedAt: assignment.assignedAt,
          status: assignment.status,
          percentage: assignment.percentage,
          formType: assignment.formType,
          completedAt: assignment.status === 'submitted' ? assignment.updatedAt : null
        }))
      };
    }));
    
    return res.status(200).json({
      status: true,
      data: {
        message: "Dashboard data fetched successfully",
         dashboardData: userDetails
      },
    });
  } catch (error) {
    console.error("Error in getting dashboard data: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

// const editUserDetails = async(req,res)=>{
//   const adminId = req.user.id;
//   if (!adminId) {
//     return res.status(200).json({
//       status: false,
//       message: "User ID is required.",
//     });
//   }
//   try {
//     const admin = await User.findByPk(adminId);
//     if (!admin || admin.isDeleted === 1) {
//       return res.status(200).json({
//         status: false,
//         message: "User not found",
//       });
//     }
//     if (admin.role !== "admin") {
//       return res.status(200).json({
//         status: false,
//         message: "Only admin can change password.",
//       });
//     }
//     const {userId,investigatorName,username, newPassword, confirmPassword } = req.body;
//     if (!userId || !investigatorName || !username || !newPassword || !confirmPassword) {
//       return res.status(200).json({
//         status: false,
//         message: "userId, InvestigatorName, username, New password and confirm password are required.",
//       });
//     }
//     if (newPassword !== confirmPassword) {
//       return res.status(200).json({
//         status: false,
//         message: "New password and confirm password do not match.",
//       });
//     }
//     const user = await User.findByPk(userId);
//     if (!user || user.isDeleted === 1) {
//       return res.status(200).json({
//         status: false,
//         message: "User not found",
//       });
//     }
//     const hashedPassword = await bcrypt.hash(newPassword, 10);  
//     const updatedProfile = await user.update({
//       investigatorName:investigatorName || user.investigatorName,
//       username:username || user.username,
//       password:hashedPassword || user.password
//     });
//     return res.status(200).json({
//       status: true,
//       data: {
//         message: "Profile changed successfully",
//         updatedProfile: updatedProfile
//       },
//     });
//   } catch (error) {
//     console.error("Error in changing password: ", error);
//     return res.status(200).json({
//       status: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// }
const filterbyCompany = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role !== "admin") {
      return res.status(200).json({
        status: false,
        message: "Only admin can view.",
      });
    }
    const {company_name} = req.body
    if (!company_name) {
      return res.status(200).json({
        status:false,
        message: "company name is required"
      })
    }
    const filteredUsers = await User.findAll({
      where: { isDeleted: 0 , role: "user" , company_name: company_name},
      order: [["createdAt", "DESC"]],
    });
    if (filteredUsers.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No users found.",
      });
    }
    return res.status(200).json({
      status: true,
      data: {
        message: "Users filtered successfully",
        filteredUsers: filteredUsers,
      },
    });
  } catch (error) {
    console.error("Error in filtering users: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};        

const editUserDetails = async(req,res)=>{

  const adminId = req.user.id;

  if (!adminId) {

    return res.status(200).json({

      status: false,

      message: "User ID is required.",

    });

  }

  try {

    const admin = await User.findByPk(adminId);

    if (!admin || admin.isDeleted === 1) {

      return res.status(200).json({

        status: false,

        message: "User not found",

      });

    }

    if (admin.role !== "admin") {

      return res.status(200).json({

        status: false,

        message: "Only admin can edit user details.",

      });

    }

    const {userId, investigatorName, username, newPassword, confirmPassword, company_name} = req.body;

    if (!userId) {

      return res.status(200).json({

        status: false,

        message: "userId is required.",

      });

    }

    const user = await User.findByPk(userId);

    if (!user || user.isDeleted === 1) {

      return res.status(200).json({

        status: false,

        message: "User not found",

      });

    }
 
    // Prepare update object

    const updateObj = {};

    if (investigatorName) updateObj.investigatorName = investigatorName;

    if (username) updateObj.username = username;

    if (company_name) updateObj.company_name = company_name;

    if (newPassword || confirmPassword) {

      if (newPassword !== confirmPassword) {

        return res.status(200).json({

          status: false,

          message: "New password and confirm password do not match.",

        });

      }

      updateObj.password = await bcrypt.hash(newPassword, 10);

    }
 
    // Only update if there is something to update

    if (Object.keys(updateObj).length === 0) {

      return res.status(200).json({

        status: false,

        message: "No fields to update.",

      });

    }
 
    const updatedProfile = await user.update(updateObj);

    return res.status(200).json({

      status: true,

      data: {

        message: "Profile updated successfully",

        updatedProfile: updatedProfile

      },

    });

  } catch (error) {

    console.error("Error in editing user details: ", error);

    return res.status(200).json({

      status: false,

      message: "Something went wrong",

      error: error.message,

    });

  }

}










 
module.exports = {
  viewUsers,
  uploadCase,
  viewCases,
  assignCase,
  assignCaseToMultipleUsers,
  unAssignCase,
  assignedCases,
  fetchAllCaseData,
  getAssignedUsersForCase, 
  getTotalAssignedUsers,
  submittedCases,
  filterByCaseId,
  isActive,
  deleteAccount,
  deleteCase,
  deleteUser,
  adminDashBoard,
  filterbyCompany,
  editUserDetails,
  
};



