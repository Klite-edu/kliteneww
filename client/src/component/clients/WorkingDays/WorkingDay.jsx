import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import "./workingday.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Sidebar/Sidebar";
import Navbar from "../../Navbar/Navbar";

const localizer = momentLocalizer(moment);

const WorkingDay = () => {
  const [workingDays, setWorkingDays] = useState([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("configuration");
  const [token, setToken] = useState("");
  const [fileImportType, setFileImportType] = useState("excel");
  const [importProgress, setImportProgress] = useState(null);
  const [role, setRole] = useState("");
  const [customPermissions, setCustomPermissions] = useState({});
  const navigate = useNavigate();

  // Fetch initial data including token, role, and permissions
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch authentication data
        const [tokenRes, roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);

        const userToken = tokenRes.data.token;
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        setToken(userToken);
        setRole(userRole);
        setCustomPermissions(userPermissions);

        // Fetch saved configuration data
        const configRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workingdays/get`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
            withCredentials: true,
          }
        );

        if (configRes.data && configRes.data.success) {
          const { workingDays, shifts, holidays, timezone } =
            configRes.data.data;

          // Update state with saved data
          setWorkingDays(workingDays || []);
          setShifts(shifts || []);
          setHolidays(holidays || []);
          setTimezone(timezone || "Asia/Kolkata");

          // Create calendar events
          const savedHolidayEvents = (holidays || []).map((holiday) => ({
            title: holiday.description,
            start: new Date(holiday.date),
            end: new Date(holiday.date),
            type: "custom-holiday",
            className: "working-day-custom-holiday-event",
          }));

          // Predefined festival events
          const festivalEvents = [
            {
              title: "Diwali",
              start: new Date(new Date().getFullYear(), 10, 12),
              end: new Date(new Date().getFullYear(), 10, 12),
              type: "festival",
              className: "working-day-festival-event",
            },
            {
              title: "Christmas",
              start: new Date(new Date().getFullYear(), 11, 25),
              end: new Date(new Date().getFullYear(), 11, 25),
              type: "holiday",
              className: "working-day-holiday-event",
            },
            {
              title: "New Year",
              start: new Date(new Date().getFullYear() + 1, 0, 1),
              end: new Date(new Date().getFullYear() + 1, 0, 1),
              type: "holiday",
              className: "working-day-holiday-event",
            },
          ];

          setEvents([...festivalEvents, ...savedHolidayEvents]);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportProgress({ status: "processing", message: "Processing file..." });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let importedHolidays = [];

        if (fileImportType === "excel") {
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          importedHolidays = jsonData.map((item) => ({
            date: item.date ? new Date(item.date) : null,
            description: item.description || "",
            repeatsAnnually: Boolean(item.repeatsAnnually) || false,
          }));
        } else {
          Papa.parse(data, {
            header: true,
            complete: (results) => {
              importedHolidays = results.data.map((item) => ({
                date: item.date ? new Date(item.date) : null,
                description: item.description || "",
                repeatsAnnually: Boolean(item.repeatsAnnually) || false,
              }));
            },
            error: (error) => {
              console.error("CSV parsing error:", error);
              setImportProgress({
                status: "error",
                message: "Error parsing CSV file",
              });
            },
          });
        }

        // Filter out invalid dates and empty descriptions
        const validHolidays = importedHolidays.filter(
          (h) =>
            h.date instanceof Date && !isNaN(h.date) && h.description.trim()
        );

        if (validHolidays.length === 0) {
          setImportProgress({
            status: "error",
            message: "No valid holidays found in file",
          });
          return;
        }

        setHolidays([...holidays, ...validHolidays]);
        setImportProgress({
          status: "success",
          message: `Successfully imported ${validHolidays.length} holidays`,
        });
      } catch (error) {
        console.error("File import error:", error);
        setImportProgress({
          status: "error",
          message: "Error processing file",
        });
      }
    };

    reader.onerror = () => {
      setImportProgress({ status: "error", message: "Error reading file" });
    };

    if (fileImportType === "excel") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };
  const handleDeleteConfig = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete the working days configuration? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/workingdays/delete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert("Work configuration deleted successfully!");
        setWorkingDays([]);
        setShifts([]);
        setHolidays([]);
        setTimezone("Asia/Kolkata");
        setEvents([]);
      } else {
        alert("Failed to delete work configuration.");
      }
    } catch (error) {
      console.error("Error deleting configuration:", error);
      alert("Error deleting work configuration.");
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        date: "2023-01-26",
        description: "Republic Day",
        repeatsAnnually: true,
      },
      {
        date: "2023-08-15",
        description: "Independence Day",
        repeatsAnnually: true,
      },
    ];

    if (fileImportType === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
      XLSX.writeFile(workbook, "holidays_template.xlsx");
    } else {
      const csv = Papa.unparse(templateData);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "holidays_template.csv";
      link.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workingdays/save`,
        { workingDays, shifts, holidays, timezone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            withCredentials: true,
          },
        }
      );

      if (response.data.success) {
        alert("Configuration saved successfully!");

        // Update calendar events with saved holidays
        const holidayEvents = holidays.map((holiday) => ({
          title: holiday.description,
          start: new Date(holiday.date),
          end: new Date(holiday.date),
          type: "custom-holiday",
          className: "working-day-custom-holiday-event",
        }));

        // Keep the predefined festival events
        const festivalEvents = events.filter(
          (event) => event.type === "festival" || event.type === "holiday"
        );

        setEvents([...festivalEvents, ...holidayEvents]);
      } else {
        alert("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Error saving configuration");
    }
  };

  const handleShiftChange = (index, field, value) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  const addShift = () => {
    setShifts([
      ...shifts,
      { name: "", startTime: "", endTime: "", isActive: true },
    ]);
  };

  const removeShift = (index) => {
    const newShifts = [...shifts];
    newShifts.splice(index, 1);
    setShifts(newShifts);
  };

  const addHoliday = () => {
    setHolidays([
      ...holidays,
      { date: "", description: "", repeatsAnnually: false },
    ]);
  };

  const removeHoliday = (index) => {
    const newHolidays = [...holidays];
    newHolidays.splice(index, 1);
    setHolidays(newHolidays);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";
    if (event.type === "festival") backgroundColor = "#ff9f43";
    if (event.type === "holiday") backgroundColor = "#ee5253";
    if (event.type === "custom-holiday") backgroundColor = "#5f27cd";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="working-day-container">
        <div className="working-day-header">
          <h2>Working Days Configuration</h2>
          <div className="working-day-tabs">
            <button
              className={`working-day-tab ${
                activeTab === "configuration" ? "active" : ""
              }`}
              onClick={() => setActiveTab("configuration")}
            >
              Configuration
            </button>
            <button
              className={`working-day-tab ${
                activeTab === "calendar" ? "active" : ""
              }`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendar View
            </button>
          </div>
        </div>

        {activeTab === "configuration" ? (
          <form onSubmit={handleSubmit} className="working-day-form">
            <div className="working-day-section">
              <h3 className="working-day-section-title">Working Days</h3>
              <div className="working-day-checkbox-group">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <label key={day} className="working-day-checkbox-label">
                      <input
                        type="checkbox"
                        className="working-day-checkbox"
                        value={day}
                        checked={workingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWorkingDays([...workingDays, day]);
                          } else {
                            setWorkingDays(
                              workingDays.filter((d) => d !== day)
                            );
                          }
                        }}
                      />
                      <span className="working-day-checkbox-custom">{day}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="working-day-section">
              <h3 className="working-day-section-title">Timezone</h3>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="working-day-select"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div className="working-day-section">
              <h3 className="working-day-section-title">Shifts</h3>
              {shifts.map((shift, index) => (
                <div key={index} className="working-day-shift-row">
                  <input
                    placeholder="Shift Name"
                    className="working-day-input"
                    value={shift.name}
                    onChange={(e) =>
                      handleShiftChange(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="time"
                    className="working-day-input"
                    value={shift.startTime}
                    onChange={(e) =>
                      handleShiftChange(index, "startTime", e.target.value)
                    }
                  />
                  <input
                    type="time"
                    className="working-day-input"
                    value={shift.endTime}
                    onChange={(e) =>
                      handleShiftChange(index, "endTime", e.target.value)
                    }
                  />
                  <label className="working-day-checkbox-label">
                    <input
                      type="checkbox"
                      checked={shift.isActive}
                      onChange={(e) =>
                        handleShiftChange(index, "isActive", e.target.checked)
                      }
                    />
                    <span>Active</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeShift(index)}
                    className="working-day-remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addShift}
                className="working-day-add-button"
              >
                + Add Shift
              </button>
            </div>

            <div className="working-day-section">
              <h3 className="working-day-section-title">Holidays</h3>

              <div className="working-day-import-section">
                <h4>Import Holidays</h4>
                <div className="working-day-import-controls">
                  <select
                    value={fileImportType}
                    onChange={(e) => setFileImportType(e.target.value)}
                    className="working-day-select"
                  >
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                  <label className="working-day-file-input-label">
                    Choose File
                    <input
                      type="file"
                      accept={
                        fileImportType === "excel" ? ".xlsx,.xls" : ".csv"
                      }
                      onChange={handleFileImport}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="working-day-template-button"
                  >
                    Download Template
                  </button>
                </div>
                {importProgress && (
                  <div
                    className={`working-day-import-status ${importProgress.status}`}
                  >
                    {importProgress.message}
                  </div>
                )}
              </div>

              <div className="working-day-manual-entry">
                <h4>Add Holidays Manually</h4>
                {holidays.map((holiday, index) => (
                  <div key={index} className="working-day-holiday-row">
                    <input
                      type="date"
                      className="working-day-input"
                      value={
                        holiday.date
                          ? moment(holiday.date).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) => {
                        const newHolidays = [...holidays];
                        newHolidays[index].date = e.target.value;
                        setHolidays(newHolidays);
                      }}
                    />
                    <input
                      placeholder="Holiday Description"
                      className="working-day-input"
                      value={holiday.description}
                      onChange={(e) => {
                        const newHolidays = [...holidays];
                        newHolidays[index].description = e.target.value;
                        setHolidays(newHolidays);
                      }}
                    />
                    <label className="working-day-checkbox-label">
                      <input
                        type="checkbox"
                        checked={holiday.repeatsAnnually || false}
                        onChange={(e) => {
                          const newHolidays = [...holidays];
                          newHolidays[index].repeatsAnnually = e.target.checked;
                          setHolidays(newHolidays);
                        }}
                      />
                      <span>Repeats Annually</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeHoliday(index)}
                      className="working-day-remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHoliday}
                  className="working-day-add-button"
                >
                  + Add Holiday
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="working-day-submit-button">
                Save Configuration
              </button>
              <button
                type="button"
                onClick={handleDeleteConfig}
                className="working-day-delete-button"
              >
                Delete Configuration
              </button>
            </div>
          </form>
        ) : (
          <div className="working-day-calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              popup
              onSelectEvent={(event) => {
                alert(`${event.title}\n${moment(event.start).format("LL")}`);
              }}
            />
            <div className="working-day-legend">
              <div className="working-day-legend-item">
                <span className="working-day-legend-color working-day-festival"></span>
                <span>Festival</span>
              </div>
              <div className="working-day-legend-item">
                <span className="working-day-legend-color working-day-holiday"></span>
                <span>Public Holiday</span>
              </div>
              <div className="working-day-legend-item">
                <span className="working-day-legend-color working-day-custom-holiday"></span>
                <span>Your Holidays</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WorkingDay;
