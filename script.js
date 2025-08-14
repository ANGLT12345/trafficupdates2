document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'VROVFNeMSI+qIQ4o/OLuNw=='; // Your API Key
    const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

    const incidentsContainer = document.getElementById('incidents-container');
    const imagesContainer = document.getElementById('images-container');
    const speedBandsContainer = document.getElementById('speed-bands-container');
    const faultyLightsContainer = document.getElementById('faulty-lights-container');
    const lastUpdatedSpan = document.getElementById('last-updated');

    const fetchLTAData = async (endpoint) => {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'AccountKey': API_KEY,
                    'accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            return null;
        }
    };

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

    const displayTrafficImages = async () => {
        imagesContainer.innerHTML = '<p>Loading live traffic images...</p>';
        const data = await fetchLTAData('/Traffic-Imagesv2');
        if (data && data.value && data.value.length > 0) {
            imagesContainer.innerHTML = '';
            data.value.forEach(image => {
                const imageDiv = document.createElement('div');
                imageDiv.classList.add('image-item');
                imageDiv.innerHTML = `
                    <img src="${image.ImageLink}" alt="Traffic Camera ${image.CameraID}">
                    <p><strong>Camera ID:</strong> ${image.CameraID}</p>
                    <p><strong>Location:</strong> Lat ${image.Latitude}, Lon ${image.Longitude}</p>
                `;
                imagesContainer.appendChild(imageDiv);
            });
        } else {
            imagesContainer.innerHTML = '<p>No live traffic images available. 🚧</p>';
        }
    };

    const displayTrafficSpeedBands = async () => {
        speedBandsContainer.innerHTML = '<p>Loading traffic speed bands...</p>';
        const data = await fetchLTAData('/v4/TrafficSpeedBands');
        if (data && data.value && data.value.length > 0) {
            speedBandsContainer.innerHTML = '';
            data.value.forEach(band => {
                const speedBandDiv = document.createElement('div');
                speedBandDiv.classList.add('speed-band-item');
                speedBandDiv.innerHTML = `
                    <p><strong>Road:</strong> ${band.RoadName} (ID: ${band.LinkID})</p>
                    <p><strong>Category:</strong> ${band.RoadCategory}</p>
                    <p><strong>Speed:</strong> ${band.MinimumSpeed}-${band.MaximumSpeed} km/h (Band: ${band.SpeedBand})</p>
                    <p><strong>Location:</strong> Start Lat ${band.StartLat}, Start Lon ${band.StartLon} | End Lat ${band.EndLat}, End Lon ${band.EndLon}</p>
                `;
                speedBandsContainer.appendChild(speedBandDiv);
            });
        } else {
            speedBandsContainer.innerHTML = '<p>No traffic speed band data available. 🏎️</p>';
        }
    };

    const displayFaultyTrafficLights = async () => {
        faultyLightsContainer.innerHTML = '<p>Loading faulty traffic light data...</p>';
        const data = await fetchLTAData('/FaultyTrafficLights');
        if (data && data.value && data.value.length > 0) {
            faultyLightsContainer.innerHTML = '';
            data.value.forEach(light => {
                const faultyLightDiv = document.createElement('div');
                faultyLightDiv.classList.add('faulty-light-item');
                faultyLightDiv.innerHTML = `
                    <p><strong>Alarm ID:</strong> ${light.AlarmID}</p>
                    <p><strong>Node ID:</strong> ${light.NodeID}</p>
                    <p><strong>Type:</strong> ${light.Type === 4 ? 'Blackout' : (light.Type === 13 ? 'Flashing Yellow' : light.Type)}</p>
                    <p><strong>Message:</strong> ${light.Message}</p>
                    <p><strong>Start Date:</strong> ${light.StartDate}</p>
                    ${light.EndDate ? `<p><strong>End Date:</strong> ${light.EndDate}</p>` : ''}
                `;
                faultyLightsContainer.appendChild(faultyLightDiv);
            });
        } else {
            faultyLightsContainer.innerHTML = '<p>No faulty traffic lights reported. 🟢</p>';
        }
    };

    const updateAllData = () => {
        displayTrafficIncidents();
        displayTrafficImages();
        displayTrafficSpeedBands();
        displayFaultyTrafficLights();
        lastUpdatedSpan.textContent = new Date().toLocaleString();
    };

    // Initial load
    updateAllData();

    // Refresh data every 5 minutes (300,000 milliseconds)
    setInterval(updateAllData, 300000);
});