
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../Sidebar/Sidebar";
import Navbar from "../../../Navbar/Navbar";
import { FiX, FiPlus } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./addTask.css";

const PlannedDatePicker = ({
  selectedDoer,
  doers,
  calendarConfig,
  dueDate,
  setDueDate,
}) => {
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

  return (
    <>
      <label className="form-label">Planned Date</label>
      <DatePicker
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
        className="form-input"
        dateFormat="MMMM d, yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </>
  );
};

const AddTask = () => {
  const [task, setTask] = useState({
    taskName: "",
    doerId: "",
    doerName: "",
    department: "",
    frequency: "",
    plannedDate: "",
    plannedTime: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [calendarConfig, setCalendarConfig] = useState({
    workingDays: [],
    holidays: [],
    shifts: [],
  });
  const [dueDate, setDueDate] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/permission/get-token", {
            withCredentials: true,
          }),
          axios.get("http://localhost:5000/api/permission/get-role", {
            withCredentials: true,
          }),
          axios.get("http://localhost:5000/api/permission/get-permissions", {
            withCredentials: true,
          }),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userToken || !userRole) {
          navigate("/login");
          return;
        }

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);

        const employeesRes = await axios.get(
          "http://localhost:5000/api/employee/contactinfo",
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        setEmployees(employeesRes.data);

        const calendarRes = await axios.get(
          "http://localhost:5000/api/workingdays/get",
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );
        if (calendarRes.data.success) {
          setCalendarConfig(calendarRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "doerId") {
      const selectedEmployee = employees.find((emp) => emp._id === value);
      setTask((prevTask) => ({
        ...prevTask,
        doerId: value,
        department: selectedEmployee ? selectedEmployee.designation : "",
        doerName: selectedEmployee ? selectedEmployee.fullName : "",
      }));

      if (selectedEmployee) {
        const shiftInfo = selectedEmployee.shifts?.[0];
        setShiftStart(shiftInfo?.startTime || "");
        setShiftEnd(shiftInfo?.endTime || "");
      }
    } else {
      setTask((prevTask) => ({
        ...prevTask,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formattedDate = dueDate ? dueDate.toISOString().split("T")[0] : "";

      let plannedDateTime = "";
      if (dueDate && task.plannedTime) {
        const [hours, minutes] = task.plannedTime.split(":").map(Number);
        const localDate = new Date(dueDate);
        localDate.setHours(hours);
        localDate.setMinutes(minutes);
        localDate.setSeconds(0);
        localDate.setMilliseconds(0);
        plannedDateTime = localDate.toISOString();
      }

      console.log(`plannedDateTime - ${plannedDateTime}`);



      await axios.post(
        "http://localhost:5000/api/tasks/add",
        {
          ...task,
          plannedDate: formattedDate,
          plannedDateTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Task added successfully!");
      navigate("/check-tasklist");
      resetForm();
    } catch (error) {
      console.error("Error adding task:", error);
      alert(error.response?.data?.message || "Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTask({
      taskName: "",
      doerId: "",
      doerName: "",
      department: "",
      frequency: "",
      plannedDate: "",
      plannedTime: "",
    });
    setDueDate(null);
  };

  const handleCancel = () => {
    navigate("/check-tasklist");
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="add-task-container">
        <div className="add-task-card">
          <div className="add-task-header">
            <h2 className="add-task-title">Add New Task</h2>
            <button className="add-task-close-btn" onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="add-task-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input
                  type="text"
                  name="taskName"
                  value={task.taskName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select
                  name="doerId"
                  value={task.doerId}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department (Designation)</label>
                <input
                  type="text"
                  name="department"
                  value={task.department}
                  className="form-input"
                  readOnly
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  name="frequency"
                  value={task.frequency}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Alternate Days">Alternate Days</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-yearly">Half-yearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="First of every month">
                    First of every month
                  </option>
                  <option value="Second of every month">
                    Second of every month
                  </option>
                  <option value="Third of every month">
                    Third of every month
                  </option>
                  <option value="Fourth of every month">
                    Fourth of every month
                  </option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <PlannedDatePicker
                  selectedDoer={task.doerId}
                  doers={employees}
                  calendarConfig={calendarConfig}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Planned Time</label>
                <input
                  type="time"
                  name="plannedTime"
                  value={task.plannedTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                {shiftEnd && shiftStart && (
                  <label className="form-label">
                    Assigned Shift: {shiftStart} - {shiftEnd}
                  </label>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                <FiPlus /> {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTask;