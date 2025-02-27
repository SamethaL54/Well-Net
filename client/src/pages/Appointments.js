import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Layout from "../components/Layout";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Table } from "antd";
import moment from "moment";

function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const dispatch = useDispatch();
  const getAppointmentsData = async () => {
    try {
      dispatch(showLoading());
      const resposne = await axios.get(
        "/api/user/get-appointments-by-user-id",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (resposne.data.success) {

        const successfulPayments = resposne.data.data.filter(item => item.payment === 'success');

        setAppointments(successfulPayments);

      }
    } catch (error) {
      dispatch(hideLoading());
    }
  };
  const columns = [
    {
      title: "",
      dataIndex: "_id",
      render: (text, record) => (
        <button
          className="white"
          onClick={() => {
            navigate(`/video-chat-room/${record.appointmentId}`);
          }}
        >
          {record.type === "videoConsultancy" && record.status !== "pending" ? "JOIN" : ""}
        </button>
      ),
    },
    {
      title: "id",
      dataIndex: "_id",
      render: (text, record) => record._id,
    },

    {
      title: "type",
      dataIndex: "type",
    },
    {
      title: "Doctor",
      dataIndex: "name",
      render: (text, record) => (
        <span>
          {record.doctorInfo.firstName} {record.doctorInfo.lastName}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      render: (text, record) => <span>{record.doctorInfo.phoneNumber}</span>,
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      render: (text, record) => (
        <span>
          {moment(record.date).format("DD-MM-YYYY")}{" "}
          {moment(record.time).format("HH:mm")}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Cancellation",
      dataIndex: "cancellation",
      render: (text, record) => (
        
        <button
          className="text-red-800"
          onClick={ async () => {
            console.log(record);
            const response = await axios.post(
              "/api/user/cancel-appointment",
              {
                _id: record._id,
                date: record.bookingDate
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            if(response.data.success){
              toast("Appointment Cancelled")
              window.location.reload()
            }else{
              toast("Cancellation failed")
            }
          }}
        >
          cancel
        </button>
      )
    },
  ];
  useEffect(() => {
    getAppointmentsData();
  }, []);
  return (
    <Layout>
      <h1 className="page-title">Appointments</h1>
      <hr />
      <Table columns={columns} dataSource={appointments} />
    </Layout>
  );
}

export default Appointments;
