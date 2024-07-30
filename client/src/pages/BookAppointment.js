import { Button, Col, DatePicker, Form, Input, Row, TimePicker } from "antd";
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DoctorForm from "../components/DoctorForm";
import moment from "moment";

import { loadStripe } from "@stripe/stripe-js";

function BookAppointment() {
  const [isAvailable, setIsAvailable] = useState(false);
  const navigate = useNavigate();
  const [date, setDate] = useState();
  const [time, setTime] = useState();
  const [type, setType] = useState("inplaceConsultancy");
  const { user } = useSelector((state) => state.user);
  const [doctor, setDoctor] = useState(null);
  const params = useParams();
  const dispatch = useDispatch();

  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/get-doctor-info-by-id",
        {
          doctorId: params.doctorId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        setDoctor(response.data.data);
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };
  const checkAvailability = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/check-booking-avilability",
        {
          doctorId: params.doctorId,
          date: date,
          time: time,
          service: type,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        setIsAvailable(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error booking appointment");
      dispatch(hideLoading());
    }
  };
  const bookNow = async () => {
    setIsAvailable(false);
    try {
      dispatch(showLoading());

      // Complete the payment

      const product = [
        {
          drug: type,
          price: doctor.feePerCunsultation,
          imgdata:
            "https://eadn-wc03-8290287.nxedge.io/wp-content/uploads/2022/12/hospital-complex-shutterstock-5_3_2018-scaled.jpg",
          qnty: 1,
        },
      ];

      const makePayment = async (appointment_id) => {
        const stripe = await loadStripe(
          "pk_test_51NLrKTSFslO8kvFYLFdqc0xYxjDOCt5B2E4qTZruY7ep3X8fWiICFH9VdaZCdfcaaLlNPBY97iPXW5dfx7oNUzbt00rn5jiEol"
        );
        const body = {
          products: product,
          id: user._id,
          appointment_id: appointment_id,
        };
        const headers = {
          "Content-Type": "application/json",
        };
        const response = await fetch("/api/user/create-checkout-session", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        });
        const session = await response.json();
        const result = stripe.redirectToCheckout({
          sessionId: session.id,
        });
        console.log(result);
        if (result.error) {
          console.log(result.error);
        }
      };

      // await makePayment();

      const response = await axios.post(
        "/api/user/book-appointment",
        {
          doctorId: params.doctorId,
          userId: user._id,
          doctorInfo: doctor,
          userInfo: user,
          date: date,
          time: time,
          type: type,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        console.log(response.appointment_id);
        await makePayment(response.data.appointment_id);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error("Error booking appointment");
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);
  return (
    <div>
      <Layout>
        {doctor && (
          <div>
            <h1 className="page-title">
              {doctor.firstName} {doctor.lastName}
            </h1>
            <hr />
            <Row gutter={20} className="mt-5" align="middle">
              <Col span={8} sm={24} xs={24} lg={8}>
                <img
                  src="https://thumbs.dreamstime.com/b/finger-press-book-now-button-booking-reservation-icon-online-149789867.jpg"
                  alt=""
                  width="100%"
                  height="400"
                />
              </Col>
              <Col span={8} sm={24} xs={24} lg={8}>
                <h1 className="normal-text">
                  <b>Timings :</b> {doctor.timings[0]} - {doctor.timings[1]}
                </h1>
                <p>
                  <b>Phone Number : </b>
                  {doctor.phoneNumber}
                </p>
                <p>
                  <b>Address : </b>
                  {doctor.address}
                </p>
                <p>
                  <b>Fee per Visit : </b>
                  {doctor.feePerCunsultation}
                </p>
                <p>
                  <b>Website : </b>
                  {doctor.website}
                </p>
                <div className="d-flex flex-column pt-2 mt-2">
                  <DatePicker
                    rules={[{ required: true }]}
                    format="DD-MM-YYYY"
                    onChange={(value) => {
                      setDate(moment(value).format("DD-MM-YYYY"));
                      setIsAvailable(false);
                    }}
                  />
                  <TimePicker
                    rules={[{ required: true }]}
                    format="HH:mm"
                    className="mt-3"
                    onChange={(value) => {
                      setIsAvailable(false);
                      setTime(moment(value).format("HH:mm"));
                    }}
                  />
                  <div className="radio">
                    <label className="inline" style={{ display: "inline" }}>
                      <input
                        type="radio"
                        value="videoConsultancy"
                        checked={type === "videoConsultancy"}
                        onChange={() => {
                          setType("videoConsultancy");
                          console.log(type);
                        }}
                      />
                      Video-consultancy
                    </label>
                  </div>
                  <div className="radio">
                    <label className="inline" style={{ display: "inline" }}>
                      <input
                        type="radio"
                        value="homeConsultancy"
                        checked={type === "homeConsultancy"}
                        onChange={() => {
                          setType("homeConsultancy");
                          console.log(type);
                        }}
                      />
                      Home-consultancy
                    </label>
                  </div>
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        value="inplaceConsultancy"
                        checked={type === "inplaceConsultancy"}
                        onChange={() => {
                          setType("inplaceConsultancy");
                          console.log(type);
                        }}
                      />
                      Inplace-consultancy
                    </label>
                  </div>

                  {!isAvailable && (
                    <Button
                      className="primary-button mt-3 full-width-button"
                      onClick={checkAvailability}
                    >
                      Check Availability
                    </Button>
                  )}

                  {isAvailable && (
                    <Button
                      className="primary-button mt-3 full-width-button"
                      onClick={bookNow}
                    >
                      Book Now
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Layout>
    </div>
  );
}

export default BookAppointment;
