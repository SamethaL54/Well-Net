const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointmentModel");


const app = express();

router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (request, response) => {
    const event = request.body;
    switch (event.type) {
      case "checkout.session.completed":
        const paymentIntent = event.data.object;

        console.log("payment sucessfull and db updated");
        console.log(event.data.object.metadata);
        await Appointment.findByIdAndUpdate(event.data.object.metadata.data, {payment: "success"})
        
        break;
      case "charge.failed":
        const paymentMethod = event.data.object;
        console.log("payment unsucessfull and db unupdated");
        break;
      default:
    }

    response.json({ received: true });
  }
);

module.exports = router;
