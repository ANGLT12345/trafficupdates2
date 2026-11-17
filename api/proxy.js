// /api/proxy.js
//
// Server-side proxy for LTA DataMall so the AccountKey never reaches the browser.
//
// Security notes:
//  - Only the endpoints the front-end actually uses are allowed. Anything else
//    is rejected, so the proxy cannot be used by third parties to spend your
//    LTA quota on arbitrary DataMall datasets or to probe other paths.
//  - Only GET is accepted.
//  - Upstream error bodies and internal error messages are NOT echoed back to
//    the client (they are logged server-side instead).

const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

// Exact-match allowlist of DataMall endpoints used by script.js.
const ALLOWED_ENDPOINTS = new Set([
    '/VMS',
    '/TrainServiceAlerts',
    '/TrafficIncidents',
    '/FaultyTrafficLights',
    '/Traffic-Imagesv2'
]);

// Short shared cache so repeated page loads don't each hit LTA.
// Traffic camera links expire after ~5 minutes, so keep this well below that.
const CACHE_SECONDS = 60;

module.exports = async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method not allowed.' });
    }

    const endpoint = Array.isArray(req.query.endpoint) ? req.query.endpoint[0] : req.query.endpoint;

    if (typeof endpoint !== 'string' || !ALLOWED_ENDPOINTS.has(endpoint)) {
        return res.status(400).json({ message: 'Unknown or missing endpoint.' });
    }

    const API_KEY = process.env.LTA_API_KEY;
    if (!API_KEY) {
        console.error('LTA_API_KEY is not configured.');
        return res.status(500).json({ message: 'Proxy is not configured.' });
    }

    try {
        const apiResponse = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'AccountKey': API_KEY,
                'accept': 'application/json'
            },
            redirect: 'error',
            signal: AbortSignal.timeout(10000)
        });

        if (!apiResponse.ok) {
            console.error(`LTA API ${endpoint} responded ${apiResponse.status}`);
            return res.status(502).json({ message: 'Upstream service error.' });
        }

        const data = await apiResponse.json();

        res.setHeader('Cache-Control', `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy function error:', error);
        return res.status(502).json({ message: 'Upstream service unavailable.' });
    }
};
