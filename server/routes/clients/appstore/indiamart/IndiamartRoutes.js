const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/fetch-crm', async (req, res) => {
    const { crmKey } = req.body;

    // Set the date range: last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    // Format dates as DD-MM-YYYY HH:MM:SS
    const formattedStartDate = `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()} 00:00:00`;
    const formattedEndDate = `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()} 23:59:59`;

    // Construct the API URL
    const url = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${crmKey}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`;

    try {
        // Fetch CRM data from the API
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching CRM data:', error.message);
        res.status(500).json({ error: 'Failed to fetch CRM data' });
    }
});

module.exports = router;
