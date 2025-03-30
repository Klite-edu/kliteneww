import { useState } from "react";
import DateRangeButton from "../DateRange/DateRangeButton.jsx";
import OpportunitiesHeader from "../OpportunitiesHeader/OpportunitiesHeader.jsx";
import LeadManagementView from "../LeadMangment/LeadmanagmentView.jsx";
import { Offcanvas, Button, Form } from "react-bootstrap";
import "./CRMDashboard.css";
import Sidebar from "../../../Sidebar/Sidebar.jsx";
import Navbar from "../../../Navbar/Navbar.jsx";

function CRMDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    leadSource: "",
    assignedTo: "",
    priority: "",
    sortOrder: "desc",
    dateRange: null,
  });
  const role = localStorage.getItem("role");
  const [customPermissions, setCustomPermissions] = useState(() => {
    const storedPermissions = localStorage.getItem("permissions");
    return storedPermissions ? JSON.parse(storedPermissions) : {};
  });

  const handleCloseFilters = () => setShowFilters(false);
  const handleShowFilters = () => setShowFilters(true);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateRangeChange = (range) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: range,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      leadSource: "",
      assignedTo: "",
      priority: "",
      sortOrder: "desc",
      dateRange: null,
    });
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="crm-app">
        {/* Filter Sidebar */}
        <Offcanvas
          show={showFilters}
          onHide={handleCloseFilters}
          placement="end"
          className="filter-sidebar"
        >
          <Offcanvas.Header closeButton className="filter-header">
            <Offcanvas.Title>Filters & Sorting</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="filter-body">
            <Form>
              <div className="filter-section">
                <h6 className="section-title">Sorting Options</h6>
                <Form.Select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="mb-4 filter-select"
                >
                  <option value="desc">Date Added (Newest First)</option>
                  <option value="asc">Date Added (Oldest First)</option>
                </Form.Select>

                <div className="date-range-section">
                  <h6 className="section-title">Date range</h6>
                  <DateRangeButton
                    onRangeChange={handleDateRangeChange}
                    selectedRange={filters.dateRange}
                  />
                </div>
              </div>

              <div className="filter-footer p-3 border-top d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={resetFilters}>
                  Reset All
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCloseFilters}
                  className=" apply-btn"
                >
                  Apply Filters
                </Button>
              </div>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="header-content d-flex justify-content-between">
              <OpportunitiesHeader />
              <div className="header-actions">
                <Button
                  variant="outline-primary"
                  onClick={handleShowFilters}
                  className="action-btn filter-btn"
                >
                  <i className="bi bi-funnel-fill me-2"></i> Filters
                </Button>

                <Button
                  variant="outline-primary"
                  className="action-btn tour-btn"
                >
                  <i className="bi bi-play-btn me-2"></i> Take a tour
                </Button>
              </div>
            </div>
          </div>

          <LeadManagementView filters={filters} />
        </div>
      </div>
    </>
  );
}

export default CRMDashboard;
