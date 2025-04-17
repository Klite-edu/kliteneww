import React, { useState, useEffect, useCallback, useRef } from 'react';
import './issuedashboard.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const IssueDashboard = () => {
    const [filters, setFilters] = useState({
        priority: '',
        status: [],
        assignee: '',
        dateRange: { start: '', end: '' },
        category: [],
        searchQuery: ''
    });

    const [token, setToken] = useState("");
    const [role, setRole] = useState("");
    const [customPermissions, setCustomPermissions] = useState({});
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [sortOption, setSortOption] = useState('newest');
    const [viewMode, setViewMode] = useState('card');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const navigate = useNavigate();
    const fetchIssuesRef = useRef(() => { });

    const showAlert = useCallback((message, type = "info") => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    }, []);

    const fetchIssues = useCallback(async (activeToken) => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/ticketRaise/viewAll`,
                {
                    headers: { Authorization: `Bearer ${activeToken}` },
                    withCredentials: true,
                }
            );
            const formattedIssues = response.data.map(issue => ({
                id: issue._id,
                title: issue.title,
                priority: issue.priority.toLowerCase(),
                status: issue.status.toLowerCase(),
                assignee: issue.employeeName,
                date: new Date(issue.createdAt),
                category: 'task'
            }));
            setIssues(formattedIssues);
            setFilteredIssues(formattedIssues);
        } catch (error) {
            console.error("Failed to fetch issues:", error);
            showAlert("Failed to fetch issues", "error");
            setIssues([]);
            setFilteredIssues([]);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    fetchIssuesRef.current = () => fetchIssues(token);

    const completeTask = useCallback(async (taskId) => {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/ticketRaise/resolve/${taskId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );
            console.log(`response.data - `, response.data);
            showAlert("Task marked as completed", "success");
            fetchIssuesRef.current();
        } catch (error) {
            console.error("Error completing task:", error);
            showAlert("Error completing task", "error");
        }
    }, [token, showAlert]);

    const fetchInitialData = useCallback(async () => {
        try {
            const [tokenRes, roleRes, permissionsRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-token`, { withCredentials: true }),
                axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-role`, { withCredentials: true }),
                axios.get(`${process.env.REACT_APP_API_URL}/api/permission/get-permissions`, { withCredentials: true }),
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

            await fetchIssues(userToken);
        } catch (error) {
            console.error("Error fetching initial data:", error);
            navigate("/login");
        }
    }, [navigate, fetchIssues]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        applyFilters();
    }, [filters, issues, sortOption]);

    const applyFilters = useCallback(() => {
        let result = [...issues];

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                (issue.assignee && issue.assignee.toLowerCase().includes(query))
            );
        }

        if (filters.priority) {
            result = result.filter(issue => issue.priority === filters.priority);
        }

        if (filters.status.length > 0) {
            result = result.filter(issue => filters.status.includes(issue.status));
        }

        if (filters.assignee) {
            const query = filters.assignee.toLowerCase();
            result = result.filter(issue =>
                issue.assignee && issue.assignee.toLowerCase().includes(query)
            );
        }

        if (filters.dateRange.start) {
            result = result.filter(issue => issue.date >= new Date(filters.dateRange.start));
        }
        if (filters.dateRange.end) {
            result = result.filter(issue => issue.date <= new Date(filters.dateRange.end));
        }

        if (filters.category.length > 0) {
            result = result.filter(issue => filters.category.includes(issue.category));
        }

        result = sortIssues(result, sortOption);
        setFilteredIssues(result);
    }, [filters, issues, sortOption]);

    const sortIssues = (issuesToSort, option) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        switch (option) {
            case 'newest':
                return [...issuesToSort].sort((a, b) => b.date - a.date);
            case 'oldest':
                return [...issuesToSort].sort((a, b) => a.date - b.date);
            case 'priority-high':
                return [...issuesToSort].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            case 'priority-low':
                return [...issuesToSort].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            default:
                return issuesToSort;
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFilters(prev => ({
                ...prev,
                [name]: checked ? [...prev[name], value] : prev[name].filter(item => item !== value)
            }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [name]: value }
        }));
    };

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    };

    const resetFilters = () => {
        setFilters({
            priority: '',
            status: [],
            assignee: '',
            dateRange: { start: '', end: '' },
            category: [],
            searchQuery: ''
        });
    };

    const handleSortChange = (e) => {
        setSortOption(e.target.value);
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'card' ? 'list' : 'card');
    };

    const toggleMobileFilter = () => {
        setIsMobileFilterOpen(!isMobileFilterOpen);
    };

    if (isLoading) {
        return <div className="loading">Loading issues...</div>;
    }

    console.log(`filteredIssues - `, filteredIssues);
    
    return (
        <div className="dashboard-container">
            {alert && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <header className="dashboard-header">
                <h1>Issue Dashboard</h1>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={filters.searchQuery}
                        onChange={handleSearch}
                    />
                    <button className="mobile-filter-toggle" onClick={toggleMobileFilter}>
                        <span className="filter-icon">☰</span>
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="issues-list">
                    <div className="list-controls">
                        <div className="list-control-left">
                            <select value={sortOption} onChange={handleSortChange}>
                                <option value="newest">Sort by: Newest</option>
                                <option value="oldest">Sort by: Oldest</option>
                                <option value="priority-high">Sort by: Priority (High-Low)</option>
                                <option value="priority-low">Sort by: Priority (Low-High)</option>
                            </select>
                        </div>
                        <div className="list-control-right">
                            <button className={`view-toggle ${viewMode === 'card' ? 'active' : ''}`} onClick={toggleViewMode}>
                                {viewMode === 'card' ? 'List View' : 'Card View'}
                            </button>
                            <span className="results-count">{filteredIssues.length} issues</span>
                        </div>
                    </div>

                    {filteredIssues.length === 0 ? (
                        <div className="no-results">
                            <p>No issues match your current filters</p>
                            <button onClick={resetFilters}>Reset Filters</button>
                        </div>
                    ) : (
                        <div className={`issues-container ${viewMode}`}>
                            {filteredIssues.map(issue => (
                                <div key={issue.id} className={`issue-item ${viewMode}`}>
                                    <div className="issue-header">
                                        <span className={`priority ${issue.priority}`}>{issue.priority}</span>
                                        <h3 className="issue-title">{issue.title}</h3>
                                        <span className={`status ${issue.status.replace('-', '')}`}>
                                            {issue.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                    <div className="issue-details">
                                        <span className="issue-assignee">👤 {issue.assignee}</span>
                                        <span className="issue-date">📅 {issue.date.toLocaleDateString()}</span>
                                        <span className={`category ${issue.category}`}>{issue.category}</span>
                                    </div>
                                    {issue.status === 'pending' && (
                                        <div className="issue-actions">
                                            <button className="complete-btn" onClick={() => completeTask(issue.id)}>
                                                Complete Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`filter-panel ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="filter-header">
                        <h2>Filters</h2>
                        <button className="close-filters" onClick={toggleMobileFilter}>✕</button>
                    </div>

                    <div className="filter-section">
                        <h3>Priority</h3>
                        <select name="priority" value={filters.priority} onChange={handleFilterChange} className="filter-select">
                            <option value="">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div className="filter-section">
                        <h3>Status</h3>
                        <div className="checkbox-group">
                            {['pending', 'resolved'].map(status => (
                                <div key={status} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        id={`status-${status}`}
                                        name="status"
                                        value={status}
                                        checked={filters.status.includes(status)}
                                        onChange={handleFilterChange}
                                    />
                                    <label htmlFor={`status-${status}`}>{status.replace('-', ' ')}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Doer</h3>
                        <input
                            type="text"
                            name="assignee"
                            placeholder="Search Doer..."
                            value={filters.assignee}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-section">
                        <h3>Date Range</h3>
                        <div className="date-inputs">
                            <div className="date-field">
                                <label>From:</label>
                                <input
                                    type="date"
                                    name="start"
                                    value={filters.dateRange.start}
                                    onChange={handleDateRangeChange}
                                    className="date-input"
                                />
                            </div>
                            <div className="date-field">
                                <label>To:</label>
                                <input
                                    type="date"
                                    name="end"
                                    value={filters.dateRange.end}
                                    onChange={handleDateRangeChange}
                                    className="date-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="filter-actions">
                        <button className="reset-btn" onClick={resetFilters}>Reset Filters</button>
                        <button className="apply-btn">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDashboard;
