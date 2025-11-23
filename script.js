document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startPlanningBtn = document.getElementById('startPlanning');
    const preferencesForm = document.getElementById('preferences-form');
    const itineraryDisplay = document.getElementById('itinerary-display');
    const itineraryContent = document.getElementById('itinerary-content');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    const planAnotherBtn = document.getElementById('planAnother');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotHeader = document.getElementById('chatbot-header');
    const toggleChatbotBtn = document.getElementById('toggleChatbot');
    const chatbotContent = document.getElementById('chatbot-content');
    const chatMessages = document.getElementById('chat-messages');
    const userMessageInput = document.getElementById('user-message');
    const sendMessageBtn = document.getElementById('send-message');
    const submitButton = preferencesForm.querySelector('button[type="submit"]');

    // Initialize chatbot state
    let isChatbotMinimized = false;

    // Toggle chatbot visibility
    chatbotHeader.addEventListener('click', () => {
        isChatbotMinimized = !isChatbotMinimized;
        chatbotContainer.classList.toggle('minimized', isChatbotMinimized);
        
        // Store the state in localStorage
        localStorage.setItem('chatbotMinimized', isChatbotMinimized);
    });

    // Check localStorage for previous state
    const savedState = localStorage.getItem('chatbotMinimized');
    if (savedState === 'true') {
        isChatbotMinimized = true;
        chatbotContainer.classList.add('minimized');
    }

    // Scroll to form when Start Planning button is clicked
    startPlanningBtn.addEventListener('click', () => {
        document.getElementById('preferences-form').scrollIntoView({ behavior: 'smooth' });
    });

    // Handle form submission
    preferencesForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button
        submitButton.disabled = true;
        
        try {
            // Get form data
            const formData = {
                destination: document.getElementById('destination').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                duration: document.getElementById('duration').value,
                interests: Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(cb => cb.value),
                budget: document.getElementById('budget').value,
                pace: document.querySelector('input[name="pace"]:checked').value,
                specialConsiderations: document.getElementById('specialConsiderations').value
            };

            // Show loading state in itinerary display
            if (!itineraryDisplay.querySelector('.loading')) {
                itineraryDisplay.innerHTML = '<div class="loading">Generating your personalized itinerary...</div>';
            }
            itineraryDisplay.classList.remove('hidden');

            // Send data to backend
            const response = await fetch('/generate_itinerary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Display the itinerary
            displayItinerary(data.itinerary);

            // Show success message
            // Check if a success message already exists
            if (!preferencesForm.querySelector('.success-message')) {
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Itinerary generated successfully!';
                preferencesForm.appendChild(successMessage);

                setTimeout(() => {
                    successMessage.remove();
                }, 3000);
            }

        } catch (error) {
            console.error('Error:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Error generating itinerary. Please try again.';
            preferencesForm.appendChild(errorMessage);

            setTimeout(() => {
                errorMessage.remove();
            }, 3000);

            // Show error in itinerary display
            itineraryDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    });

    // Handle chat message submission
    sendMessageBtn.addEventListener('click', sendMessage);
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = userMessageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessageToChat('user', message);
        userMessageInput.value = '';

        try {
            // Send message to backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Add AI response to chat
            addMessageToChat('assistant', data.response);
        } catch (error) {
            addMessageToChat('assistant', `Error: ${error.message}`);
        }
    }

    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        // Parse and format the message
        let formattedMessage = message
            // Handle bold text (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Handle italic text (*text*)
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Handle code blocks (`text`)
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Handle line breaks
            .replace(/\n/g, '<br>')
            // Handle links [text](url)
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Handle bullet points
            .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
            // Handle numbered lists
            .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');

        // Wrap list items in appropriate list tags
        if (formattedMessage.includes('<li>')) {
            formattedMessage = formattedMessage.replace(/<li>.*?<\/li>/g, (match) => {
                if (match.match(/^\s*\d+\./)) {
                    return `<ol>${match}</ol>`;
                } else {
                    return `<ul>${match}</ul>`;
                }
            });
        }

        messageDiv.innerHTML = formattedMessage;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatItineraryResponse(response) {
        try {
            // Split the response into days
            const days = response.split(/\n(?=Day \d+:|Day \d+ -)/i);
            
            return days.map(day => {
                // Extract day number and title
                const dayMatch = day.match(/^(Day \d+)(?:[: -])(.*)/i);
                const dayNumber = dayMatch ? dayMatch[1] : 'Day';
                const dayTitle = dayMatch ? dayMatch[2].trim() : '';
                
                // Split the day content into sections
                const sections = day.split(/\n(?=\d+\.|\*|\-|\[)/i);
                
                // Process each section
                const formattedSections = sections.map(section => {
                    // Handle numbered lists
                    if (section.match(/^\d+\./)) {
                        return `<ol class="itinerary-list">${section.split('\n')
                            .filter(line => line.trim())
                            .map(line => {
                                const content = line.replace(/^\d+\.\s*/, '');
                                return `<li>${formatText(content)}</li>`;
                            })
                            .join('')}</ol>`;
                    }
                    
                    // Handle bullet points
                    if (section.match(/^[\*\-]/)) {
                        return `<ul class="itinerary-list">${section.split('\n')
                            .filter(line => line.trim())
                            .map(line => {
                                const content = line.replace(/^[\*\-]\s*/, '');
                                return `<li>${formatText(content)}</li>`;
                            })
                            .join('')}</ul>`;
                    }
                    
                    // Handle links
                    if (section.match(/\[.*\]\(.*\)/)) {
                        return section.replace(
                            /\[(.*?)\]\((.*?)\)/g,
                            '<a href="$2" target="_blank" rel="noopener noreferrer" class="itinerary-link">$1</a>'
                        );
                    }
                    
                    return formatText(section);
                }).join('\n');
                
                return `
                    <div class="itinerary-day">
                        <div class="day-header">
                            <h3>${dayNumber}</h3>
                            <h4>${dayTitle}</h4>
                        </div>
                        <div class="day-content">
                            ${formattedSections}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error formatting itinerary:', error);
            return `<div class="error">Error formatting itinerary. Please try again.</div>`;
        }
    }

    function formatText(text) {
        // Handle bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="itinerary-bold">$1</strong>');
        
        // Handle italic text
        text = text.replace(/\*(.*?)\*/g, '<em class="itinerary-italic">$1</em>');
        
        // Handle code blocks
        text = text.replace(/`(.*?)`/g, '<code class="itinerary-code">$1</code>');
        
        // Handle line breaks
        text = text.replace(/\n/g, '<br>');
        
        // Handle highlights
        text = text.replace(/==(.*?)==/g, '<mark class="itinerary-highlight">$1</mark>');
        
        return text;
    }

    function displayItinerary(itinerary) {
        const itineraryDisplay = document.getElementById('itinerary-display');
        const formattedItinerary = formatItineraryResponse(itinerary);
        
        // Create the itinerary content with animation class
        const itineraryContent = `
            <div class="itinerary-content animate-fade-in">
                <div class="itinerary-header">
                    <h2>Your Travel Itinerary</h2>
                    <p class="itinerary-subtitle">Here's your personalized travel plan</p>
                </div>
                ${formattedItinerary}
                <div id="itinerary-actions" class="itinerary-actions visible">
                    <button id="downloadPdf" class="action-button">
                        <i class="fas fa-download"></i>
                        Download PDF
                    </button>
                    <button id="planAnother" class="action-button">
                        <i class="fas fa-sync"></i>
                        Plan Another Trip
                    </button>
                </div>
            </div>
        `;
        
        itineraryDisplay.innerHTML = itineraryContent;
        itineraryDisplay.classList.remove('hidden');

        // Make buttons visible after itinerary is generated
        const downloadPdfButton = document.getElementById('downloadPdf');
        downloadPdfButton.classList.add('visible');
        const planAnotherButton = document.getElementById('planAnother');
        planAnotherButton.classList.add('visible');

        // Add event listeners for the buttons
        document.getElementById('downloadPdf')?.addEventListener('click', async () => {
            try {
                const button = document.getElementById('downloadPdf');
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';

                const response = await fetch('/download_pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: document.getElementById('itinerary-display').innerHTML
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'travel-itinerary.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                button.innerHTML = '<i class="fas fa-download"></i> Download PDF';
                button.disabled = false;
            } catch (error) {
                console.error('Error downloading PDF:', error);
                const button = document.getElementById('downloadPdf');
                button.innerHTML = '<i class="fas fa-download"></i> Download PDF';
                button.disabled = false;
                
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Error downloading PDF. Please try again.';
                document.getElementById('itinerary-actions').appendChild(errorMessage);
                
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
        });

        document.getElementById('planAnother')?.addEventListener('click', () => {
            // Refresh the page to reset all forms and state
            window.location.reload();
        });
        
        // Add smooth scroll to the itinerary
        itineraryDisplay.scrollIntoView({ behavior: 'smooth' });
    }
});