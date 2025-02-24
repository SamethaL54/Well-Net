const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    doctorInfo: {
      type: Object,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    type:{
      type: String,
      default: ""
    },
    appointmentId:{
      type: String,
      default: ""
    },
    payment:{
      type:String,
      default:"none"
    },
    bookingDate: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const appointmentModel = mongoose.model("appointmenst", appointmentSchema);
module.exports = appointmentModel;
