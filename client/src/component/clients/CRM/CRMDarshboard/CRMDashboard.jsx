// import { useState } from "react";
// import DateRangeButton from "../DateRange/DateRangeButton.jsx";
// import OpportunitiesHeader from "../OpportunitiesHeader/OpportunitiesHeader.jsx";
// import LeadManagementView from "../LeadMangment/LeadmanagmentView.jsx";
// import { Offcanvas, Button, Form } from "react-bootstrap";
// import "./CRMDashboard.css";
// import Sidebar from "../../../Sidebar/Sidebar.jsx";
// import Navbar from "../../../Navbar/Navbar.jsx";

// function CRMDashboard() {
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState({
//     status: "",
//     leadSource: "",
//     assignedTo: "",
//     priority: "",
//     sortOrder: "desc",
//     dateRange: null,
//   });
//   const role = localStorage.getItem("role");
//   const [customPermissions, setCustomPermissions] = useState(() => {
//     const storedPermissions = localStorage.getItem("permissions");
//     return storedPermissions ? JSON.parse(storedPermissions) : {};
//   });

//   const handleCloseFilters = () => setShowFilters(false);
//   const handleShowFilters = () => setShowFilters(true);

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleDateRangeChange = (range) => {
//     setFilters((prev) => ({
//       ...prev,
//       dateRange: range,
//     }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       status: "",
//       leadSource: "",
//       assignedTo: "",
//       priority: "",
//       sortOrder: "desc",
//       dateRange: null,
//     });
//   };

//   return (
//     <>
//       <Sidebar role={role} customPermissions={customPermissions} />
//       <Navbar />
//       <div className="crm-app">
//         {/* Filter Sidebar */}
//         <Offcanvas
//           show={showFilters}
//           onHide={handleCloseFilters}
//           placement="end"
//           className="filter-sidebar"
//         >
//           <Offcanvas.Header closeButton className="filter-header">
//             <Offcanvas.Title>Filters & Sorting</Offcanvas.Title>
//           </Offcanvas.Header>
//           <Offcanvas.Body className="filter-body">
//             <Form>
//               <div className="filter-section">
//                 <h6 className="section-title">Sorting Options</h6>
//                 <Form.Select
//                   name="sortOrder"
//                   value={filters.sortOrder}
//                   onChange={handleFilterChange}
//                   className="mb-4 filter-select"
//                 >
//                   <option value="desc">Date Added (Newest First)</option>
//                   <option value="asc">Date Added (Oldest First)</option>
//                 </Form.Select>

//                 <div className="date-range-section">
//                   <h6 className="section-title">Date range</h6>
//                   <DateRangeButton
//                     onRangeChange={handleDateRangeChange}
//                     selectedRange={filters.dateRange}
//                   />
//                 </div>
//               </div>

//               <div className="filter-footer p-3 border-top d-flex justify-content-between">
//                 <Button variant="outline-secondary" onClick={resetFilters}>
//                   Reset All
//                 </Button>
//                 <Button
//                   variant="primary"
//                   onClick={handleCloseFilters}
//                   className=" apply-btn"
//                 >
//                   Apply Filters
//                 </Button>
//               </div>
//             </Form>
//           </Offcanvas.Body>
//         </Offcanvas>

//         {/* Main Content */}
//         <div className="dashboard-content">
//           <div className="dashboard-header">
//             <div className="header-content d-flex justify-content-between">
//               <OpportunitiesHeader />
//               <div className="header-actions">
//                 <Button
//                   variant="outline-primary"
//                   onClick={handleShowFilters}
//                   className="action-btn filter-btn"
//                 >
//                   <i className="bi bi-funnel-fill me-2"></i> Filters
//                 </Button>

//                 <Button
//                   variant="outline-primary"
//                   className="action-btn tour-btn"
//                 >
//                   <i className="bi bi-play-btn me-2"></i> Take a tour
//                 </Button>
//               </div>
//             </div>
//           </div>

//           <LeadManagementView filters={filters} />
//         </div>
//       </div>
//     </>
//   );
// }

// export default CRMDashboard;
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
  const navigate = useNavigate();
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch token, role, and permissions in parallel
        const [roleRes, permissionsRes] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-role`,
            { withCredentials: true }
          ),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/permission/get-permissions`,
            { withCredentials: true }
          ),
        ]);
        const userRole = roleRes.data.role;
        const userPermissions = permissionsRes.data.permissions || {};

        if (!userRole) {
          navigate("/");
          return;
        }
        setRole(userRole);
        setCustomPermissions(userPermissions);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        navigate("/");
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

          <LeadManagementView filters={filters} />
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
