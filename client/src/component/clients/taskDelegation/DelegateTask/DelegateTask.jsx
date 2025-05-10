import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./delegatetask.css";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DelegateTask = () => {
  const [doers, setDoers] = useState([]);
  const [selectedDoer, setSelectedDoer] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [time, setTime] = useState("");
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [calendarConfig, setCalendarConfig] = useState({
    workingDays: [],
    holidays: [],
    shifts: [],
  });

  const [customPermissions, setCustomPermissions] = useState({});
  useEffect(() => {
    const fetchTokenAndUserData = async () => {
      try {
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );

        const userToken = tokenRes.data.token;
        if (!userToken) {
          navigate("/"); // Redirect to login if no token
          return;
        }

        setToken(userToken);

        const [roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            {
              headers: { Authorization: `Bearer ${userToken}` },
              withCredentials: true,
            }
          ),
        ]);

        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        setRole(userRole);
        setCustomPermissions(userPermissions);

        const employeesRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/employee/contactinfo`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        setDoers(employeesRes.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchTokenAndUserData();
  }, [navigate]);

  const highlightWithRanges = {
    "working-day": calendarConfig.workingDays.map((day) => {
      const today = new Date();
      const daysToAdd =
        (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day) -
          today.getDay() +
          7) %
        7;
      const date = new Date(today);
      date.setDate(today.getDate() + daysToAdd);
      return date;
    }),
    holiday: calendarConfig.holidays.map((h) => new Date(h.date)),
  };

  useEffect(() => {
    if (!selectedDoer || !doers.length || !calendarConfig.shifts.length) return;

    const doer = doers.find((d) => d._id === selectedDoer);
    if (doer && doer.shifts?.length > 0) {
      const defaultShift = doer.shifts.find((s) => s.isDefault);
      if (defaultShift) {
        setTime(defaultShift.startTime); // You can also show full range if needed
        console.log("🕒 Auto-filled from default shift:", defaultShift);
      }
    }
  }, [selectedDoer, doers, calendarConfig.shifts]);

  useEffect(() => {
    if (!token) return;

    const fetchCalendarConfig = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workingdays/get`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          setCalendarConfig(res.data.data);
          console.log("📅 Config Loaded:", res.data.data);
        }
      } catch (err) {
        console.error("❌ Calendar config fetch error:", err);
      }
    };

    fetchCalendarConfig();
  }, [token]);

  const handleDateChange = (date) => {
    if (!date) return;

    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const isHoliday = calendarConfig.holidays.some(
      (h) => new Date(h.date).toDateString() === date.toDateString()
    );
    const isWorkingDay = calendarConfig.workingDays.includes(weekday);

    if (!isWorkingDay) {
      alert("❌ This is not a working day.");
      return;
    }

    if (isHoliday) {
      alert("❌ This is a holiday.");
      return;
    }

    setDueDate(date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = {
      name: taskName,
      description: taskDescription,
      dueDate,
      time,
      doer: selectedDoer,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/delegation/add`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        window.alert("✅ Task delegated successfully!");
        navigate("/delegation-tasklist");
        setSelectedDoer("");
        setTaskName("");
        setTaskDescription("");
        setDueDate("");
        setTime("");
      }
    } catch (error) {
      console.error("Error delegating task:", error);
    }
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="delegate-wrapper">
        <form className="delegate-form" onSubmit={handleSubmit}>
          <h2>Delegate a Task</h2>

          <label htmlFor="task-name">Task Name</label>
          <input
            type="text"
            id="task-name"
            placeholder="Enter task name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
          />

          <label htmlFor="task-desc">Task Description</label>
          <textarea
            id="task-desc"
            placeholder="Describe the task in detail"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            required
          />
          <label htmlFor="doer-select">Select Employee</label>
          <select
            id="doer-select"
            value={selectedDoer}
            onChange={(e) => setSelectedDoer(e.target.value)}
            required
          >
            <option value="">-- Select Employee --</option>
            {doers.map((doer) => (
              <option key={doer._id} value={doer._id}>
                {doer.fullName}
              </option>
            ))}
          </select>
          <label htmlFor="due-date">Planned Date</label>
          <DatePicker
            id="due-date"
            selected={dueDate}
            onChange={handleDateChange}
            minDate={new Date()}
            highlightDates={highlightWithRanges}
            filterDate={(date) => {
              const weekday = date.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const isHoliday = calendarConfig.holidays.some(
                (h) => new Date(h.date).toDateString() === date.toDateString()
              );
              return calendarConfig.workingDays.includes(weekday) && !isHoliday;
            }}
            placeholderText={
              !selectedDoer ? "Select Employee First" : "Pick a working day"
            }
            disabled={!selectedDoer}
            className="dele-date-picker-input"
            dateFormat="MMMM d, yyyy"
            popperClassName="dele-date-picker-popper"
            wrapperClassName="dele-date-picker-wrapper"
            showPopperArrow={false}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            inline={false} // Set to true if you want calendar always visible
            shouldCloseOnSelect={true}
            calendarClassName="calendar-month-view" // Add this class
          />
          {selectedDoer &&
            (() => {
              const doer = doers.find((d) => d._id === selectedDoer);
              const shift = doer?.shifts?.find((s) => s.isDefault);
              return (
                <>
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    disabled={!selectedDoer}
                    min={shift?.startTime}
                    max={shift?.endTime}
                  />
                  {shift && (
                    <p style={{ fontSize: "12px", color: "#777" }}>
                      Valid shift: {shift.startTime} - {shift.endTime}
                    </p>
                  )}
                </>
              );
            })()}

          <button type="submit">Submit Task</button>
        </form>
      </div>
    </>
  );
};

export default DelegateTask;
