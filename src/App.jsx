import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { GoogleGenerativeAI } from '@google/generative-ai'
import knowledgeBase from './knowledgeBase.json'
import './App.css'

// Add GitHub SVG icon component
const GitHubIcon = () => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="white" 
      className="github-icon"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
};

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showHumanSupportPrompt, setShowHumanSupportPrompt] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: '',
    query: ''
  })
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [showAboutModal, setShowAboutModal] = useState(false)
  const messagesEndRef = useRef(null)
  const [theme, setTheme] = useState(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme')
    // Check system preference if no saved preference
    if (!savedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return savedTheme
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showHumanSupportPrompt])

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const modal = document.querySelector('.about-modal')
      if (modal && !modal.contains(event.target) && event.target.className !== 'about-button') {
        setShowAboutModal(false)
      }
    }
    
    if (showAboutModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAboutModal])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Toggle about modal
  const toggleAboutModal = () => {
    setShowAboutModal(prev => !prev)
  }

  // Convert knowledge base to formatted text
  const knowledgeBaseContent = Object.entries(knowledgeBase.KnowledgeBase)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n')

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion)
    sendMessage(suggestion)
  }

  // Generate suggestions based on the last interaction
  const generateSuggestions = async (lastResponse) => {
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })

      const suggestionPrompt = `Based on this last response about IDMS ERP and GST:
      "${lastResponse}"
      
      Generate 3 short, natural follow-up questions that a user might ask next. 
      Return only the questions, one per line, without numbers or bullets.
      Keep them concise and conversational.`

      const result = await model.generateContent(suggestionPrompt)
      const suggestionsText = result.response.text()
      const newSuggestions = suggestionsText.split('\n').filter(s => s.trim())
      setSuggestions(newSuggestions.slice(0, 3))
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setSuggestions([])
    }
  }

  // Check if the response indicates no information found
  const checkIfNoInfoFound = (response) => {
    const noInfoPhrases = [
      "not in knowledge base",
      "don't have info",
      "cannot find",
      "no information",
      "unavailable",
      "not covered",
      "no details",
      "insufficient data",
      "not available",
      "no specific",
      "lack information",
      "don't know",
      "not found",
      "sorry, I can't",
      "unable to provide",
      "not mentioned",
      "no data",
      "outside my knowledge",
      "no content",
      "cannot answer",
      "sorry"
    ]
    
    return noInfoPhrases.some(phrase => response.toLowerCase().includes(phrase.toLowerCase()))
  }

  // Handle sending messages
  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return
    
    // Add user message
    const userMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSuggestions([]) // Clear suggestions while loading
    setShowHumanSupportPrompt(false) // Hide human support prompt
    setLastQuery(messageText) // Store the query for contact form
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

      // Format the knowledge base as context for Gemini
      const prompt = `You are an AI assistant that helps answer questions about IDMS ERP and GST compliance.
      Use the following knowledge base to answer questions:
      
      ${knowledgeBaseContent}
      
      IntroContext: ${knowledgeBase.IntroContext}
      
      User: ${messageText}
      
      Provide a helpful, concise response. If the information is not in the knowledge base, politely say so.`

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })
      const result = await model.generateContent(prompt)
      const response = result.response.text()
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }])

      // Check if the response indicates no information found
      if (checkIfNoInfoFound(response)) {
        setShowHumanSupportPrompt(true)
      } else {
        // Generate suggestions based on the response
        await generateSuggestions(response)
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please check your API key and try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle human support request
  const handleHumanSupportRequest = (wantsSupport) => {
    if (wantsSupport) {
      // Show contact form
      setShowContactForm(true)
      // Update contact form with last query
      setContactFormData(prev => ({
        ...prev,
        query: lastQuery
      }))
    } else {
      // User declined support, hide prompt and continue
      setShowHumanSupportPrompt(false)
      // Maybe generate suggestions for another approach
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I understand. Feel free to ask another question, and I\'ll do my best to assist you with the information I have.'
      }])
      // Generate new suggestions
      generateSuggestions('Ask another question about IDMS ERP and GST compliance')
    }
  }

  // Handle contact form input changes
  const handleContactInputChange = (e) => {
    const { name, value } = e.target
    setContactFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle contact form submission
  const handleContactSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the form data to a backend API
    console.log('Contact form submitted:', contactFormData)
    
    // Show confirmation message
    setShowContactForm(false)
    setShowSubmitConfirmation(true)
    
    // Reset form data
    setContactFormData({
      name: '',
      email: '',
      phone: '',
      query: lastQuery
    })
    
    // Add a message to the chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Thank you for your details. Our L1 support team will get back to you soon via your provided contact information.'
    }])
    
    // Hide confirmation after a delay
    setTimeout(() => {
      setShowSubmitConfirmation(false)
      // Generate new suggestions after submission
      generateSuggestions('Continue conversation after human support request')
    }, 5000)
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Sentinel Prime</h1>
        <div className="header-buttons">
          <button className="about-button" onClick={toggleAboutModal}>
            About
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>
      
      {showAboutModal && (
        <div className="about-modal">
          <div className="about-content">
            <h2>About This Project</h2>
            <p>This is a project developed by DuoCode for AiCoLegion's HackAiThon 3.0</p>
            <p>Sentinel Prime is an AI-powered assistant specializing in IDMS ERP and GST compliance, providing intelligent responses and support.</p>
            
            <div className="team-section">
              <h3>Meet Our Team</h3>
              <div className="team-members">
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="team-member-button"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://github.com/Kushal-Raptor-X', '_blank');
                  }}
                >
                  <GitHubIcon /> Kushal Naik
                </a>
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="team-member-button"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://github.com/Puneet-26', '_blank');
                  }}
                >
                  <GitHubIcon /> Puneet Dhongade
                </a>
              </div>
            </div>
            
            <button className="close-modal-button" onClick={toggleAboutModal}>
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to Sentinel Prime!</h2>
              <p>Hello! I'm here to assist you with your queries about IDMS ERP and GST compliance. How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              {message.role === 'user' ? (
                <div className="message-content">
                  <span className="message-role">You:</span>
                  <p>{message.content}</p>
                </div>
              ) : (
                <div className="message-content">
                  <span className="message-role">AI Sentinel:</span>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content">
                <span className="message-role">AI Sentinel:</span>
                <div className="loading">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          {showHumanSupportPrompt && !isLoading && (
            <div className="message assistant-message human-support-prompt">
              <div className="message-content">
                <span className="message-role">AI Sentinel:</span>
                <p>I couldn't find a specific answer to your question in my knowledge base. Would you like to get help from a human support agent (L1)?</p>
                <div className="support-buttons">
                  <button 
                    className="support-button support-yes" 
                    onClick={() => handleHumanSupportRequest(true)}
                  >
                    Yes, connect with support
                  </button>
                  <button 
                    className="support-button support-no" 
                    onClick={() => handleHumanSupportRequest(false)}
                  >
                    No, thanks
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showContactForm && (
            <div className="message assistant-message contact-form-container">
              <div className="message-content">
                <span className="message-role">AI Sentinel:</span>
                <p>Please provide your contact details so our support team can reach out to you:</p>
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactInputChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={contactFormData.phone}
                      onChange={handleContactInputChange}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="query">Your Query</label>
                    <textarea
                      id="query"
                      name="query"
                      value={contactFormData.query}
                      onChange={handleContactInputChange}
                      required
                      placeholder="Describe your question in detail"
                      rows="3"
                    ></textarea>
                  </div>
                  <button type="submit" className="contact-submit-button">
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {showSubmitConfirmation && (
            <div className="message assistant-message">
              <div className="message-content">
                <span className="message-role">AI Sentinel:</span>
                <div className="confirmation-message">
                  <p>✅ Your request has been submitted successfully!</p>
                  <p>Our support team will contact you soon.</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="suggestions-container">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            disabled={isLoading || showContactForm}
          />
          <button 
            onClick={() => sendMessage()} 
            disabled={isLoading || showContactForm}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
