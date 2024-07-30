import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../../redux/alertsSlice";
import axios from "axios";
import { useParams } from "react-router-dom";
import {Col, Divider, Row, Card} from "antd"

function Profile() {
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const dispatch = useDispatch();

  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/get-doctor-info-by-user-id",
        {
          userId: params.userId,
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
        console.log(response.data.data);
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);

  return (
    <Layout>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
          fontSize: "1.2rem",
          lineHeight: "1.6",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "600",
            marginBottom: "2rem",
          }}
        >
          Doctor Profile
        </h1>
        <Divider
          style={{
            borderColor: "#e8e8e8",
            marginBottom: "3rem",
          }}
        />
        {doctor && (
          <div
            style={{
              marginTop: "3rem",
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8}>
                <Card
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    padding: "2rem",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: "600",
                        margin: 0,
                      }}
                    >
                      {doctor.firstName} {doctor.lastName}
                    </h2>
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                    }}
                  >
                    <p
                      style={{
                        marginBottom: "1rem",
                      }}
                    >
                      Address: {doctor.address}
                    </p>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    padding: "2rem",
                    height: "100%",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "600",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Professional Details
                  </h2>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Specialization: {doctor.specialization}
                  </p>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Experience: {doctor.experience} years
                  </p>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Fees: {doctor.feePerCunsultation}
                  </p>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    padding: "2rem",
                    height: "100%",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "600",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Timings
                  </h2>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "1rem",
                    }}
                  >
                    From: {doctor.timings[0]}
                  </p>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "1rem",
                    }}
                  >
                    To: {doctor.timings[1]}
                  </p>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Profile;