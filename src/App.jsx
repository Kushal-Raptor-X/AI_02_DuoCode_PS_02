import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { GoogleGenerativeAI } from '@google/generative-ai'
import knowledgeBase from './knowledgeBase.json'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Convert knowledge base to formatted text
  const knowledgeBaseContent = Object.entries(knowledgeBase.KnowledgeBase)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n')

  // Handle sending messages
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    // Add user message
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

      // Format the knowledge base as context for Gemini
      const prompt = `You are an AI assistant that helps answer questions about IDMS ERP and GST compliance.
      Use the following knowledge base to answer questions:
      
      ${knowledgeBaseContent}
      
      IntroContext: ${knowledgeBase.IntroContext}
      
      User: ${input}
      
      Provide a helpful, concise response. If the information is not in the knowledge base, politely say so.`

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })
      const result = await model.generateContent(prompt)
      const response = result.response.text()
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }])
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
              <p>Ask me anything about our knowledge base. I'm here to help.</p>
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
            placeholder="Ask a question..."
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
