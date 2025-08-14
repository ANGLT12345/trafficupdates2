document.addEventListener('DOMContentLoaded', () => {
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
        const proxyUrl = `/api/proxy?endpoint=${endpoint}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.error(`Error from proxy for ${endpoint}: ${response.status} ${response.statusText}`);
                const errorData = await response.json();
                console.error('Error details:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from endpoint: ${endpoint}`, error);
            return null;
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
     * Fetches and displays live traffic images from checkpoints.
     */
    const displayTrafficImages = async () => {
        imagesContainer.innerHTML = '<p>Loading checkpoint traffic images...</p>';
        
        // Define the camera IDs for Woodlands and Tuas checkpoints
        const checkpointCameraIDs = [
            "2701", "2702", "4703", "4701", "4713", "4702", "4712", "4714", "4715", "4716", "4717", "4718", "4719"
        ];

        const data = await fetchLTAData('/Traffic-Imagesv2');
        if (data && data.value && data.value.length > 0) {
            // Filter the cameras to only include the ones from our list
            const checkpointCameras = data.value.filter(camera => checkpointCameraIDs.includes(camera.CameraID));

            if (checkpointCameras.length > 0) {
                imagesContainer.innerHTML = '';
                checkpointCameras.forEach(image => {
                    const imageDiv = document.createElement('div');
                    imageDiv.classList.add('image-item');
                    
                    // Extract the time from the CreateDate string
                    const updateTime = new Date(image.CreateDate).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true });

                    imageDiv.innerHTML = `
                        <img src="${image.ImageLink}" alt="Traffic Camera ${image.CameraID}" loading="lazy">
                        <p><strong>Camera ID:</strong> ${image.CameraID}</p>
                        <p><strong>Updated:</strong> ${updateTime}</p>
                    `;
                    imagesContainer.appendChild(imageDiv);
                });
            } else {
                imagesContainer.innerHTML = '<p>Could not find checkpoint camera data. 🚧</p>';
            }
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
        displayFaultyTrafficLights();
        lastUpdatedSpan.textContent = new Date().toLocaleString();
    };

    // --- NEW CODE FOR ACCORDION ---
    // Get all the <details> elements
    const detailsElements = document.querySelectorAll('details.data-section');

    detailsElements.forEach(details => {
        // Add an event listener for the 'toggle' event
        details.addEventListener('toggle', event => {
            // If the section was opened...
            if (details.open) {
                // ...loop through all sections again...
                detailsElements.forEach(otherDetails => {
                    // ...and if it's not the one that was just opened...
                    if (otherDetails !== details) {
                        // ...close it.
                        otherDetails.open = false;
                    }
                });
            }
        });
    });
    // --- END OF NEW CODE ---

    // Initial load
    updateAllData();

    // Refresh data every 5 minutes (300,000 milliseconds)
    setInterval(updateAllData, 300000);
});
