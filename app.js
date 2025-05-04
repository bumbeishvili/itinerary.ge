// Initialize MapLibre GL JS map
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const queryContainer = document.getElementById('query-container');
    const chatContainer = document.getElementById('chat-container');
    const startPlanningBtn = document.getElementById('start-planning-btn');
    
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

        // Show first section by default and hide others
        const packingDetails = document.getElementById('packing-details');
        if (packingDetails && packingDetails.classList.contains('hidden')) {
            toggleSection('packing-details');
        }
        
        const accommodationDetails = document.getElementById('accommodation-details');
        if (accommodationDetails && !accommodationDetails.classList.contains('hidden')) {
            toggleSection('accommodation-details');
        }
        
        const activitiesDetails = document.getElementById('activities-details');
        if (activitiesDetails && !activitiesDetails.classList.contains('hidden')) {
            toggleSection('activities-details');
        }
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

    // Add a popup
    const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup'
    })
        .setLngLat([44.8271, 41.7151])
        .setHTML('<h3 class="font-bold text-lg text-blue-600">Tbilisi, Georgia</h3><p class="text-gray-600">Capital of Georgia</p>')
        .addTo(chatMap);

    marker.setPopup(popup);

    // Error handling
    chatMap.on('error', (e) => {
        console.error('Map error:', e);
    });

    // Toggle section visibility
    window.toggleSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        const sectionHeader = section.closest('.checklist-section').querySelector('.section-header');
        const arrow = sectionHeader.querySelector('svg.transform');
        
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            arrow.classList.add('rotate-180');
        } else {
            arrow.classList.remove('rotate-180');
            section.classList.add('hidden');
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
        const userSelections = {
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

        // Hide query panel and show chat panel
        queryContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');

        // Add initial message to chat
        const chatMessages = document.querySelector('#chat-container .flex-grow');
        const initialMessage = `Planning your ${userSelections.budget} trip to Georgia${userSelections.starting !== 'Not in Georgia' ? ' from ' + userSelections.starting : ''} for ${userSelections.duration}`;
        
        chatMessages.innerHTML = `
            <div class="mb-4">
                <div class="bg-blue-100 rounded-lg p-4 text-blue-700">
                    ${initialMessage}
                </div>
            </div>
        `;

        // Trigger map resize to ensure proper rendering
        setTimeout(() => {
            chatMap.resize();
        }, 100);
    });
});
