import { Button, Form, Input } from "antd";
import { React, useState, useEffect } from "react";
import faceIO from "@faceio/fiojs";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import axios from "axios";
import { hideLoading, showLoading } from "../redux/alertsSlice";

const WrongEmailAttemptsLimit = 3;
const RetryTimeout = 5 * 60 * 1000;

function Login() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [faceio, setFaceio] = useState(null);
  const [error, setError] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer ] = useState(false);
  useEffect(() => {
    const initializeFaceIO = async () => {
      try {
        const faceioInstance = new faceIO("fioa624c");
        setFaceio(faceioInstance);
      } catch (error) {
        setError("Failed to initialize FaceIO: " + error.message);
      }
    };
    initializeFaceIO();
  }, []);

  const handleLogin = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post("/api/user/login", values);
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        dispatch(setUser(response.data.data));
        localStorage.setItem("token", response.data.data);
        navigate("/");
      } else {
        toast.error(response.data.message);
        if(response.data.message === "Too many attempts"){
          setTimer(true)

          setTimeout(() => {
            setTimer(false)
          }, 10000)
          
        }
        // Increase wrong attempts count
        setWrongAttempts(wrongAttempts + 1);
        // Check if the wrong attempts limit is reached
        if (wrongAttempts + 1 >= WrongEmailAttemptsLimit) {
          setErrorMessage(
            "Too many wrong attempts. Please try again in 5 minutes."
          );
          // Disable further submissions for the next 5 minutes
          setTimeout(() => {
            setWrongAttempts(0);
            setErrorMessage("");
          }, RetryTimeout);
        }
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form  p-3 " >
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item label="Email" name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input placeholder="Password" type="password" />
          </Form.Item>

          <Button
          disabled={timer}
            className="primary-button my-2 full-width-button"
            htmlType="submit"
          >
            LOGIN
          </Button>

          <Link to="/register" className="anchor mt-2">
            CLICK HERE TO REGISTER
          </Link>

          {errorMessage && <p>{errorMessage}</p>}
        </Form>
      </div>
    </div>
  );
}

export default Login;