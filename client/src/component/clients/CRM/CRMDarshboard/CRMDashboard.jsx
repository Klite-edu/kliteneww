import { useEffect, useState } from "react";
import DateRangeButton from "../DateRange/DateRangeButton.jsx";
import OpportunitiesHeader from "../OpportunitiesHeader/OpportunitiesHeader.jsx";
import LeadManagementView from "../LeadMangment/LeadmanagmentView.jsx";
import { Offcanvas, Button, Form } from "react-bootstrap";
import "./CRMDashboard.css";
import Sidebar from "../../../Sidebar/Sidebar.jsx";
import Navbar from "../../../Navbar/Navbar.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function CRMDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sortOrder: "desc",
    dateRange: null,
  });
  const [customPermissions, setCustomPermissions] = useState({});
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(""); // yeh top pe add karo
  const navigate = useNavigate();
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Step 1: First get the token
        const tokenRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
          { withCredentials: true }
        );
        const userToken = tokenRes.data.token;

        if (!userToken) {
          console.error("Token not found");
          return;
        }
        setToken(userToken);

        // Step 2: Now fetch role and permissions using token
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
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [navigate]);

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
      sortOrder: "desc",
      dateRange: null,
    });
  };

  const applyFilters = () => {
    handleCloseFilters();
  };

  return (
    <>
      <Sidebar role={role} customPermissions={customPermissions} />
      <Navbar />
      <div className="crm-app">
        {/* Main Content */}
        <div className="dashboard-content">
          <div className="dashboard-header my-2">
            <div className="header-content d-flex align-items-center flex-wrap">
              <OpportunitiesHeader />
              <div className="d-flex justify-content-end">
                <Button onClick={handleShowFilters} className="me-2 d-flex">
                  <i className="bi bi-funnel-fill me-2"></i>Filters
                </Button>

                <Button className="">
                  <i className="bi bi-play-btn me-2 fw-bold"></i>Take a tour
                </Button>
              </div>
            </div>
          </div>

          <LeadManagementView
            filters={filters}
            token={token}
            role={role}
            customPermissions={customPermissions}
          />
        </div>

        {/* Filter Offcanvas */}
        <Offcanvas
          show={showFilters}
          onHide={handleCloseFilters}
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Filters</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            <Form>
              {/* Sort Order */}
              <Form.Group className="mb-3">
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </Form.Select>
              </Form.Group>

              {/* Date Range */}
              <Form.Group className="mb-4">
                <Form.Label>Date Range</Form.Label>
                <DateRangeButton
                  onDateRangeChange={handleDateRangeChange}
                  selectedRange={filters.dateRange}
                />
              </Form.Group>

              {/* Action Buttons */}
              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    </>
  );
}

export default CRMDashboard;
