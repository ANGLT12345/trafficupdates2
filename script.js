document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM References ----
    const incidentsContainer = document.getElementById('incidents-container');
    const incidentSummary = document.getElementById('incident-summary');
    const incidentBadge = document.getElementById('incident-badge');
    const imagesContainer = document.getElementById('images-container');
    const weatherContainer = document.getElementById('weather-forecast-container');
    const trainUpdatesContainer = document.getElementById('train-updates-container');
    const advisoryCarouselContainer = document.getElementById('advisory-carousel-container');
    const advisoryMessage = document.getElementById('advisory-message');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const refreshBtn = document.getElementById('refresh-btn');
    const countdownTimer = document.getElementById('countdown-timer');
    
    const trainAlertModalOverlay = document.getElementById('train-alert-modal-overlay');
    const trainAlertMessage = document.getElementById('train-alert-message');
    const trainAlertCloseBtn = document.getElementById('train-alert-close-btn');
    const trainAlertDismissBtn = document.getElementById('train-alert-dismiss-btn');

    let advisoryInterval;
    let countdownInterval;
    const REFRESH_INTERVAL = 300; // 5 minutes in seconds

    // ---- Tab Navigation ----
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // ---- Countdown Timer ----
    const startCountdown = () => {
        let remaining = REFRESH_INTERVAL;
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                remaining = REFRESH_INTERVAL;
                updateAllData();
            }
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            countdownTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    };

    // ---- Refresh Button ----
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        setTimeout(() => refreshBtn.classList.remove('spinning'), 800);
        updateAllData();
        // Reset countdown
        if (countdownInterval) clearInterval(countdownInterval);
        startCountdown();
    });

    // ---- Data Fetching ----
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
    
    // ---- Advisory Carousel ----
    const displayAdvisoryCarousel = async () => {
        if (advisoryInterval) clearInterval(advisoryInterval);

        const data = await fetchLTAData('/VMS');
        if (data && data.value && data.value.length > 0) {
            const messages = data.value
                .map(item => item.Message)
                .filter(msg => msg && msg.length > 10 && !msg.toLowerCase().includes('test'));

            if (messages.length === 0) {
                advisoryMessage.textContent = 'No major advisories at the moment.';
                return;
            }

            let currentIndex = 0;
            advisoryMessage.textContent = messages[currentIndex];

            advisoryInterval = setInterval(() => {
                advisoryMessage.classList.add('fade-out');
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % messages.length;
                    advisoryMessage.textContent = messages[currentIndex];
                    advisoryMessage.classList.remove('fade-out');
                }, 400);
            }, 5000);
        } else {
            advisoryMessage.textContent = 'Advisories currently unavailable.';
        }
    };

    // ---- Train Service Alerts ----
    const handleTrainAlerts = async () => {
        const data = await fetchLTAData('/TrainServiceAlerts');

        const allTrainLines = [
            { name: 'North-South Line', code: 'NSL' },
            { name: 'East-West Line', code: 'EWL' },
            { name: 'Circle Line', code: 'CCL' },
            { name: 'North-East Line', code: 'NEL' },
            { name: 'Downtown Line', code: 'DTL' },
            { name: 'Thomson-East Coast Line', code: 'TEL' },
            { name: 'Bukit Panjang LRT', code: 'BPL' },
            { name: 'Sengkang LRT', code: 'SPL' },
            { name: 'Punggol LRT', code: 'PGL' }
        ];

        const disruptions = {};
        let hasDisruption = false;
        let disruptionMessage = 'Train service disruption reported.';

        if (data && data.value) {
            const alerts = Array.isArray(data.value) ? data.value : [data.value];
            
            alerts.forEach(alert => {
                if (alert.Status === 2) {
                    hasDisruption = true;
                    if (alert.Message && alert.Message[0]) {
                        disruptionMessage = alert.Message[0].Content;
                    }
                    if (alert.AffectedSegments && Array.isArray(alert.AffectedSegments)) {
                        alert.AffectedSegments.forEach(segment => {
                            let lineCode = segment.Line;
                            if (lineCode.includes('SW') || lineCode.includes('SE')) lineCode = 'SPL';
                            if (lineCode.includes('PW') || lineCode.includes('PE')) lineCode = 'PGL';
                            disruptions[lineCode] = '2';
                        });
                    }
                }
            });
        }
        
        if (hasDisruption) {
            if (advisoryInterval) clearInterval(advisoryInterval);
            advisoryCarouselContainer.classList.add('disruption-active');
            advisoryMessage.textContent = disruptionMessage;
            trainAlertMessage.textContent = disruptionMessage;
            trainAlertModalOverlay.style.display = 'flex';
        } else {
            advisoryCarouselContainer.classList.remove('disruption-active');
            displayAdvisoryCarousel();
        }

        // Render train service grid
        trainUpdatesContainer.innerHTML = '<div class="train-update-grid"></div>';
        const grid = trainUpdatesContainer.querySelector('.train-update-grid');

        allTrainLines.forEach(line => {
            const updateDiv = document.createElement('div');
            updateDiv.classList.add('train-update-item');

            const lineCode = line.code;
            const status = disruptions[lineCode] || '1';

            let statusText = '● Normal Service';
            let statusClass = 'operational';

            if (status === '2') {
                statusText = '⚠ Disruption';
                statusClass = 'down';
            } else if (status === '3') {
                statusText = '◐ Delay';
                statusClass = 'delay';
            }
            
            updateDiv.classList.add(statusClass);
            updateDiv.innerHTML = `
                <div class="train-line-icon line-${lineCode}">${lineCode}</div>
                <div class="train-update-details">
                    <p>${line.name}</p>
                    <p>${statusText}</p>
                </div>
            `;
            grid.appendChild(updateDiv);
        });
    };

    // Modal close handlers
    const closeModal = () => { trainAlertModalOverlay.style.display = 'none'; };
    trainAlertCloseBtn.addEventListener('click', closeModal);
    trainAlertDismissBtn.addEventListener('click', closeModal);
    trainAlertModalOverlay.addEventListener('click', (e) => {
        if (e.target === trainAlertModalOverlay) closeModal();
    });

    // ---- Traffic Incidents ----
    const displayTrafficIncidents = async () => {
        incidentsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading incidents…</p></div>';

        const incidentIcons = {
            'Accident': 'https://img.icons8.com/?size=100&id=BrdfEjNVVRqI&format=png&color=000000',
            'Roadwork': 'https://img.icons8.com/office/40/road-worker.png',
            'Vehicle breakdown': 'https://img.icons8.com/office/40/tow-truck.png',
            'Weather': 'https://img.icons8.com/office/40/partly-cloudy-day.png',
            'Obstacle': 'https://img.icons8.com/?size=100&id=bZgFYyK2uzeG&format=png&color=000000',
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

        // Update badge
        if (allIncidents.length > 0) {
            incidentBadge.textContent = allIncidents.length;
            incidentBadge.classList.remove('hidden');
        } else {
            incidentBadge.classList.add('hidden');
        }

        if (allIncidents.length === 0) {
            incidentsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <p>No traffic incidents reported — all clear!</p>
                </div>`;
            incidentSummary.innerHTML = '';
            return;
        }

        const groupedIncidents = allIncidents.reduce((acc, incident) => {
            const type = incident.Type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(incident);
            return acc;
        }, {});

        // Build summary chips
        incidentSummary.innerHTML = '';
        const sortedGroupKeys = Object.keys(groupedIncidents).sort();
        sortedGroupKeys.forEach(type => {
            const chip = document.createElement('span');
            chip.classList.add('summary-chip');
            chip.innerHTML = `${type} <span class="chip-count">${groupedIncidents[type].length}</span>`;
            chip.addEventListener('click', () => {
                const target = document.getElementById(`group-${type.replace(/\s+/g, '-')}`);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            incidentSummary.appendChild(chip);
        });

        // Build incident groups
        incidentsContainer.innerHTML = '';

        for (const type of sortedGroupKeys) {
            const incidents = groupedIncidents[type];
            const groupContainer = document.createElement('div');
            groupContainer.classList.add('incident-group');
            groupContainer.id = `group-${type.replace(/\s+/g, '-')}`;

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
                        <p>${cleanedMessage}</p>
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

    // ---- Camera Landmarks ----
    const cameraLandmarks = {
        "2701": "Woodlands Causeway (Towards Johor)",
        "2702": "Woodlands Checkpoint",
        "2703": "BKE / PIE – Chantek Flyover",
        "2704": "BKE Woodlands Checkpoint – Woodlands Flyover",
        "2705": "BKE / PIE – Dairy Farm Flyover",
        "2706": "Mandai Road – Entrance towards Checkpoint",
        "2707": "Exit 5 to KJE (towards PIE)",
        "2708": "Exit 5 to KJE (towards Checkpoint)",
        "4701": "AYE (City) – Alexandra Road Exit",
        "4702": "AYE (Jurong) – Keppel Viaduct",
        "4703": "Tuas Second Link",
        "4710": "AYE (Tuas) – Pandan Garden",
        "4712": "AYE (Tuas) – Tuas Ave 8 Exit",
        "4713": "Tuas Checkpoint",
        "4714": "AYE (Tuas) – Near West Coast Walk",
        "4716": "AYE (Tuas) – Entrance from Benoi Road"
    };

    // ---- Traffic Images ----
    const displayTrafficImages = async () => {
        imagesContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading cameras…</p></div>';
        const checkpointCameraIDs = ["2701", "2702", "4703", "4713"];
        const data = await fetchLTAData('/Traffic-Imagesv2');
        if (data && data.value) {
            const checkpointCameras = data.value.filter(camera => checkpointCameraIDs.includes(camera.CameraID));
            if (checkpointCameras.length > 0) {
                imagesContainer.innerHTML = '';
                checkpointCameras.forEach(image => {
                    const imageDiv = document.createElement('div');
                    imageDiv.classList.add('image-item');

                    const updateTime = new Date(image.CreateDate).toLocaleTimeString(
                        'en-SG',
                        { hour: '2-digit', minute: '2-digit', hour12: true }
                    );

                    const landmark = cameraLandmarks[image.CameraID];
                    const cameraLabel = landmark || `Camera ${image.CameraID}`;
                    imageDiv.innerHTML = `
                        <img src="${image.ImageLink}" alt="${cameraLabel}" loading="lazy">
                        <div class="image-item-info">
                            <p>${cameraLabel}</p>
                            <span class="camera-time">${updateTime}</span>
                        </div>
                    `;
                    imagesContainer.appendChild(imageDiv);
                });
            } else {
                imagesContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📷</div><p>Could not find checkpoint camera data.</p></div>';
            }
        } else {
            imagesContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📷</div><p>No live traffic images available.</p></div>';
        }
    };

    // ---- Weather Forecast ----
    const displayWeatherForecast = async () => {
        weatherContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading forecast…</p></div>';
        const WEATHER_API_URL = 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast';

        try {
            const response = await fetch(WEATHER_API_URL);
            if (!response.ok) {
                throw new Error(`Weather API error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const forecast = data.items[0];
                const periods = forecast.periods;
                const general = forecast.general;

                weatherContainer.innerHTML = '';

                const periodsGrid = document.createElement('div');
                periodsGrid.classList.add('weather-periods-grid');

                const weatherIcons = {
                    "Fair (Day)": "https://img.icons8.com/office/40/sun.png",
                    "Fair (Night)": "https://img.icons8.com/office/40/bright-moon.png",
                    "Partly Cloudy (Day)": "https://img.icons8.com/office/40/partly-cloudy-day.png",
                    "Partly Cloudy (Night)": "https://img.icons8.com/office/40/partly-cloudy-night.png",
                    "Cloudy": "https://img.icons8.com/office/40/cloud.png",
                    "Hazy": "https://img.icons8.com/office/40/fog-day.png",
                    "Slight Rain": "https://img.icons8.com/office/40/light-rain.png",
                    "Rain": "https://img.icons8.com/office/40/rain.png",
                    "Moderate Rain": "https://img.icons8.com/office/40/rain.png",
                    "Heavy Rain": "https://img.icons8.com/office/40/heavy-rain.png",
                    "Passing Showers": "https://img.icons8.com/office/40/light-rain-2.png",
                    "Light Showers": "https://img.icons8.com/office/40/light-rain-2.png",
                    "Showers": "https://img.icons8.com/office/40/rain.png",
                    "Heavy Showers": "https://img.icons8.com/office/40/heavy-rain.png",
                    "Thundery Showers": "https://img.icons8.com/office/40/cloud-lighting.png",
                    "Heavy Thundery Showers": "https://img.icons8.com/office/40/cloud-lighting.png",
                    "Windy": "https://img.icons8.com/office/40/wind.png",
                };
                const defaultWeatherIcon = 'https://img.icons8.com/office/40/cloud.png';

                periods.slice(0, 3).forEach(period => {
                    const periodDiv = document.createElement('div');
                    periodDiv.classList.add('weather-period-item');

                    const startTime = new Date(period.time.start).toLocaleTimeString('en-SG', { hour: 'numeric', hour12: true });
                    const endTime = new Date(period.time.end).toLocaleTimeString('en-SG', { hour: 'numeric', hour12: true });
                    
                    let periodName = "Forecast";
                    const startHour = new Date(period.time.start).getHours();
                    if (startHour >= 6 && startHour < 12) periodName = "🌅 Morning";
                    else if (startHour >= 12 && startHour < 18) periodName = "☀️ Afternoon";
                    else periodName = "🌙 Night";

                    periodDiv.innerHTML = `<h4 class="period-title">${periodName} (${startTime} – ${endTime})</h4>`;
                    
                    const regionsList = document.createElement('div');
                    regionsList.classList.add('region-forecast-list');
                    
                    for (const region in period.regions) {
                        const forecastText = period.regions[region];
                        const regionDiv = document.createElement('div');
                        regionDiv.classList.add('region-forecast-item');
                        regionDiv.innerHTML = `
                            <img src="${weatherIcons[forecastText] || defaultWeatherIcon}" alt="${forecastText}">
                            <span><strong>${region.charAt(0).toUpperCase() + region.slice(1)}:</strong> ${forecastText}</span>
                        `;
                        regionsList.appendChild(regionDiv);
                    }
                    periodDiv.appendChild(regionsList);
                    periodsGrid.appendChild(periodDiv);
                });

                weatherContainer.appendChild(periodsGrid);

                const statsContainer = document.createElement('div');
                statsContainer.classList.add('weather-overall-stats');
                statsContainer.innerHTML = `
                    <div class="weather-text">
                        <p><strong>Overall Forecast</strong></p>
                        <p>${general.forecast}</p>
                    </div>
                    <div class="weather-stats">
                        <div class="weather-stats-item">
                            <img src="https://img.icons8.com/material-outlined/24/thermometer.png" alt="Temperature">
                            <span>${general.temperature.low}°C – ${general.temperature.high}°C</span>
                        </div>
                        <div class="weather-stats-item">
                            <img src="https://img.icons8.com/ios-glyphs/30/hygrometer.png" alt="Humidity">
                            <span>${general.relative_humidity.low}% – ${general.relative_humidity.high}%</span>
                        </div>
                        <div class="weather-stats-item">
                            <img src="https://img.icons8.com/material-outlined/24/wind.png" alt="Wind">
                            <span>${general.wind.direction} ${general.wind.speed.low} – ${general.wind.speed.high} km/h</span>
                        </div>
                    </div>
                `;
                weatherContainer.appendChild(statsContainer);
            } else {
                weatherContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">🌤️</div><p>Weather forecast data is currently unavailable.</p></div>';
            }

        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            weatherContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">🌤️</div><p>Could not load weather forecast.</p></div>';
        }
    };

    // ---- Update All Data ----
    const updateAllData = () => {
        handleTrainAlerts();
        displayTrafficIncidents();
        displayTrafficImages();
        displayWeatherForecast();
        const now = new Date();
        lastUpdatedSpan.textContent = `Updated ${now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    // ---- Initialize ----
    updateAllData();
    startCountdown();
});
