document.addEventListener('DOMContentLoaded', () => {
    // No API Key is needed in the client-side code anymore.
    // It will be handled securely by the serverless function.

    const incidentsContainer = document.getElementById('incidents-container');
    const imagesContainer = document.getElementById('images-container');
    const faultyLightsContainer = document.getElementById('faulty-lights-container');
    const lastUpdatedSpan = document.getElementById('last-updated');

    /**
     * Fetches data from the LTA DataMall via our own Vercel proxy.
     * @param {string} endpoint - The LTA API endpoint to fetch (e.g., '/TrafficIncidents').
     * @returns {Promise<Object|null>} The JSON data from the API, or null if an error occurred.
     */
    const fetchLTAData = async (endpoint) => {
        // The new URL points to our own serverless function proxy.
        // We pass the target LTA endpoint as a query parameter.
        const proxyUrl = `/api/proxy?endpoint=${endpoint}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                // Log the error for debugging but don't stop the other sections from loading.
                console.error(`Error from proxy for ${endpoint}: ${response.status} ${response.statusText}`);
                const errorData = await response.json();
                console.error('Error details:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from endpoint: ${endpoint}`, error);
            return null; // Return null to allow other parts of the app to function.
        }
    };

    /**
     * Fetches and displays traffic incidents.
     */
    const displayTrafficIncidents = async () => {
        incidentsContainer.innerHTML = '<p>Loading traffic incidents...</p>';
        const data = await fetchLTAData('/TrafficIncidents');
        if (data && data.value && data.value.length > 0) {
            incidentsContainer.innerHTML = '';
            data.value.forEach(incident => {
                const incidentDiv = document.createElement('div');
                incidentDiv.classList.add('incident-item');
                incidentDiv.innerHTML = `
                    <p><strong>Type:</strong> ${incident.Type}</p>
                    <p><strong>Message:</strong> ${incident.Message}</p>
                    <p><strong>Location:</strong> Lat ${incident.Latitude}, Lon ${incident.Longitude}</p>
                `;
                incidentsContainer.appendChild(incidentDiv);
            });
        } else {
            incidentsContainer.innerHTML = '<p>No traffic incidents reported. All clear! ✨</p>';
        }
    };

    /**
     * Fetches and displays live traffic images.
     */
    const displayTrafficImages = async () => {
        imagesContainer.innerHTML = '<p>Loading live traffic images...</p>';
        const data = await fetchLTAData('/Traffic-Imagesv2');
        if (data && data.value && data.value.length > 0) {
            imagesContainer.innerHTML = '';
            // To avoid overwhelming the page, let's show a random subset of cameras
            const shuffled = data.value.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 20); // Show up to 20 images

            selected.forEach(image => {
                const imageDiv = document.createElement('div');
                imageDiv.classList.add('image-item');
                imageDiv.innerHTML = `
                    <img src="${image.ImageLink}" alt="Traffic Camera ${image.CameraID}" loading="lazy">
                    <p><strong>Camera ID:</strong> ${image.CameraID}</p>
                `;
                imagesContainer.appendChild(imageDiv);
            });
        } else {
            imagesContainer.innerHTML = '<p>No live traffic images available. 🚧</p>';
        }
    };

    /**
     * Fetches and displays faulty traffic lights.
     */
    const displayFaultyTrafficLights = async () => {
        faultyLightsContainer.innerHTML = '<p>Loading faulty traffic light data...</p>';
        const data = await fetchLTAData('/FaultyTrafficLights');
        if (data && data.value && data.value.length > 0) {
            faultyLightsContainer.innerHTML = '';
            data.value.forEach(light => {
                const faultyLightDiv = document.createElement('div');
                faultyLightDiv.classList.add('faulty-light-item');
                // Updated to show the descriptive message from the API
                faultyLightDiv.innerHTML = `
                    <p><strong>Details:</strong> ${light.Message}</p>
                    <p><strong>Reported on:</strong> ${new Date(light.StartDate).toLocaleString()}</p>
                `;
                faultyLightsContainer.appendChild(faultyLightDiv);
            });
        } else {
            faultyLightsContainer.innerHTML = '<p>No faulty traffic lights reported. 🟢</p>';
        }
    };

    /**
     * Calls all data-fetching functions to populate the page.
     */
    const updateAllData = () => {
        displayTrafficIncidents();
        displayTrafficImages();
        // The call to displayTrafficSpeedBands() has been removed.
        displayFaultyTrafficLights();
        lastUpdatedSpan.textContent = new Date().toLocaleString();
    };

    // Initial load
    updateAllData();

    // Refresh data every 5 minutes (300,000 milliseconds)
    setInterval(updateAllData, 300000);
});
