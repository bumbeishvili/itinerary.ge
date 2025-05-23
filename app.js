// Initialize MapLibre GL JS map
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const queryContainer = document.getElementById('query-container');
    const chatContainer = document.getElementById('chat-container');
    const startPlanningBtn = document.getElementById('start-planning-btn');
    const checklistPanel = document.getElementById('checklist-panel'); // Get checklist panel
    const chatInput = document.querySelector('#chat-container input');
    const sendButton = document.querySelector('#chat-container button');
    const chatMessages = document.getElementById('chat-messages');
    
    // Store user selections globally
    let userSelections = {};
    
    // Route coordinates for the flight animation
    const flightRoute = [
        { name: "Madrid", coordinates: [-3.7038, 40.4168] },
        { name: "Kutaisi", coordinates: [42.7118, 42.2679] },
        { name: "Tbilisi", coordinates: [44.8271, 41.7151] },
        { name: "Gudauri", coordinates: [44.4781, 42.4778] }
    ];
    
    // Flight animation variables
    let animation;
    let counter = 0;
    const steps = 500;
    
    // Function to create the flight animation
    function createFlightAnimation(map) {
        // Create a GeoJSON LineString from the route coordinates
        const routeFeature = {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': flightRoute.map(point => point.coordinates)
            }
        };

        // Calculate the total distance of the route
        let lineDistance = 0;
        for (let i = 0; i < flightRoute.length - 1; i++) {
            lineDistance += turf.distance(
                turf.point(flightRoute[i].coordinates),
                turf.point(flightRoute[i + 1].coordinates)
            );
        }

        // Create a smooth arc with many points for the animation
        const arc = [];
        
        // Draw an arc between all points using great circle paths
        let cumulativeDistance = 0;
        
        for (let i = 0; i < flightRoute.length - 1; i++) {
            // Create a linestring between two points
            const startPoint = turf.point(flightRoute[i].coordinates);
            const endPoint = turf.point(flightRoute[i + 1].coordinates);
            
            // Use great circle interpolation for a more realistic flight path
            // This creates a more natural curve that follows the earth's curvature
            const segment = turf.greatCircle(startPoint, endPoint, {
                'steps': 100,
                'npoints': 100
            });
            
            const segmentDistance = turf.length(segment);
            const segmentSteps = Math.ceil((segmentDistance / lineDistance) * steps);
            
            // Sample points along the great circle path
            const lineString = segment.geometry.coordinates;
            for (let j = 0; j < lineString.length; j++) {
                // Only add points at appropriate intervals to maintain consistent animation speed
                if (j % Math.ceil(lineString.length / segmentSteps) === 0 || j === lineString.length - 1) {
                    arc.push(lineString[j]);
                }
            }
        }
        
        // Add the final point to ensure we reach the destination
        arc.push(flightRoute[flightRoute.length - 1].coordinates);

        // Create sources for the route and the moving point
        map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': arc
                }
            }
        });

        map.addSource('point', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [{
                    'type': 'Feature',
                    'properties': {
                        'bearing': 0
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': flightRoute[0].coordinates
                    }
                }]
            }
        });

        // Add a line layer for the route
        map.addLayer({
            'id': 'route',
            'source': 'route',
            'type': 'line',
            'paint': {
                'line-width': 2,
                'line-dasharray': [2, 1],
                'line-color': '#2563EB'
            }
        });

        // Add a symbol layer for the airplane
        map.addLayer({
            'id': 'point',
            'source': 'point',
            'type': 'symbol',
            'layout': {
                'icon-image': 'plane-marker',
                'icon-size': 0.8,
                'icon-rotate': ['get', 'bearing'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }
        });
        
        // Create destination markers but keep them hidden initially
        window.destinationMarkers = [];
        
        flightRoute.forEach((point, index) => {
            // Create a DOM element for the marker
            const el = document.createElement('div');
            el.className = 'destination-marker';
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = index === 0 ? '#EC4899' : '#2563EB';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
            el.style.opacity = '0';  // Start invisible
            el.style.transition = 'opacity 0.5s ease-in-out';
            
            // Add destination name tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'destination-tooltip';
            tooltip.textContent = point.name;
            tooltip.style.position = 'absolute';
            tooltip.style.bottom = '14px';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.backgroundColor = 'white';
            tooltip.style.color = index === 0 ? '#EC4899' : '#2563EB';
            tooltip.style.padding = '2px 5px';
            tooltip.style.borderRadius = '3px';
            tooltip.style.fontSize = '10px';
            tooltip.style.fontWeight = 'bold';
            tooltip.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.2)';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.2s';
            
            el.appendChild(tooltip);
            
            // Show tooltip on hover
            el.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
            });
            
            el.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
            
            // Create the marker but don't add it to the map yet
            const marker = new maplibregl.Marker(el)
                .setLngLat(point.coordinates);
                
            // Only show Madrid marker initially
            if (index === 0) {
                marker.addTo(map);
                // Make it visible with a delay
                setTimeout(() => {
                    el.style.opacity = '1';
                }, 1000);
            }
            
            window.destinationMarkers.push({
                marker: marker,
                element: el,
                coordinates: point.coordinates,
                name: point.name,
                added: index === 0
            });
        });

        // Create custom plane icon image
        const planeImage = new Image(24, 24);
        planeImage.onload = () => {
            map.addImage('plane-marker', planeImage);
            // Start the animation automatically once the image is loaded
            animateRoute(map, arc);
        };
        planeImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="#FFFFFF" stroke="#2563EB" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7H9l2-7H7l-2 2H2l2-4l-2-4h3l2 2h4L9 3h3z"/>
            </svg>
        `);
        
        return arc;
    }

    // Function to animate the plane along the route
    function animateRoute(map, arc) {
        // Reset counter
        counter = 0;
        
        // Control animation speed (lower = slower)
        const animationSpeed = 0.5;
        
        function animate() {
            // Check if we've reached the end of the route
            if (counter >= arc.length - 1) {
                return;
            }
            
            // Get current coordinates
            const currentCoords = arc[Math.floor(counter)];
            if (!currentCoords || !Array.isArray(currentCoords) || currentCoords.length < 2) {
                console.error('Invalid coordinates at position', counter, currentCoords);
                counter += animationSpeed;
                requestAnimationFrame(animate);
                return;
            }
            
            // Update point position
            const pointData = {
                'type': 'FeatureCollection',
                'features': [{
                    'type': 'Feature',
                    'properties': {
                        'bearing': 90
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': currentCoords
                    }
                }]
            };
            
            // Calculate bearing for plane orientation
            // Safely get start and end coordinates for bearing calculation
            const prevIndex = Math.max(0, Math.floor(counter) - 1);
            const nextIndex = Math.min(arc.length - 1, Math.floor(counter) + 1);
            
            const start = arc[prevIndex];
            const end = arc[nextIndex];
            
            if (start && end && Array.isArray(start) && Array.isArray(end) && 
                start.length >= 2 && end.length >= 2) {
                try {
                    // Get a more accurate bearing that follows the curvature by using points along the path
                    const bearing = turf.bearing(
                        { type: 'Feature', geometry: { type: 'Point', coordinates: start } },
                        { type: 'Feature', geometry: { type: 'Point', coordinates: end } }
                    );
                    
                    // Smooth the bearing changes by using interpolation
                    // Store the previous bearing if it exists
                    if (typeof pointData.features[0].properties.prevBearing === 'undefined') {
                        pointData.features[0].properties.prevBearing = bearing;
                    }
                    
                    // Calculate interpolation factor (0 to 1) based on position between points
                    const fraction = counter - Math.floor(counter);
                    
                    // Interpolate between previous bearing and current bearing
                    let prevBearing = pointData.features[0].properties.prevBearing;
                    let interpolatedBearing;
                    
                    // Handle bearing wrap-around (when crossing from 180 to -180 or vice versa)
                    let diff = bearing - prevBearing;
                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;
                    
                    interpolatedBearing = prevBearing + diff * fraction;
                    
                    // Store the current bearing for next frame
                    pointData.features[0].properties.prevBearing = bearing;
                    
                    // Set bearing property
                    pointData.features[0].properties.bearing = interpolatedBearing;
                } catch (error) {
                    console.error('Error calculating bearing:', error);
                }
            }
            
            // Update the point source with new data
            map.getSource('point').setData(pointData);
            
            // Move map view to follow the plane
            map.easeTo({
                center: currentCoords,
                zoom: 4,
                duration: 100 // Longer duration for smoother movement
            });
            
            // Check if we're approaching a destination and show the marker
            for (let i = 1; i < flightRoute.length; i++) {
                const destPoint = flightRoute[i].coordinates;
                try {
                    const distance = turf.distance(
                        { type: 'Feature', geometry: { type: 'Point', coordinates: currentCoords } },
                        { type: 'Feature', geometry: { type: 'Point', coordinates: destPoint } }
                    );
                    
                    // When we get close to a destination (within 50km)
                    if (distance < 0.5 && !window.destinationMarkers[i].added) {
                        window.destinationMarkers[i].marker.addTo(map);
                        window.destinationMarkers[i].element.style.opacity = '1';
                        window.destinationMarkers[i].added = true;
                    }
                } catch (error) {
                    console.error('Error calculating distance:', error);
                }
            }
            
            // Increment counter more slowly for a slower animation
            counter = counter + animationSpeed;
            setTimeout(() => {
                requestAnimationFrame(animate);
            }, 50); // Add delay between frames
        }
        
        // Start the animation
        animate();
    }
    
    // Add chat functionality
    function initializeChat() {
        // Add event listener for send button
        sendButton.addEventListener('click', handleChatSend);
        
        // Add event listener for Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatSend();
            }
        });
    }
    
    // Function to handle sending a chat message
    function handleChatSend() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        // Add user message to chat
        addMessageToChat(userMessage, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Simulate AI response after delay
        setTimeout(() => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Generate AI response
            const aiResponse = generateAIResponse(userMessage);
            
            // Add AI response to chat
            addMessageToChat(aiResponse, 'ai');
            
            // Scroll to bottom
            scrollChatToBottom();
        }, 1500); // 1.5 second delay for realism
    }
    
    // Function to add a message to the chat with Instagram-like styling
    function addMessageToChat(message, sender) {
        const messageEl = document.createElement('div');
        messageEl.className = 'mb-4';
        
        if (sender === 'user') {
            messageEl.innerHTML = `
                <div class="flex justify-end">
                    <div class="max-w-[75%] bg-primary-50 border border-primary-100 text-primary-700 rounded-2xl rounded-tr-sm py-2 px-4">
                        ${message}
                    </div>
                </div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="flex items-start mb-4">
                    <div class="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                        IG
                    </div>
                    <div class="ml-2 max-w-[75%] bg-white border border-gray-200 text-primary-700 rounded-2xl rounded-tl-sm py-2 px-4">
                        ${message}
                    </div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageEl);
        scrollChatToBottom();
    }
    
    // Function to show typing indicator with Instagram-like styling
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator mb-4';
        typingIndicator.innerHTML = `
            <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs">
                    IG
                </div>
                <div class="ml-2 bg-white border border-gray-200 rounded-2xl rounded-tl-sm py-2 px-4">
                    <div class="flex space-x-1 items-center h-5">
                        <div class="typing-dot"></div>
                        <div class="typing-dot animation-delay-200"></div>
                        <div class="typing-dot animation-delay-400"></div>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollChatToBottom();
        
        // Add dot styling
        const dotStyle = document.createElement('style');
        dotStyle.textContent = `
            .typing-dot {
                width: 6px;
                height: 6px;
                background-color: #3B82F6;
                border-radius: 50%;
                opacity: 0.6;
                animation: pulseAnimation 1.5s infinite;
            }
            @keyframes pulseAnimation {
                0% { opacity: 0.6; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
                100% { opacity: 0.6; transform: scale(0.8); }
            }
            .animation-delay-200 { animation-delay: 0.2s; }
            .animation-delay-400 { animation-delay: 0.4s; }
        `;
        document.head.appendChild(dotStyle);
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to scroll chat to bottom
    function scrollChatToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to generate AI response
    function generateAIResponse(userMessage) {
        userMessage = userMessage.toLowerCase();
        
        // Check if something is missing in the trip planning
        const missingElementResponses = [
            "I noticed your itinerary is missing information about local transportation options. Would you like me to suggest some ways to get around in Georgia?",
            "It seems we haven't planned any specific activities for your trip yet. Based on your preferences, I'd recommend visiting wine regions in Kakheti. Would you like more details?",
            "I don't see any accommodation bookings in your checklist. Would you like suggestions for places to stay in Tbilisi?",
            "Your travel plan doesn't include any food experiences yet. Georgian cuisine is amazing - would you like recommendations for traditional dishes to try?",
            "I notice we haven't discussed your visa requirements. Depending on your nationality, you might need to arrange this before traveling. Would you like me to provide more information?"
        ];
        
        // Check for Martvili Canyon or waterfalls related questions
        if (userMessage.includes('martvili') || 
            (userMessage.includes('canyon') && userMessage.includes('georgia')) || 
            (userMessage.includes('waterfall') && userMessage.includes('georgia')) ||
            (userMessage.includes('natural') && userMessage.includes('attraction'))) {
            return "Martvili Canyon is one of Georgia's most stunning natural attractions! Located in the Samegrelo region, it features breathtaking turquoise waters flowing through a limestone canyon with lush vegetation. You can take a boat ride through the narrow gorge and see beautiful waterfalls. The canyon was once a bathing place for the noble Dadiani family. Nearby attractions include Balda Canyon, Okatse Canyon, and Kinchkha Waterfall. Would you like me to include Martvili Canyon in your itinerary?";
        }
        
        // Check for western Georgia questions
        if (userMessage.includes('western georgia') || userMessage.includes('samegrelo') || userMessage.includes('things to do near kutaisi')) {
            return "Western Georgia has incredible natural attractions! Martvili Canyon should definitely be on your list - it's about 45km from Kutaisi with stunning emerald waters and boat rides through the gorge. Other nearby attractions include Prometheus Cave, Okatse Canyon, and Kinchkha Waterfall. The whole area has amazing scenery with lush vegetation and limestone formations. Would you like me to suggest a day trip itinerary from Kutaisi?";
        }
        
        // Original code continues below
        // Check for keywords in user message
        if (userMessage.includes('restaurant') || userMessage.includes('food') || userMessage.includes('eat')) {
            return "Georgia has amazing cuisine! In Tbilisi, I'd recommend Barbarestan for traditional dishes with a modern twist, or Shavi Lomi for authentic homestyle cooking. Don't miss khachapuri (cheese bread), khinkali (dumplings), and mtsvadi (grilled meat skewers). Would you like more specific recommendations for your destinations?";
        }
        
        if (userMessage.includes('wine') || userMessage.includes('drink')) {
            return "Georgia is one of the oldest wine-producing regions in the world with an 8,000-year-old winemaking tradition! The Kakheti region is famous for its wineries. I recommend trying amber wines made in traditional qvevri (clay vessels). Popular grape varieties include Saperavi for red and Rkatsiteli for white wines. Would you like me to suggest some wineries to visit?";
        }
        
        if (userMessage.includes('hotel') || userMessage.includes('stay') || userMessage.includes('accommodation')) {
            return "For accommodation in Tbilisi, I recommend staying in the charming Old Town area. The Rooms Hotel or Stamba Hotel offer stylish luxury experiences, while Guest House Lile or Marco Polo Hostel are great budget options. In Gudauri, New Gudauri Suites offers ski-in/ski-out convenience. Would you like specific recommendations for other cities?";
        }

        if (userMessage.includes('gudauri')) {
            return "Gudauri is Georgia's premier ski resort located about 2 hours from Tbilisi at an elevation of 2,200m. Even if you're not skiing, it offers breathtaking mountain views and outdoor activities like paragliding and hiking in summer. The famous Georgia-Russia Friendship Monument is nearby with spectacular views of the Caucasus mountains.";
        }
        
        if (userMessage.includes('tbilisi')) {
            return "Tbilisi is Georgia's captivating capital with a blend of ancient and modern. Explore the cobblestone streets of Old Town, visit the 4th-century Narikala Fortress, relax in the famous sulfur baths, and enjoy the city's vibrant cafe culture. Don't miss the iconic Peace Bridge, Dry Bridge Market for souvenirs, and the Holy Trinity Cathedral. The city has excellent restaurants showcasing Georgia's renowned cuisine.";
        }
        
        // Default responses if no specific keywords detected
        const defaultResponses = [
            "Is there anything specific about Georgia you'd like to know about? I can help with attractions, accommodations, food, or transportation.",
            "Georgian hospitality is legendary! People say that 'guests are a gift from God.' You'll likely be invited to a supra (feast) with a tamada (toastmaster) leading traditional toasts.",
            "Georgia is known for its diverse landscapes - from the Caucasus Mountains to Black Sea beaches, all within a small area. Is there a particular region you're interested in?",
            "The best time to visit Georgia depends on your interests. May-June and September-October are ideal for most activities, with pleasant weather and fewer tourists.",
            missingElementResponses[Math.floor(Math.random() * missingElementResponses.length)]
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    // Initialize chat functionality
    initializeChat();
    
    // Hide checklist panel initially
    if (checklistPanel) {
        checklistPanel.classList.add('hidden');
    }
    
    // Add animation styles to sections
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        [id$="-details"] {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.5s ease-out, opacity 0.3s ease-out, margin 0.3s ease;
            opacity: 0;
            margin-top: 0;
        }
        [id$="-details"].visible {
            max-height: 500px;
            opacity: 1;
            margin-top: 0.75rem;
        }
        .section-header svg.transform {
            transition: transform 0.3s ease;
        }
        #checklist-panel {
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        #checklist-panel.hidden {
            opacity: 0;
            transform: translateX(20px);
        }
    `;
    document.head.appendChild(styleSheet);
    
    // New form inputs
    const startingPointInput = document.getElementById('starting-point-input');
    const durationInput = document.getElementById('duration-input');
    const budgetInput = document.getElementById('budget-input');
    const accommodationInput = document.getElementById('accommodation-input');
    const companionsInput = document.getElementById('companions-input');
    const preferencesInput = document.getElementById('preferences-input');
    const transportationInput = document.getElementById('transportation-input');
    
    // Set up option buttons
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const field = this.getAttribute('data-field');
            const value = this.getAttribute('data-value');
            
            // Remove active class from all buttons in the same group
            document.querySelectorAll(`.option-btn[data-field="${field}"]`).forEach(btn => {
                btn.classList.remove('active', 'bg-blue-50', 'border-blue-500', 'font-medium');
            });
            
            // Add active class to clicked button
            this.classList.add('active', 'bg-blue-50', 'border-blue-500', 'font-medium');
            
            // Update hidden input
            document.getElementById(`${field}-input`).value = value;
        });
    });
    
    // Set up toggle buttons (for preferences)
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const selectedPreferences = [];
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            
            // Toggle active class
            this.classList.toggle('active');
            this.classList.toggle('bg-blue-50');
            this.classList.toggle('border-blue-500');
            this.classList.toggle('font-medium');
            
            // Update preferences array
            if (this.classList.contains('active')) {
                if (!selectedPreferences.includes(value)) {
                    selectedPreferences.push(value);
                }
            } else {
                const index = selectedPreferences.indexOf(value);
                if (index > -1) {
                    selectedPreferences.splice(index, 1);
                }
            }
            
            // Update hidden input
            preferencesInput.value = selectedPreferences.join(',');
        });
    });

    // Custom task templates based on user selections
    function generateTasks(userSelections) {
        const tripTasks = {
            packing: [
                `Travel documents`,
                `Clothing for ${userSelections.duration === 'Short' ? '1-3' : '4+'} days`,
                `Toiletries and medications`
            ],
            accommodation: [
                `Book ${userSelections.accommodation} accommodation`,
                `Confirm reservation details`
            ],
            activities: []
        };
        
        // Add transportation-specific items
        if (userSelections.transportation === 'Public') {
            tripTasks.packing.push('Transit maps/apps');
            tripTasks.packing.push('Light backpack');
        } else if (userSelections.transportation === 'Rental') {
            tripTasks.packing.push('Driving license/IDP');
            tripTasks.packing.push('Navigation device/app');
        }
        
        // Add budget-specific accommodation tasks
        if (userSelections.budget === 'Budget') {
            tripTasks.accommodation.push('Compare budget options');
        } else if (userSelections.budget === 'Luxury') {
            tripTasks.accommodation.push('Request special amenities');
        }
        
        // Add activity tasks based on preferences
        const preferences = userSelections.preferences ? userSelections.preferences.split(',') : [];
        
        // Default activities
        tripTasks.activities.push('Research local attractions');
        
        if (preferences.includes('Wine')) {
            tripTasks.activities.push('Book wine tasting tour');
        }
        
        if (preferences.includes('Food')) {
            tripTasks.activities.push('Find local restaurants');
        }
        
        if (preferences.includes('History')) {
            tripTasks.activities.push('List historical sites');
        }
        
        if (preferences.includes('Nature')) {
            tripTasks.activities.push('Plan outdoor activities');
        }
        
        // Add companion-specific tasks
        if (userSelections.companions === 'Family') {
            tripTasks.activities.push('Find family-friendly activities');
        }
        
        return tripTasks;
    }

    // Function to create a task element
    function createTaskElement(taskText) {
        return `
            <div class="flex items-center gap-4">
                <div class="checkbox w-6 h-6 border-2 rounded-md cursor-pointer relative flex items-center justify-center" onclick="toggleCheck(this)"></div>
                <span class="text-gray-700">${taskText}</span>
            </div>
        `;
    }

    // Function to update checklist based on user selections
    function updateTravelChecklist(userSelections) {
        const tasks = generateTasks(userSelections);
        
        // Update packing tasks
        const packingTasks = document.getElementById('packing-tasks');
        if (packingTasks) {
            packingTasks.innerHTML = tasks.packing.map(createTaskElement).join('');
        }

        // Update accommodation tasks
        const accommodationTasks = document.getElementById('accommodation-tasks');
        if (accommodationTasks) {
            accommodationTasks.innerHTML = tasks.accommodation.map(createTaskElement).join('');
        }

        // Update activities tasks
        const activitiesTasks = document.getElementById('activities-tasks');
        if (activitiesTasks) {
            activitiesTasks.innerHTML = tasks.activities.map(createTaskElement).join('');
        }

        // Initialize progress bars and section checkboxes
        updateSectionProgress(document.getElementById('packing-section'));
        updateSectionProgress(document.getElementById('accommodation-section'));
        updateSectionProgress(document.getElementById('activities-section'));
        
        // Update total progress bar
        updateTotalProgress();

        // Show only the first section by default
        hideAllSections();
        const packingDetails = document.getElementById('packing-details');
        if (packingDetails) {
            showSection('packing-details');
        }
    }

    // Hide all sections
    function hideAllSections() {
        const allDetailSections = document.querySelectorAll('[id$="-details"]');
        const allArrows = document.querySelectorAll('.section-header svg.transform');
        
        allDetailSections.forEach(section => {
            section.classList.remove('visible');
            // Allow animation to complete before hiding
            setTimeout(() => {
                if (!section.classList.contains('visible')) {
                    section.classList.add('hidden');
                }
            }, 300);
        });
        
        allArrows.forEach(arrow => {
            arrow.classList.remove('rotate-180');
        });
    }

    // Show specific section
    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        const sectionHeader = section.closest('.checklist-section').querySelector('.section-header');
        const arrow = sectionHeader.querySelector('svg.transform');
        
        // Remove hidden first to allow animation
        section.classList.remove('hidden');
        
        // Trigger reflow to ensure transition works
        void section.offsetWidth;
        
        // Add visible class to animate
        section.classList.add('visible');
        arrow.classList.add('rotate-180');
    }

    // Initialize map configuration
    const mapConfig = {
        style: {
            version: 8,
            sources: {
                'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                }
            },
            layers: [{
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 19
            }]
        },
        center: [44.8271, 41.7151],
        zoom: 7,
        attributionControl: true
    };

    // Initialize chat map
    const chatMap = new maplibregl.Map({
        ...mapConfig,
        container: 'map'
    });

    // Add controls to map
    chatMap.addControl(
        new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true
        })
    );

    chatMap.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    }));

    // Wait for map to load before starting animation
    chatMap.on('load', function() {
        console.log('Map loaded - initializing flight path');
        
        // Initially fly to a position that shows the entire route
        chatMap.flyTo({
            center: [20, 40],  // Centered between Europe and Asia
            zoom: 3,
            duration: 0
        });
        
        // Create the flight animation once the map is fully loaded
        chatMap.once('idle', function() {
            console.log('Map idle - creating flight animation');
            const arc = createFlightAnimation(chatMap);
            
            // Wait a short moment for the user to see the initial view
            setTimeout(() => {
                console.log('Starting flight animation');
                animateRoute(chatMap, arc);
            }, 1000);
        });
    });

    // Error handling
    chatMap.on('error', (e) => {
        console.error('Map error:', e);
    });

    // Toggle section visibility - modified to ensure only one section is open at a time
    window.toggleSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        
        // If section is hidden, show it and hide all others
        if (section.classList.contains('hidden') || !section.classList.contains('visible')) {
            hideAllSections();
            showSection(sectionId);
        } else {
            // If section is visible, hide it
            section.classList.remove('visible');
            const sectionHeader = section.closest('.checklist-section').querySelector('.section-header');
            const arrow = sectionHeader.querySelector('svg.transform');
            arrow.classList.remove('rotate-180');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (!section.classList.contains('visible')) {
                    section.classList.add('hidden');
                }
            }, 300);
        }
    }

    // Toggle checkbox state
    window.toggleCheck = function(checkbox) {
        event.stopPropagation(); // Prevent section toggle
        
        const isSection = checkbox.closest('.section-header') !== null;
        const checkmark = checkbox.querySelector('svg');
        const textElement = checkbox.nextElementSibling;
        
        if (checkmark) {
            // If checkbox is checked, uncheck it
            checkbox.removeChild(checkmark);
            if (textElement) textElement.classList.remove('line-through', 'text-gray-500');
            checkbox.classList.remove('checked', 'bg-accent', 'border-accent');
        } else {
            // If checkbox is unchecked, check it
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', 'w-4 h-4 text-white');
            svg.setAttribute('viewBox', '0 0 20 20');
            svg.setAttribute('fill', 'currentColor');
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
            
            svg.appendChild(path);
            checkbox.appendChild(svg);
            if (textElement) textElement.classList.add('line-through', 'text-gray-500');
            checkbox.classList.add('checked', 'bg-accent', 'border-accent');
        }
        
        if (isSection) {
            // If this is a section checkbox, toggle all checkboxes in the section
            const section = checkbox.closest('.checklist-section');
            const detailsId = section.querySelector('[id$="-details"]').id;
            const tasksContainer = document.getElementById(detailsId).querySelector('.space-y-4');
            const taskCheckboxes = tasksContainer.querySelectorAll('.checkbox');
            
            let recursiveUpdate = false;
            
            taskCheckboxes.forEach(taskCheckbox => {
                const taskChecked = taskCheckbox.querySelector('svg') !== null;
                if (checkmark && taskChecked) {
                    // Uncheck all tasks
                    recursiveUpdate = true;
                    const taskTextElement = taskCheckbox.nextElementSibling;
                    
                    if (taskCheckbox.querySelector('svg')) {
                        taskCheckbox.removeChild(taskCheckbox.querySelector('svg'));
                    }
                    
                    if (taskTextElement) {
                        taskTextElement.classList.remove('line-through', 'text-gray-500');
                    }
                    
                    taskCheckbox.classList.remove('checked', 'bg-accent', 'border-accent');
                } else if (!checkmark && !taskChecked) {
                    // Check all tasks
                    recursiveUpdate = true;
                    const taskTextElement = taskCheckbox.nextElementSibling;
                    
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute('class', 'w-4 h-4 text-white');
                    svg.setAttribute('viewBox', '0 0 20 20');
                    svg.setAttribute('fill', 'currentColor');
                    
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
                    
                    svg.appendChild(path);
                    taskCheckbox.appendChild(svg);
                    
                    if (taskTextElement) {
                        taskTextElement.classList.add('line-through', 'text-gray-500');
                    }
                    
                    taskCheckbox.classList.add('checked', 'bg-accent', 'border-accent');
                }
            });
            
            if (recursiveUpdate) {
                // Update section progress bar
                const sectionId = section.id.replace('-section', '');
                const progressBar = document.querySelector(`[data-progress-bar="${sectionId}"]`);
                
                if (progressBar) {
                    progressBar.style.width = checkmark ? '0%' : '100%';
                }
                
                // Update total progress
                updateTotalProgress();
            }
        } else {
            // If this is a task checkbox, update the section progress
            updateSectionProgress(checkbox.closest('.checklist-section'));
        }
    }
    
    // Function to update total progress
    function updateTotalProgress() {
        // Get progress for each section individually
        const sections = ['packing', 'accommodation', 'activities'];
        
        sections.forEach((sectionId, index) => {
            // Get tasks for this section
            const tasksContainer = document.getElementById(`${sectionId}-tasks`);
            if (!tasksContainer) return;
            
            const taskCheckboxes = tasksContainer.querySelectorAll('.checkbox');
            if (taskCheckboxes.length === 0) return;
            
            // Count completed tasks for this section
            let completedTasks = 0;
            taskCheckboxes.forEach(checkbox => {
                if (checkbox.querySelector('svg')) {
                    completedTasks++;
                }
            });
            
            // Calculate section progress percentage
            const sectionProgress = Math.round((completedTasks / taskCheckboxes.length) * 100);
            
            // Update the corresponding wave
            const waveId = `progress-wave-${index + 1}`;
            const wave = document.getElementById(waveId);
            
            if (wave) {
                // Update the wave's background color
                if (sectionProgress > 0) {
                    // Update the width based on progress percentage
                    wave.style.background = `linear-gradient(to right, #22c55e ${sectionProgress}%, #bbf7d0 ${sectionProgress}%)`;
                } else {
                    wave.style.background = '#bbf7d0'; // bg-green-200
                }
            }
        });
    }

    // Update progress for a section
    function updateSectionProgress(section) {
        const sectionId = section.id.replace('-section', '');
        const tasksContainer = document.getElementById(`${sectionId}-tasks`);
        if (!tasksContainer) return;
        
        const taskCheckboxes = tasksContainer.querySelectorAll('.checkbox');
        if (taskCheckboxes.length === 0) return;
        
        let completedTasks = 0;
        taskCheckboxes.forEach(checkbox => {
            if (checkbox.querySelector('svg')) {
                completedTasks++;
            }
        });
        
        // Update progress bar
        const progressBar = document.querySelector(`[data-progress-bar="${sectionId}"]`);
        if (progressBar) {
            const progress = Math.round((completedTasks / taskCheckboxes.length) * 100);
            progressBar.style.width = `${progress}%`;
            
            // Update section checkbox
            const sectionCheckbox = section.querySelector('.flex.items-center.gap-4 > .checkbox');
            const sectionTitle = sectionCheckbox ? sectionCheckbox.nextElementSibling : null;
            
            if (progress === 100) {
                if (sectionCheckbox && !sectionCheckbox.querySelector('svg')) {
                    // Check section checkbox without triggering events
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute('class', 'w-4 h-4 text-white');
                    svg.setAttribute('viewBox', '0 0 20 20');
                    svg.setAttribute('fill', 'currentColor');
                    
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
                    
                    svg.appendChild(path);
                    sectionCheckbox.appendChild(svg);
                    sectionCheckbox.classList.add('checked', 'bg-accent', 'border-accent');
                    
                    if (sectionTitle) {
                        sectionTitle.classList.add('line-through', 'text-gray-500');
                    }
                }
            } else if (sectionCheckbox) {
                const checkmark = sectionCheckbox.querySelector('svg');
                if (checkmark) {
                    sectionCheckbox.removeChild(checkmark);
                    sectionCheckbox.classList.remove('checked', 'bg-accent', 'border-accent');
                    
                    if (sectionTitle) {
                        sectionTitle.classList.remove('line-through', 'text-gray-500');
                    }
                }
            }
        }
        
        // Update total progress
        updateTotalProgress();
    }

    // Handle Start Planning button click
    startPlanningBtn.addEventListener('click', () => {
        console.log('Start Planning button clicked'); // Debug log
        
        // Gather all user selections
        userSelections = {
            starting: startingPointInput.value || 'Tbilisi',
            duration: durationInput.value || 'Week',
            budget: budgetInput.value || 'Mid-range',
            accommodation: accommodationInput.value || 'Hotel',
            companions: companionsInput.value || 'Solo',
            preferences: preferencesInput.value,
            transportation: transportationInput.value || 'Public'
        };
        
        // Validate inputs - at least 4 selections must be made
        const filledFields = Object.values(userSelections).filter(value => value).length;
        if (filledFields < 4) {
            alert('Please fill in at least 4 options to create your trip plan');
            return;
        }

        // Update checklist with user-specific tasks
        updateTravelChecklist(userSelections);

        // Adjust main layout for the chat view
        const mainContainer = document.querySelector('.flex.h-full.gap-3');
        
        // Hide query panel 
        queryContainer.classList.add('hidden');
        
        // Adjust chat container to take proper width and position
        chatContainer.classList.remove('hidden');
        chatContainer.classList.remove('mx-auto');
        chatContainer.classList.add('pl-4', 'pr-1');
        
        // Show checklist panel with animation
        if (checklistPanel) {
            checklistPanel.classList.remove('hidden');
            // Ensure animation plays by forcing a reflow
            void checklistPanel.offsetWidth;
            checklistPanel.style.opacity = '1';
            checklistPanel.style.transform = 'translateX(0)';
        }

        // Add initial message to chat
        const initialMessage = `Planning your ${userSelections.budget} trip to Georgia${userSelections.starting !== 'Not in Georgia' ? ' from ' + userSelections.starting : ''} for ${userSelections.duration}`;
        
        chatMessages.innerHTML = '';
        
        // Add AI welcome messages with proper Instagram-style formatting
        setTimeout(() => {
            addMessageToChat(initialMessage, 'ai');
            
            setTimeout(() => {
                showTypingIndicator();
                
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessageToChat("I've mapped out a route from Madrid to Georgia for you! Watch the animation showing your journey from Madrid to Kutaisi, then to Tbilisi, and finally to Gudauri.", 'ai');
                    
                    // Add example user response after a delay
                    setTimeout(() => {
                        addMessageToChat("What natural attractions should I visit in Georgia?", 'user');
                        
                        // Show typing indicator and AI response
                        setTimeout(() => {
                            showTypingIndicator();
                            
                            setTimeout(() => {
                                removeTypingIndicator();
                                addMessageToChat("Georgia has incredible natural attractions! Martvili Canyon in the Samegrelo region is a must-visit with its stunning turquoise waters flowing through limestone cliffs. You can take a boat ride through the narrow gorge and see beautiful waterfalls. It's just 45km from Kutaisi, making it a perfect day trip. Other must-see natural wonders include the Prometheus Cave, Okatse Canyon, and Kazbegi's dramatic mountain landscapes. Would you like more specific information about any of these places?", 'ai');
                                
                                // Continue conversation about Martvili Canyon
                                setTimeout(() => {
                                    addMessageToChat("Tell me more about Martvili Canyon!", 'user');
                                    
                                    setTimeout(() => {
                                        showTypingIndicator();
                                        
                                        setTimeout(() => {
                                            removeTypingIndicator();
                                            addMessageToChat("Martvili Canyon is one of Georgia's most beautiful destinations! Once a bathing spot for the noble Dadiani family, this 2.4km limestone gorge features emerald-green waters, moss-covered walls reaching 40m high, and seven cascading waterfalls. The 700m visitor trail includes two bridges and three viewing platforms. For around 20 GEL, you can take a 15-minute boat ride through the most picturesque section. Best visited in spring or fall to avoid crowds. Nearby, you can also visit Balda Canyon where swimming is permitted. Would you like me to include this in your itinerary?", 'ai');
                                            
                                            // Add final user response to complete the conversation
                                            setTimeout(() => {
                                                addMessageToChat("Yes, definitely add it to my itinerary!", 'user');
                                                
                                                setTimeout(() => {
                                                    showTypingIndicator();
                                                    
                                                    setTimeout(() => {
                                                        removeTypingIndicator();
                                                        addMessageToChat("Great choice! I've added Martvili Canyon to your itinerary. Since you'll be arriving in Kutaisi first, I recommend visiting on your second day in Georgia. Plan for a half-day excursion (about 4-5 hours including travel time). The entrance fee is 20 GEL for foreigners plus 20 GEL for the boat ride. For the best experience, try to arrive early in the morning (it opens at 10am) to avoid crowds. Would you like me to suggest other attractions near Martvili to create a full day trip?", 'ai');
                                                    }, 2000);
                                                }, 1000);
                                            }, 2500);
                                        }, 2000);
                                    }, 1000);
                                }, 2500);
                            }, 1000);
                        }, 1500);
                    }, 2000);
                }, 1500);
            }, 800);
        }, 300);

        // Trigger map resize to ensure proper rendering
        setTimeout(() => {
            chatMap.resize();
            
            // Start the flight animation in the chat view too
            setTimeout(() => {
                startFlightAnimation(chatMap);
            }, 1000);
        }, 500);
    });

    // Simple compatibility function to restart animation
    function startFlightAnimation(map) {
        // This is a simplified version that just reloads the page
        // which will restart the animation automatically
        console.log('Restarting flight animation');
        
        // Reset the map view first
        map.flyTo({
            center: [20, 40],  // Centered between Europe and Asia
            zoom: 3,
            duration: 1000,
            complete: function() {
                // Re-create the animation once the map is repositioned
                map.once('idle', function() {
                    const arc = createFlightAnimation(map);
                });
            }
        });
    }
});