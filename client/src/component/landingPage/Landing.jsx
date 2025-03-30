import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaRegClock, FaUsers, FaShieldAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "./landing.css";

// const apiUrl = "http://localhost:5000";

const iconMap = {
    "check-circle": <FaCheckCircle />,
    "clock": <FaRegClock />,
    "users": <FaUsers />,
    "shield-alt": <FaShieldAlt />,
};

const Landing = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        companyWebsite: "",
        industryType: "",
    });

    console.log("Component Rendered");

    useEffect(() => {
        const fetchPlans = async () => {
            console.log("Fetching subscription plans...");
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/subscription`);
                setPlans(res.data);
                console.log("Subscription plans fetched:", res.data);
            } catch (error) {
                console.error("❌ Error fetching subscription plans:", error);
            }
        };
        fetchPlans();
    }, []);

    const handleChange = (e) => {
        const updatedFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(updatedFormData);
        console.log("Form Data Updated:", updatedFormData);
    };

    const handleSubscribeClick = (plan) => {
        console.log("Subscribe button clicked for plan:", plan);
        setSelectedPlan(plan);
        setShowForm(true);
    };

    const handlePayment = async () => {
        console.log("Payment Process Initiated...");
        try {
            setLoading(true);
            console.log("Form Data at Payment:", formData);
            console.log("Selected Plan:", selectedPlan);

            // Simulating a payment process
            setTimeout(async () => {
                alert(`✅ Payment successful for ${selectedPlan.name}!`);
                console.log("✅ Payment successful");

                // After payment, prompt for password setup
                const password = prompt("Enter a new password for your account:");
                console.log("Password entered:", password);

                if (password) {
                    console.log("Registering user...");
                    try {
                        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients/register`, {
                            ...formData,
                            selectedPlan: selectedPlan.name,
                            selectedPlanId: selectedPlan._id,
                            password,
                        });
                        console.log("✅ User registered successfully:", response.data);
                        alert("✅ Account created successfully! You can now log in.");
                    } catch (registerError) {
                        console.error("❌ Error registering user:", registerError);
                        alert("❌ Registration failed, please try again.");
                    }
                } else {
                    console.warn("⚠ No password entered, user registration aborted.");
                }

                setLoading(false);
                setShowForm(false);
            }, 2000);
        } catch (error) {
            console.error("❌ Payment Error:", error);
            setLoading(false);
            alert("❌ Payment failed, please try again");
        }
    };

    return (
        <div>
            <h1>Subscription Plans</h1>
            <div className="plans-container">
                {plans.map((plan, index) => (
                    <div className="plan-card" key={index}>
                        <h3 className="plan-name">{plan.name}</h3>
                        <p className="plan-price">{plan.price}</p>
                        <p className="plan-duration">{plan.duration}</p>
                        <ul className="plan-features">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="feature-item">
                                    <span className="feature-icon">
                                        {iconMap[feature.icon] || <FaCheckCircle />}
                                    </span>
                                    <span>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            className="subscribe-btn"
                            onClick={() => handleSubscribeClick(plan)}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Subscribe Now"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Subscription Form */}
            {showForm && (
                <div className="subscription-form">
                    <h2>Enter Your Details</h2>
                    <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} required />
                    <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
                    <input type="tel" name="phone" placeholder="Phone Number" onChange={handleChange} required />
                    <input type="text" name="companyName" placeholder="Company Name" onChange={handleChange} />
                    <input type="text" name="companyWebsite" placeholder="Company Website" onChange={handleChange} />
                    <input type="text" name="industryType" placeholder="Industry Type" onChange={handleChange} />
                    <button onClick={handlePayment} disabled={loading}>
                        {loading ? "Processing..." : "Proceed to Payment"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Landing;
