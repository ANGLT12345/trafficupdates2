document.addEventListener('DOMContentLoaded', () => {
    const incidentsContainer = document.getElementById('incidents-container');
    const imagesContainer = document.getElementById('images-container');
    const weatherContainer = document.getElementById('weather-forecast-container');
    const lastUpdatedSpan = document.getElementById('last-updated');

    const fetchLTAData = async (endpoint) => {
        const proxyUrl = `/api/proxy?endpoint=${endpoint}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.error(`Error from proxy for ${endpoint}: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from endpoint: ${endpoint}`, error);
            return null;
        }
    };

    const displayTrafficIncidents = async () => {
        incidentsContainer.innerHTML = '<p>Loading all incidents...</p>';

        const incidentIcons = {
            'Accident': 'https://img.icons8.com/office/40/car-crash.png',
            'Roadwork': 'https://img.icons8.com/office/40/road-worker.png',
            'Vehicle breakdown': 'https://img.icons8.com/office/40/tow-truck.png',
            'Weather': 'https://img.icons8.com/office/40/partly-cloudy-day.png',
            'Obstacle': 'https://img.icons8.com/office/40/traffic-cone.png',
            'Road Block': 'https://img.icons8.com/office/40/road-barrier.png',
            'Heavy Traffic': 'https://img.icons8.com/office/40/traffic-jam.png',
            'Miscellaneous': 'https://img.icons8.com/office/40/info.png',
            'Diversion': 'https://img.icons8.com/office/40/waypoint-map.png',
            'Unattended Vehicle': 'https://img.icons8.com/office/40/parking.png',
            'Fire': 'https://img.icons8.com/office/40/fire-element.png',
            'Plant Failure': 'https://img.icons8.com/office/40/factory-breakdown.png',
            'Reverse Flow': 'https://img.icons8.com/office/40/u-turn-sign.png',
            'Blackout': 'https://img.icons8.com/office/40/shutdown.png',
            'Faulty Light': 'https://img.icons8.com/office/40/traffic-light.png'
        };
        const defaultIcon = 'https://img.icons8.com/office/40/info.png';

        const [incidentsData, faultyLightsData] = await Promise.all([
            fetchLTAData('/TrafficIncidents'),
            fetchLTAData('/FaultyTrafficLights')
        ]);

        let allIncidents = [];
        if (incidentsData && incidentsData.value) {
            allIncidents.push(...incidentsData.value);
        }
        
        if (faultyLightsData && faultyLightsData.value) {
            const faultyLights = faultyLightsData.value.map(light => ({
                Type: light.Type === 4 ? 'Blackout' : 'Faulty Light',
                Message: light.Message,
            }));
            allIncidents.push(...faultyLights);
        }

        if (allIncidents.length === 0) {
            incidentsContainer.innerHTML = '<p>No traffic incidents reported. All clear! ✨</p>';
            return;
        }

        const groupedIncidents = allIncidents.reduce((acc, incident) => {
            const type = incident.Type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(incident);
            return acc;
        }, {});

        incidentsContainer.innerHTML = '';
        const sortedGroupKeys = Object.keys(groupedIncidents).sort();

        for (const type of sortedGroupKeys) {
            const incidents = groupedIncidents[type];
            const groupContainer = document.createElement('div');
            groupContainer.classList.add('incident-group');

            const groupHeading = document.createElement('h3');
            groupHeading.classList.add('incident-group-title');
            groupHeading.textContent = `${type} (${incidents.length})`;
            groupContainer.appendChild(groupHeading);

            const createIncidentElement = (incident) => {
                const incidentDiv = document.createElement('div');
                incidentDiv.classList.add('incident-item');
                const iconUrl = incidentIcons[incident.Type] || defaultIcon;
                
                const cleanedMessage = incident.Message.replace(/^\(\d{2}\/\d{2}\)\d{2}:\d{2}\s*/, '');

                incidentDiv.innerHTML = `
                    <img src="${iconUrl}" alt="${incident.Type}" class="incident-icon">
                    <div class="incident-details">
                        <p><strong>Message:</strong> ${cleanedMessage}</p>
                    </div>
                `;
                return incidentDiv;
            };

            incidents.slice(0, 3).forEach(incident => {
                groupContainer.appendChild(createIncidentElement(incident));
            });

            if (incidents.length > 3) {
                const remainingCount = incidents.length - 3;
                const details = document.createElement('details');
                details.classList.add('more-details');
                const summary = document.createElement('summary');
                summary.classList.add('more-summary');
                summary.textContent = `View ${remainingCount} more`;
                details.appendChild(summary);
                incidents.slice(3).forEach(incident => {
                    details.appendChild(createIncidentElement(incident));
                });
                groupContainer.appendChild(details);
            }
            incidentsContainer.appendChild(groupContainer);
        }
    };

    const displayTrafficImages = async () => {
        imagesContainer.innerHTML = '<p>Loading checkpoint traffic images...</p>';
        const checkpointCameraIDs = ["2701", "2702", "4703", "4701", "4713", "4702", "4712", "4714", "4715", "4716", "4717", "4718", "4719"];
        const data = await fetchLTAData('/Traffic-Imagesv2');
        if (data && data.value) {
            const checkpointCameras = data.value.filter(camera => checkpointCameraIDs.includes(camera.CameraID));
            if (checkpointCameras.length > 0) {
                imagesContainer.innerHTML = '';
                checkpointCameras.forEach(image => {
                    const imageDiv = document.createElement('div');
                    imageDiv.classList.add('image-item');
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

    const displayWeatherForecast = async () => {
        weatherContainer.innerHTML = '<p>Loading weather forecast...</p>';
        const WEATHER_API_URL = 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast';

        try {
            const response = await fetch(WEATHER_API_URL);
            if (!response.ok) {
                throw new Error(`Weather API error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const forecastData = data.items[0];
                const generalForecast = forecastData.general.forecast;
                const tempLow = forecastData.general.temperature.low;
                const tempHigh = forecastData.general.temperature.high;

                let weatherIcon = 'https://img.icons8.com/office/80/partly-cloudy-day.png';
                if (generalForecast.toLowerCase().includes('rain') || generalForecast.toLowerCase().includes('showers')) {
                    weatherIcon = 'https://img.icons8.com/office/80/rain.png';
                } else if (generalForecast.toLowerCase().includes('thundery')) {
                    weatherIcon = 'https://img.icons8.com/office/80/cloud-lighting.png';
                } else if (generalForecast.toLowerCase().includes('cloudy')) {
                    weatherIcon = 'https://img.icons8.com/office/80/cloud.png';
                }

                weatherContainer.innerHTML = `
                    <div class="weather-forecast-item">
                        <img src="${weatherIcon}" alt="Weather icon">
                        <p>${generalForecast}</p>
                        <p class="temperature">${tempLow}°C - ${tempHigh}°C</p>
                    </div>
                `;
            } else {
                weatherContainer.innerHTML = '<p>Weather forecast data is currently unavailable.</p>';
            }

        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            weatherContainer.innerHTML = '<p>Could not load weather forecast.</p>';
        }
    };

    const updateAllData = () => {
        displayTrafficIncidents();
        displayTrafficImages();
        displayWeatherForecast();
        lastUpdatedSpan.textContent = new Date().toLocaleString();
    };

    const detailsElements = document.querySelectorAll('details.data-section');
    detailsElements.forEach(details => {
        details.addEventListener('toggle', () => {
            if (details.open) {
                detailsElements.forEach(otherDetails => {
                    if (otherDetails !== details) otherDetails.open = false;
                });
            }
        });
    });

    updateAllData();
    setInterval(updateAllData, 300000);
});
