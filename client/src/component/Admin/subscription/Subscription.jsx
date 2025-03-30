import React, { useEffect, useState } from "react";
import "./subscription.css";
import { FaCheckCircle, FaRegClock, FaUsers, FaShieldAlt } from "react-icons/fa";
import axios from "axios";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";
import { useParams } from "react-router-dom";

const apiUrl = "http://localhost:5000";

const iconMap = {
  "check-circle": <FaCheckCircle />,
  "clock": <FaRegClock />,
  "users": <FaUsers />,
  "shield-alt": <FaShieldAlt />,
};

const Subscription = () => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const [plans, setPlans] = useState([]);
  console.log("plans", plans);


  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/subscription`);
        console.log("response sub", res.data);
        setPlans(res.data);

      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/clients/${id}`);
        setClient(res.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };

    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  const handlePayment = async (plan) => {
    try {
      setLoading(true);
      setTimeout(() => {
        alert(`Payment successful for ${plan.name}!`);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Payment Error:", error);
      setLoading(false);
      alert("Payment failed, please try again");
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="subscription-page">
        <div className="plans-container">
          {plans.map((plan, index) => (
            <div className="plan-card" key={index}>
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">{plan.price}</p>
              <p className="plan-duration">{plan.duration}</p>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="feature-icon">{iconMap[feature.icon] || <FaCheckCircle />}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <button
                className="subscribe-btn"
                onClick={() => handlePayment(plan)}
                disabled={loading}
              >
                {loading ? "Processing..." : "Subscribe Now"}
              </button>
            </div>
          ))}
        </div>

        {client && (
          <table className="styled-table-sub">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Role</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{client.name}</td>
                <td>{client.status}</td>
                <td>{client.role}</td>
                <td>{new Date(client.createdAt).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Subscription;
