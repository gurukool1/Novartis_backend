const express = require("express");
const UserCase = require("../models/userCaseModel");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const { Form } = require("../models");



const submitForm = async (req, res) => {
  const userId = req.user.id;
  console.log("userId", userId);

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
    if (user.role === "admin") {
      return res.status(200).json({
        status: false,
        message: "Investigators can submit a form.",
      });
    }
    const { caseId, userCaseId, grandTotal, formdata, percentage, isDraft } = req.body;
    if (!caseId || !grandTotal || !formdata) {
      return res.status(200).json({
        status: false,
        message: " caseId,grand total and form data are required.",
      });
    }

    console.log("userId, caseId", userId, caseId);

    const userCase = await UserCase.findOne({
      where: { caseId: caseId, userId: userId, isDeleted: 0 },
    });
    if (!userCase) {
      return res.status(200).json({
        status: false,
        message: "User case not found",
      });
    }




    const caseData = await Case.findByPk(caseId);
    if (!caseData) {
      return res.status(200).json({
        status: false,
        message: "Case not found",
      });
    }
    const existingForm = await Form.findOne({ where: { userCaseId: caseData.dataValues.id, isDeleted: 0 } });
    console.log("existingForm", existingForm);
    if (existingForm) {
      return res.status(200).json({
        status: false,
        message: "Form already exists for this case.",
      });
    }

    const status = percentage === 100 && isDraft === 1 ? 'submitted' : 'resume';
    const alreadyAssigned = percentage === 100 && isDraft === 1 ? 1 : 0;
    const form = await Form.create({
      caseId,
      userId,
      userCaseId: caseData.dataValues.id,
      MMT_8_initial: formdata.MMT_8_initial || {},
      CDASI_Activity_initial: formdata.CDASI_Activity_initial || {},
      CDASI_Damage_initial: formdata.CDASI_Damage_initial || {},
      Gottron_Hands_initial: formdata.Gottron_Hands_initial || {},
      Periungual_initial: formdata.Periungual_initial || {},
      Alopecia_initial: formdata.Alopecia_initial || {},
      MDAAT_initial: formdata.MDAAT_initial || {},
      MMT_8_followUp: formdata.MMT_8_followUp || {},
      CDASI_Activity_followUp: formdata.CDASI_Activity_followUp || {},
      CDASI_Damage_followUp: formdata.CDASI_Damage_followUp || {},
      Gottron_Hands_followUp: formdata.Gottron_Hands_followUp || {},
      Periungual_followUp: formdata.Periungual_followUp || {},
      Alopecia_followUp: formdata.Alopecia_followUp || {},
      MDAAT_followUp: formdata.MDAAT_followUp || {},
      Physician_initial: formdata.Physician_initial || {},
      Physician_followUp: formdata.Physician_followUp || {},
      form_Score_initial: grandTotal.initial || {},
      form_Score_followUp: grandTotal.followUp || {},
      percentage: percentage,
      isDraft: isDraft
    });
    await userCase.update(
      { status: status, percentage: percentage || 0, alreadyAssigned: alreadyAssigned },
      { where: { caseId: caseId, userId: userId } }
    );

    //  const baseUrl = req.protocol + '://' + req.get('host');
    // const fileUrl = caseData.file_path
    //   ? baseUrl + '/' + caseData.file_path.replace(/\\/g, '/')
    //   : null;
    return res.status(200).json({
      status: true,
      data: {
        message: "Form submitted successfully",
        form,

      },
    });
  } catch (error) {
    console.error("Error in submitting a form: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const viewForm = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }

  try {
    const { userCaseId, formId, caseId } = req.body;
    if (!userCaseId) {
      return res.status(200).json({
        status: false,
        message: "UserCase ID is required.",
      });
    }
    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    let investigatorName = user.investigatorName || null;
    if (user.role === "admin") {
      const form = await Form.findOne({ where: { userCaseId: userCaseId } });
      if (!form) {
        return res.status(200).json({
          status: false,
          message: "Form not found",
        });
      }
      const userID = form.userId;
      const userCase = await UserCase.findOne({
        where: { id: userCaseId },
        include: [{ model: User, attributes: ['investigatorName'] }],

      });
      if (!userCase) {
        return res.status(200).json({
          status: false,
          message: "User case not found",
        });
      }
      investigatorName = userCase.User.investigatorName || null;
      const formData = {
        ...form.dataValues,
        investigatorName
      };
      return res.status(200).json({
        status: true,
        data: {
          message: "Form found successfully",
          form: formData,
        },
      });
    }
    const form = await Form.findOne({ where: { userCaseId } });
    if (!form) {
      return res.status(200).json({
        status: false,
        message: "Form not found",
      });
    }
    // if (user.role === "admin" && form.status === "submitted") {
    //  return res.status(200).json({
    //   status: true,
    //   data: {
    //     message: "Form found successfully",
    //     form,
    //   },
    // });
    // }
    if (form.userId !== userId) {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to view this form.",
      });
    }
    // const  caseFile = await Case.findOne({ where: { id: caseId } });
    // if (!caseFile) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Case not found",
    //   });
    // }
    //  const updatedform = {
    //   ...form.dataValues,
    //   investigatorName,}
    //  const baseUrl = req.protocol + '://' + req.get('host');
    // const fileUrl = caseFile.file_path
    //   ? baseUrl + '/' + caseFile.file_path.replace(/\\/g, '/')
    //   : null;
    return res.status(200).json({
      status: true,
      data: {
        message: "Form found successfully",
        form: form,


      },
    });
  } catch (error) {
    console.error("Error in submitting a form: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

const editForm = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(200).json({
      status: false,
      message: "User ID is required.",
    });
  }
  try {
    const { formId, caseId, userCaseId, grandTotal, formdata, percentage, isDraft } = req.body;
    if (!formId || !userCaseId || !grandTotal || !formdata) {
      return res.status(200).json({
        status: false,
        message: "form ID, Case ID, form data and total score is required.",
      });
    }
    console.log(percentage);

    const user = await User.findByPk(userId);
    if (!user || user.isDeleted === 1) {
      return res.status(200).json({
        status: false,
        message: "User not found",
      });
    }
    const existingForm = await Form.findOne({ where: { id: formId, userCaseId } });
    if (!existingForm) {
      return res.status(200).json({
        status: false,
        message: "Form not found",
      });
    }


    if (existingForm.userId !== userId) {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to edit this form.",
      });
    }
    console.log("existing case id and case id", existingForm.caseId, parseInt(caseId));
    if (existingForm.caseId !== parseInt(caseId)) {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to edit this form.",
      });
    }
    const userCase = await UserCase.findOne({
      where: { caseId, userId, isDeleted: 0 },
    });
    if (!userCase) {
      return res.status(200).json({
        status: false,
        message: "User case not found",
      });
    }

    const status = percentage === 100 && isDraft === 1 ? 'submitted' : 'resume';
    const alreadyAssigned = percentage === 100 && isDraft === 1 ? 1 : 0;
    const updatedForm = await existingForm.update({
      caseId,
      MMT_8_initial: formdata.MMT_8_initial || existingForm.MMT_8_initial,
      CDASI_Activity_initial: formdata.CDASI_Activity_initial || existingForm.CDASI_Activity_initial,
      CDASI_Damage_initial: formdata.CDASI_Damage_initial || existingForm.CDASI_Damage_initial,
      Gottron_Hands_initial: formdata.Gottron_Hands_initial || existingForm.Gottron_Hands_initial,
      Periungual_initial: formdata.Periungual_initial || existingForm.Periungual_initial,
      Alopecia_initial: formdata.Alopecia_initial || existingForm.Alopecia_initial,
      MDAAT_initial: formdata.MDAAT_initial || existingForm.MDAAT_initial,
      MMT_8_followUp: formdata.MMT_8_followUp || existingForm.MMT_8_followUp,
      CDASI_Activity_followUp: formdata.CDASI_Activity_followUp || existingForm.CDASI_Activity_followUp,
      CDASI_Damage_followUp: formdata.CDASI_Damage_followUp || existingForm.CDASI_Damage_followUp,
      Gottron_Hands_followUp: formdata.Gottron_Hands_followUp || existingForm.Gottron_Hands_followUp,
      Periungual_followUp: formdata.Periungual_followUp || existingForm.Periungual_followUp,
      Alopecia_followUp: formdata.Alopecia_followUp || existingForm.Alopecia_followUp,
      MDAAT_followUp: formdata.MDAAT_followUp || existingForm.MDAAT_followUp,
      Physician_initial: formdata.Physician_initial || existingForm.Physician_initial,
      Physician_followUp: formdata.Physician_followUp || existingForm.Physician_followUp,
      form_Score_initial: grandTotal.initial || existingForm.form_Score_initial,
      form_Score_followUp: grandTotal.followUp || existingForm.form_Score_followUp,
      status: status,
      percentage: percentage,
      isDraft: isDraft
    });
    await userCase.update(
      { status: status, percentage: percentage, alreadyAssigned: alreadyAssigned },
      { where: { caseId: caseId, userId: userId } }
    );
    //  const  caseFile = await Case.findOne({ where: { id: caseId } });
    // if (!caseFile) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Case not found",
    //   });
    // }

    //  const baseUrl = req.protocol + '://' + req.get('host');
    // const fileUrl = caseFile.file_path
    //   ? baseUrl + '/' + caseFile.file_path.replace(/\\/g, '/')
    //   : null;
    return res.status(200).json({
      status: true,
      data: {
        message: "Form updated successfully",
        form: updatedForm,
        // fileUrl
      },
    });
  } catch (error) {
    console.error("Error in submitting a form: ", error);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}

module.exports = { submitForm, viewForm, editForm };