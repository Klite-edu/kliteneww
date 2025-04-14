import React, { useState, useEffect, useRef } from 'react';
import './indiamart.css';

const IndiaMart = () => {
  const [activeTab, setActiveTab] = useState('Business');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formData, setFormData] = useState({ Token: "" });
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef(null);

  const businessApps = [
    {
      id: 1,
      name: 'IndiaMart CRM',
      category: 'B2B Marketplace',
      description: 'Connect with Indian suppliers and buyers with the largest online B2B marketplace in India.',
      icon: 'https://logo.clearbit.com/indiamart.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: true,
      enabled: true,
      featured: true,
      color: '#FF6B00',
      requiresToken: true
    },
    {
      id: 2,
      name: 'Facebook Business',
      category: 'Marketing',
      description: 'Manage your business presence on Facebook and reach millions of potential customers.',
      icon: 'https://logo.clearbit.com/facebook.com',
      ageRating: '12+',
      price: 'Free',
      inAppPurchases: true,
      enabled: false,
      color: '#1877F2'
    },
    {
      id: 3,
      name: 'LinkedIn Business',
      category: 'Professional Networking',
      description: 'Grow your professional network and connect with industry leaders worldwide.',
      icon: 'https://logo.clearbit.com/linkedin.com',
      ageRating: '12+',
      price: 'Free',
      inAppPurchases: true,
      enabled: false,
      color: '#0A66C2'
    },
    {
      id: 4,
      name: 'Shopify',
      category: 'E-commerce',
      description: 'Create your online store with the most powerful e-commerce platform for businesses of all sizes.',
      icon: 'https://logo.clearbit.com/shopify.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: true,
      enabled: false,
      color: '#5E8E3E'
    },
    {
      id: 5,
      name: 'Google My Business',
      category: 'Local Marketing',
      description: 'Manage your business listing on Google Search and Maps to attract more customers.',
      icon: 'https://logo.clearbit.com/google.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: false,
      enabled: false,
      color: '#4285F4'
    },
    {
      id: 6,
      name: 'WhatsApp Business',
      category: 'Communication',
      description: 'Connect with your customers easily using tools to automate, sort and quickly respond to messages.',
      icon: 'https://logo.clearbit.com/whatsapp.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: false,
      enabled: false,
      color: '#25D366'
    },
    {
      id: 7,
      name: 'Amazon Seller',
      category: 'E-commerce',
      description: 'Manage your Amazon seller account and grow your business on the largest online marketplace.',
      icon: 'https://logo.clearbit.com/amazon.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: true,
      enabled: false,
      color: '#FF9900'
    },
    {
      id: 8,
      name: 'Zoho CRM',
      category: 'Customer Relationship',
      description: 'Manage your customer relationships, sales pipeline, and marketing campaigns in one place.',
      icon: 'https://logo.clearbit.com/zoho.com',
      ageRating: '4+',
      price: 'Free',
      inAppPurchases: true,
      enabled: false,
      color: '#F44336'
    }
  ];

  const fetchCrmData = async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/store/fetch-crm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crmKey: token,
        }),
      });

      const data = await response.json();
      console.log("data", data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCachedCrmData = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/store/get-cached-crm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crmKey: token,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'No cached data available');
      }

      return data;
    } catch (err) {
      console.error('Error getting cached data:', err.message);
      return null;
    }
  };

  useEffect(() => {
    if (autoRefresh && crmData) {
      const refreshData = async () => {
        try {
          const newData = await fetchCrmData(formData.Token);
          setCrmData(newData);
        } catch (err) {
          console.error('Error during auto-refresh:', err.message);
        }
      };

      refreshIntervalRef.current = setInterval(refreshData, 5 * 60 * 1000);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, crmData, formData.Token]);

  const handleGetClick = (app) => {
    if (app.enabled) {
      setSelectedApp(app);
      if (app.requiresToken) {
        setShowForm(true);
      } else {
        alert(`${app.name} is ready to use!`);
      }
    } else {
      alert(`${app.name} is coming soon! We're working to integrate this service. Currently only IndiaMart CRM is available for data fetching.`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = await fetchCrmData(formData.Token);
      
      setCrmData(data);
      console.log(data);
      
      setShowForm(false);
      setFormData({ Token: "" });
      
    } catch (err) {
      // Error already set by fetchCrmData
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBackToApps = async () => {
    if (formData.Token) {
      const cachedData = await getCachedCrmData(formData.Token);
      if (cachedData) {
        setCrmData(cachedData);
      }
    }
    setCrmData(null);
  };

  const filteredApps = businessApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const AppCard = ({ app }) => (
    <div className={`appStore-app-card ${app.featured ? 'appStore-featured' : ''}`}
         style={{ borderTop: `4px solid ${app.color || '#0070f3'}` }}>
      {app.featured && <div className="appStore-featured-badge">Featured</div>}
      <div className="appStore-app-icon-container">
        <img 
          src={app.icon} 
          alt={app.name} 
          className="appStore-app-icon" 
          onError={(e) => e.target.src = 'https://via.placeholder.com/100'} 
        />
      </div>
      <div className="appStore-app-info">
        <h3>{app.name}</h3>
        <p className="appStore-category">{app.category}</p>
        <p className="appStore-description">{app.description}</p>
        <div className="appStore-meta">
          <span className="appStore-age">{app.ageRating}</span>
          <span>•</span>
          <span className={`appStore-price ${app.price === 'Free' ? 'appStore-free' : ''}`}>
            {app.price}{app.inAppPurchases ? ' + In-app purchases' : ''}
          </span>
        </div>
        <button 
          className={`appStore-download-btn ${app.enabled ? '' : 'appStore-disabled-btn'}`}
          onClick={() => handleGetClick(app)}
        >
          {app.enabled ? (
            <>
              <span>Get</span>
              {app.price !== 'Free' && <span className="appStore-price-badge">{app.price}</span>}
            </>
          ) : 'Coming Soon'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="appStore-app-store">
      <div className="appStore-fixed-header">
        <header className="appStore-header">
          <div className="appStore-header-content">
            <h1>Business App Store</h1>
            <p className="appStore-subtitle">Boost your business with powerful tools</p>
          </div>
          <div className="appStore-search-container">
            <i className="bi bi-search appStore-search-icon"></i>
            <input 
              type="text" 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
      </div>

      <div className="appStore-scrollable-content">
        {crmData ? (
          <div className="appStore-crm-results">
            <div className="appStore-crm-header">
              <h2>
                <button onClick={handleBackToApps} className="appStore-back-btn">
                  ← Back to Apps
                </button>
                IndiaMart CRM Data
              </h2>
              <div className="appStore-crm-controls">
                <div className="appStore-crm-stats">
                  <span>Total Leads: {crmData.count}</span>
                  <span>Last Updated: {new Date(crmData.timestamp || Date.now()).toLocaleString()}</span>
                </div>
                <label className="appStore-auto-refresh">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                  />
                  Auto-refresh every 5 minutes
                </label>
                <button 
                  className="appStore-refresh-btn"
                  onClick={async () => {
                    try {
                      const newData = await fetchCrmData(formData.Token);
                      setCrmData(newData);
                    } catch (err) {
                      console.error('Error refreshing data:', err.message);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh Now'}
                </button>
              </div>
            </div>
            
            <div className="appStore-crm-data">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Product</th>
                    <th>Query</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {crmData.results.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.company}</td>
                      <td>
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      <td>{lead.product}</td>
                      <td className="appStore-query">{lead.query}</td>
                      <td>{new Date(lead.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <main className="appStore-app-list">
            {filteredApps.length > 0 ? (
              <>
                <h2 className="appStore-section-title">{activeTab} Apps</h2>
                <div className="appStore-app-grid">
                  {filteredApps.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              </>
            ) : (
              <div className="appStore-no-results">
                <div className="appStore-no-results-icon">
                  <i className="bi bi-search"></i>
                </div>
                <h3>No apps found</h3>
                <p>We couldn't find any apps matching "{searchQuery}"</p>
                <button 
                  className="appStore-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              </div>
            )}
          </main>
        )}
      </div>

      {showForm && (
        <div className="appStore-modal-overlay" onClick={() => !loading && setShowForm(false)}>
          <div className="appStore-modal" onClick={(e) => e.stopPropagation()}>
            <div className="appStore-modal-header">
              <div>
                <h2>Connect {selectedApp?.name}</h2>
                <p className="appStore-modal-subtitle">Enter your IndiaMart CRM key to fetch your leads</p>
              </div>
              {!loading && (
                <button 
                  className="appStore-modal-close"
                  onClick={() => setShowForm(false)}
                >
                  &times;
                </button>
              )}
            </div>
            
            <form onSubmit={handleFormSubmit} className="appStore-form">
              {error && <div className="appStore-error">{error}</div>}
              
              <div className="appStore-form-group">
                <label htmlFor="Token">CRM Key</label>
                <input
                  type="password"
                  id="Token"
                  name="Token"
                  value={formData.Token}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your IndiaMart CRM key"
                  disabled={loading}
                />
                <p className="appStore-form-hint">
                  Find your CRM key in your IndiaMart account settings
                </p>
              </div>
              
              <div className="appStore-form-actions">
                <button 
                  type="button" 
                  className="appStore-cancel-btn"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="appStore-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="appStore-spinner"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect to IndiaMart
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaMart;