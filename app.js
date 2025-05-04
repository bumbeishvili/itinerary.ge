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
        
        // Responses to common questions
        if (userMessage.includes('hotel') || userMessage.includes('stay') || userMessage.includes('accommodation')) {
            return "I see you're interested in accommodation. I notice your checklist doesn't have specific hotel bookings yet. I recommend adding 'Book hotel in Tbilisi' to your accommodation tasks. Would you like me to suggest some options based on your budget?";
        } else if (userMessage.includes('food') || userMessage.includes('restaurant') || userMessage.includes('eat')) {
            return "Regarding food options, I notice your plan doesn't include any restaurant reservations. Georgia is famous for khachapuri, khinkali, and wine. Would you like me to add 'Research top-rated Georgian restaurants' to your checklist?";
        } else if (userMessage.includes('transport') || userMessage.includes('get around') || userMessage.includes('travel')) {
            return "About transportation - I see this is incomplete in your plan. In Tbilisi, you can use the metro, buses, or taxis. For traveling between cities, marshrutkas (minibuses) are common. Should I add 'Download Tbilisi public transport app' to your tasks?";
        } else if (userMessage.includes('activity') || userMessage.includes('do') || userMessage.includes('visit')) {
            return "I notice your activities section is missing some key attractions. Based on your interests, I recommend adding the Old Town, Narikala Fortress, and a day trip to Mtskheta to your itinerary. Would you like me to update your checklist?";
        } else if (userMessage.includes('wine') || userMessage.includes('drink')) {
            return "It looks like we haven't planned your wine experiences yet! Georgia is the birthplace of wine with 8,000 years of winemaking history. A visit to Kakheti wine region is missing from your plan. Should I add a wine tour to your checklist?";
        } else if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
            return "Hello! I notice your travel plan still has some missing elements. Would you like me to help complete your Georgia itinerary? We still need to add specific attractions and restaurant recommendations.";
        } else if (userMessage.includes('thank')) {
            return "You're welcome! I'm still noticing some gaps in your travel plans though. Your checklist doesn't include emergency contacts or travel insurance details. Would you like me to help you complete these missing items?";
        } else {
            // Return a random "something is missing" response
            return missingElementResponses[Math.floor(Math.random() * missingElementResponses.length)];
        }
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

    // Add a marker for Tbilisi
    const marker = new maplibregl.Marker({
        color: "#2563EB",
        draggable: false
    })
        .setLngLat([44.8271, 41.7151])
        .addTo(chatMap);

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
                    addMessageToChat("I notice some elements are missing from your travel plan. Looking at your checklist, you still need to add specific activities and restaurant reservations. Would you like me to help you complete these?", 'ai');
                    
                    // Add example user response after a delay
                    setTimeout(() => {
                        addMessageToChat("Yes, could you recommend some restaurants in Tbilisi?", 'user');
                        
                        // Show typing indicator and AI response
                        setTimeout(() => {
                            showTypingIndicator();
                            
                            setTimeout(() => {
                                removeTypingIndicator();
                                addMessageToChat("Of course! For traditional Georgian cuisine, I recommend Salobie Bia for their amazing lobio (bean stew) and Shavi Lomi for authentic dishes with a modern twist. For khinkali (dumplings), try Pasanauri or Zakhar Zakharich. Should I add 'Make reservation at Georgian restaurant' to your checklist?", 'ai');
                            }, 2000);
                        }, 1000);
                    }, 1500);
                }, 1500);
            }, 800);
        }, 300);

        // Trigger map resize to ensure proper rendering
        setTimeout(() => {
            chatMap.resize();
        }, 100);
    });
});
