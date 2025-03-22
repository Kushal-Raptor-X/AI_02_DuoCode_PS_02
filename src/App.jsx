import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  // Access the API key from environment variables
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [faqContent, setFaqContent] = useState('')

  // Load FAQ content when component mounts
  useEffect(() => {
    loadFaqContent()
  }, [])

  // Load FAQ content from DOCX text file
  const loadFaqContent = async () => {
    try {
      const response = await fetch('/assets/FAQs.docx')
      const text = await response.text()
      setFaqContent(text)
    } catch (error) {
      console.error('Error loading FAQ content:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error loading FAQ content. Please make sure the FAQs.docx file is in the public/assets folder.'
      }])
    }
  }

  // Handle sending messages
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    // Add user message
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
      
      // Create prompt with context from FAQs
      const prompt = `
        You are an AI assistant that uses the provided knowledge base to answer questions.
        Knowledge base:
        ${faqContent}
        
        Answer the following question in a helpful, concise way. If the answer is not in the knowledge base, 
        politely say so and provide a general response if possible.
        
        User question: ${input}
      `
      
      // Generate response
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()
      
      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again later.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI Sentinel of Knowledge</h1>
      </div>
      
      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to AI Sentinel of Knowledge!</h2>
              <p>Ask me anything about the FAQs. I'm here to help.</p>
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
        </div>
        
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about the FAQs..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading}>
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
