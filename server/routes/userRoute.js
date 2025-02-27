const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
require("dotenv").config();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const stripe = require("stripe")(process.env.STRIPE_API);
router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});


const limitedReq = { count : 0 }
const reqbool = { action : false }
router.post("/login", async (req, res) => {
  try {
    if(limitedReq.count >= 3 || reqbool.action == true){
      reqbool.action = true
      return res
        .status(200)
        .send({ message: "Too many attempts", success: false });
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      limitedReq.count += 1;
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    if(user.reqCount > 3){
      return res
        .status(200)
        .send({ message: "Too many attempts", success: false });
        
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      limitedReq.count += 1;
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      user.reqCount = 0;
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Check if user is doctor, if yes then fetch faceid and send it to client
      let clientData;
      if (user.isDoctor == true) {
        await Doctor.findOne({ userId: user._id })
          .then((usr) => {
            clientData = {
              message: "Login successful",
              success: true,
              data: token,
              faceID: usr.faceID,
            };
          })
          .catch((error) => {
            console.log(error);
            res
              .status(500)
              .send({ message: "Error logging in", success: false, error });
          });
      } else {
        clientData = {
          message: "Login successful",
          success: true,
          data: token,
        };
      }
      res.status(200).send(clientData);
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});


router.post("/get-faceid", async (req, res) => {
  try {
    const user = await Doctor.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }
    res.status(200).send(user.faceID);
  } catch (error) {
    
  }
})


router.post("/doctor-login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Check if user is doctor, if yes then fetch faceid and send it to client
    let clientData;
    if (user.isDoctor == true) {
      await Doctor.findOne({ userId: user._id })
        .then((usr) => {
          clientData = {
            message: "Login successful",
            success: true,
            data: token,
            faceID: usr.faceID,
          };
        })
        .catch((error) => {
          console.log(error);
          res
            .status(500)
            .send({ message: "Error logging in", success: false, error });
        });
    } else {
      clientData = {
        message: "Login successful",
        success: true,
        data: token,
      };
    }
    res.status(200).send(clientData);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newdoctor = new Doctor({ ...req.body, status: "pending" });
    await newdoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newdoctor.firstName} ${newdoctor.lastName} has applied for a doctor account`,
      data: {
        doctorId: newdoctor._id,
        name: newdoctor.firstName + " " + newdoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post("/update-doctor-account", async (req, res) => {
  try {
    await Doctor.findOneAndUpdate(
      { userId: req.body.id },
      { $set: { faceID: req.body.faceID } },
      { new: true }
    )
      .then((usr) => {
        res.status(200).json({
          user: usr,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error updating doctor account",
      success: false,
      error,
    });
  }
});

router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications cleared",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    if (req.body.time === null || req.body.date === null) {
      return res.status(200).send({
        message: "All fields are mandatory",
        success: false,
      });
    }
    let data = {...req.body, bookingDate: new Date()};
    if (req.body.type === "videoConsultancy") {
      data = { ...req.body, appointmentId: uuidv4() };
    }
    const newAppointment = new Appointment(data);
    await newAppointment.save();

    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
      appointment_id: newAppointment._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

// router.post("/cancel-appointment", authMiddleware, async(req, res) => {
//   try {
//     const {_id, date} = req.body;
//     const appointmentDate = date;
//     const momentDate = moment(appointmentDate, "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (z)");
//     const currentTime = new Date;
//     const utcDateTime = moment(currentTime);
//     console.log("Current ",utcDateTime);
//     console.log("appointment ",momentDate);
//     const differenceInHours = utcDateTime.diff(momentDate, 'hours');

//     console.log("Difference in hours:", differenceInHours);
//     if (differenceInHours <= 2) {
//       return res.status(200).send({success: false, data:"Cancellation Failed"})
//     } else{
//       // await Appointment.deleteOne({ _id: _id });
//     }
//     return res.status(200).send({success: true, data: "Cancellation success"})
//   } catch (error) {
//     return res.status(200).send({success: false, data:"Cancellation Failed"})
//   }
// })




router.post("/cancel-appointment", authMiddleware, async (req, res) => {
  try {
    const { _id, date } = req.body;

    console.log("Received date:", date);

    // Convert date string to Moment.js object
    const momentDate = moment(date);

    console.log("Moment.js date:", momentDate.format());

    // Get current time in UTC as a Moment.js object
    const utcDateTime = moment().utc();

    console.log("Current time (UTC):", utcDateTime.format());

    // Calculate difference in hours
    const differenceInHours = utcDateTime.diff(momentDate, 'hours');

    console.log("Difference in hours:", differenceInHours);

    if (differenceInHours <= 2) {
      return res.status(200).send({ success: false, data: "Cancellation failed: Appointment cannot be cancelled within 2 hours of the scheduled time." });
    } else {
      // Perform cancellation logic here
      // await Appointment.deleteOne({ _id: _id });
      return res.status(200).send({ success: true, data: "Cancellation success" });
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return res.status(500).send({ success: false, data: "Cancellation failed: Internal server error" });
  }
});



// router.post("/cancel-appointment", authMiddleware, async(req, res) => {
//   try {
//     const {_id, date} = req.body;
//     const initialDate = moment(date);
//     const hoursElapsed = moment().diff(initialDate, 'hours');

//     console.log(hoursElapsed);
//     return res.status(200).send({success: true, data: "Cancellation success"})
//   } catch (error) {
//     return res.status(200).send({success: false, data:"Cancellation Failed"})
//   }
// })



router.post("/check-booking-avilability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    if (fromTime === null || toTime === null) {
      return res.status(200).send({
        message: "All fields are mandatory",
        success: false,
      });
    }
    const doctorId = req.body.doctorId;
    const service = req.body.service;
    const appointments = await Appointment.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });

    const doctor = await Doctor.findOne({
      doctorId,
    });
    if (!doctor.serviceType[service]) {
      return res.status(200).send({
        message: `${service} is not available`,
        success: false,
      });
    } else if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error,
    });
  }
});


const genAI = new GoogleGenerativeAI("AIzaSyCuJOkA53b9yb9M_0W4ivb1J1pKLcWTHxM");
router.get("/test", (req, res) => {
  res.send("Hello");
});
router.post("/process", async (req, res) => {
  const prompt = req.body.prompt;
  console.log(prompt);
  try {
    const generativeAIResponse = await processPromptWithGenerativeAI(prompt);
    console.log(generativeAIResponse);

    res.status(200).json({ response: generativeAIResponse });
  } catch (error) {
    console.error("Error processing prompt with generative AI:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  const { products, id, appointment_id } = req.body;
  const lineItems = products.map((product) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: product.drug,
        images: [product.imgdata],
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qnty,
  }));
  console.log(appointment_id);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:3000/sucess",
    cancel_url: "http://localhost:3000/cancel",
    metadata: { data: appointment_id },
  });

  res.json({ id: session.id });
});

router.post("/stripe-payment", authMiddleware, (req, res) => {});

async function processPromptWithGenerativeAI(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

module.exports = router;
