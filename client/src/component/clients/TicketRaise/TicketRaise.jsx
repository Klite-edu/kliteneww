import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ticketraise.css";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const TicketRaise = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const fetchTickets = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTickets(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleComplete = async (ticketId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/ticketRaise/resolve/${ticketId}`,
        { resolution: resolutionText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchTickets();
      setActiveTicketId(null);
      setResolutionText("");
      alert("Ticket resolved successfully!");
    } catch (error) {
      console.error("Error resolving ticket:", error);
    }
  };

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="ticket-wrapper">
        <h2 className="ticket-title">Employee Raised Tickets</h2>
        <div className="ticket-table-container">
          {tickets.length > 0 ? (
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>SNo.</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Employee Name</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={ticket._id}>
                    <td>{index + 1}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.category}</td>
                    <td>{ticket.type}</td>
                    <td className={`priority-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </td>
                    <td>{ticket.description}</td>
                    <td>{new Date(ticket.date).toLocaleDateString()}</td>
                    <td>{ticket.employeeName}</td>
                    <td className={`status-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </td>
                    <td>
                      {ticket.status === "Pending" ? (
                        <>
                          {activeTicketId === ticket._id ? (
                            <div className="resolution-container">
                              <textarea
                                className="resolution-text"
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                placeholder="Enter resolution details..."
                                required
                              />
                              <button
                                className="btn green"
                                onClick={() => handleComplete(ticket._id)}
                              >
                                Submit Resolution
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn blue"
                              onClick={() => setActiveTicketId(ticket._id)}
                            >
                              Resolve
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="resolution-display">
                          <strong>Resolution:</strong>
                          <p>{ticket.resolution}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-tickets">No tickets found</p>
          )}
        </div>
      </div>
    </>
  );
};

export default TicketRaise;
