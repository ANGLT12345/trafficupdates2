// /api/proxy.js

// Use CommonJS syntax (module.exports) for maximum compatibility with Vercel's Node.js runtime.
module.exports = async (req, res) => {
    // Get the target LTA API endpoint from the query parameters.
    // For example, if the request is /api/proxy?endpoint=/TrafficIncidents, `endpoint` will be '/TrafficIncidents'.
    const { endpoint } = req.query;

    // If the endpoint is missing in the request, return an error.
    if (!endpoint) {
        return res.status(400).json({ message: 'Error: The "endpoint" query parameter is required.' });
    }

    // Retrieve the API key from the Vercel environment variables you set up.
    const API_KEY = process.env.LTA_API_KEY;

    // If the API key is not configured on the server, return an error.
    // This helps in debugging if you forget to set the environment variable.
    if (!API_KEY) {
        return res.status(500).json({ message: 'Error: The LTA_API_KEY is not configured on the server.' });
    }

    const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';
    const fullApiUrl = `${BASE_URL}${endpoint}`;

    try {
        // The server (this function) makes the request to the LTA API.
        // This bypasses the browser's CORS issue.
        const apiResponse = await fetch(fullApiUrl, {
            method: 'GET',
            headers: {
                'AccountKey': API_KEY,
                'accept': 'application/json'
            }
        });

        // If the response from the LTA API is not OK (e.g., 404, 401, 500),
        // forward the error back to your front-end.
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            return res.status(apiResponse.status).json({
                message: `Error from LTA API: ${apiResponse.statusText}`,
                details: errorText
            });
        }

        // If the request was successful, parse the JSON data.
        const data = await apiResponse.json();

        // Send the data from the LTA API back to your front-end (script.js).
        res.status(200).json(data);

    } catch (error) {
        // Catch any other errors, like network issues.
        console.error('Proxy function error:', error);
        res.status(500).json({ message: 'An internal server error occurred in the proxy.', details: error.message });
    }
};
