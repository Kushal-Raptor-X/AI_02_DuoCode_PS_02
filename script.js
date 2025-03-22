document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const suggestionChips = document.querySelectorAll('.chip');

    // Sample FAQ data (this would come from the backend in a real implementation)
    const faqData = {
        "password reset": "To reset your password, go to the login page and click on 'Forgot Password'. Follow the instructions sent to your email.",
        "sales reports": "Sales reports can be accessed from the ERP Dashboard. Navigate to Reports > Sales > Generate Report.",
        "hr policies": "HR policies are available in the company knowledge base. You can access them through the Quick Links sidebar.",
        "finance module": "The Finance module includes accounts payable, accounts receivable, and general ledger functions. What specific help do you need with the Finance module?",
        "login issues": "If you're having trouble logging in, ensure your caps lock is off and you're using the correct credentials. If problems persist, contact IT Support at x1234.",
        "vacation request": "Vacation requests should be submitted through the HR module at least two weeks in advance. Go to HR > Time Off > Request New.",
        "expense report": "Expense reports can be submitted via the Finance module. Navigate to Finance > Expenses > New Claim. Attach all required receipts.",
        "system requirements": "Our ERP system works best with Chrome or Firefox browsers. Minimum requirements include 4GB RAM and a stable internet connection."
    };

    // Initialize with a welcome message
    // (First bot message is already in the HTML)

    // Simulate auto-resize for the textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if no content
        if (this.value.length === 0) {
            this.style.height = 'auto';
        }
    });

    // Handle sending messages
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message.length === 0) return;

        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input field after sending
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Process the message and respond
        processMessage(message);
    }

    // Handle send button click
    sendButton.addEventListener('click', sendMessage);

    // Handle enter key press (but allow shift+enter for new lines)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Handle suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const chipText = this.textContent;
            chatInput.value = chipText;
            sendMessage();
        });
    });

    // Handle microphone button (simulated for now)
    micButton.addEventListener('click', function() {
        alert('Voice input would be activated here. This feature requires additional APIs.');
    });

    // Add a message to the chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        
        const avatarImg = document.createElement('img');
        avatarImg.src = sender === 'user' 
            ? 'https://via.placeholder.com/40' 
            : 'https://via.placeholder.com/40';
        avatarImg.alt = sender === 'user' ? 'User Avatar' : 'Bot Avatar';
        
        avatarDiv.appendChild(avatarImg);
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const textDiv = document.createElement('div');
        textDiv.classList.add('message-text');
        textDiv.textContent = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = 'Just now';
        
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Process user message and generate response
    function processMessage(message) {
        // Simulate thinking time
        setTimeout(() => {
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, 500);
    }

    // Generate a response based on user input
    function generateResponse(userMessage) {
        // Simple keyword matching for demo purposes
        userMessage = userMessage.toLowerCase();
        
        // Check against FAQ data
        for (const keyword in faqData) {
            if (userMessage.includes(keyword)) {
                return faqData[keyword];
            }
        }
        
        // Default responses if no keyword match
        if (userMessage.includes('help')) {
            return "I'm here to help with ERP navigation, documentation, and common queries. What specific area do you need assistance with?";
        } else if (userMessage.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with?";
        } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
            return "Hello! How can I assist you with our enterprise systems today?";
        } else {
            return "I don't have information on that specific topic yet. Would you like me to escalate this to our support team?";
        }
    }
});