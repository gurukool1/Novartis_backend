const express = require("express");
const UserCase = require("../models/userCaseModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const { Form } = require("../models");




// ...existing code...
const assignedCase = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) { // fixed property name
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role === "admin") {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to view assigned cases",
      });
    }

    // only fetch cases assigned to this user (and optionally only not-deleted assignments)
    const assignedCases = await UserCase.findAll({
      where: { userId: userId }, // filter by current user
      include: [
        {
          model: Case,
          attributes: ["id", "title", "fileUrl", "pdfUrl"],
        },
        {
          model: User,
          attributes: ["id", "username"],
        },
        {
          model: Form,
          as: "form",            // must match UserCase.hasOne(..., as: 'form')
          attributes: ["id", "userCaseId"],
          required: false,       // include even if no form exists
         
        }
      ],
      order: [["assignedAt", "DESC"]],
    });

    //const baseUrl = req.protocol + "://" + req.get("host");
    // const data = assignedCases.map((row) => {
    //   const obj = row.toJSON();

    //   const p = obj?.Case?.file_path || null;
    //   if (p) {
    //     const normalized = p.replace(/\\/g, "/");
    //     const noLeading = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    //     obj.Case.fileUrl = `${baseUrl}/${encodeURI(noLeading)}`;
    //   } else {
    //     obj.Case.fileUrl = null;
    //   }

    //   delete obj.Case.file_path;
    //   return obj;
    // });

    // build assignCaseForm mapping from included "form" (may be null)
    const mapAssignCaseForm = assignedCases.map((row) => {
      return {
        userCaseId: row.id,
        formId: row.form ? row.form.id : null,
       // status: row.form ? row.form.status : null
      };
    }).filter(item => item.formId !== null); // optional: only return those with forms

    if (assignedCases.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No assigned cases",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        message: "Assigned cases retrieved successfully",
        data: assignedCases,
        assignCaseForm: mapAssignCaseForm,
      },
    });
  } catch (error) {
    console.error("Error in assigned cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
// ...existing code...



const totalAssignedCases = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user || user.isdeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    if (user.role === "admin") {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to view total assigned cases",
      });
    }
    const assignedCases = await UserCase.findAll({
      where: { userId: userId },
    });

    if (assignedCases.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No assigned cases found",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        message: "Total assigned cases retrieved successfully",
        response: assignedCases.length,
      },
    });
  } catch (error) {
    console.error("Error in total assigned cases: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports = {
  assignedCase,
  totalAssignedCases,
};
