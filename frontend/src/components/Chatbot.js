
import { useState } from "react";
import API from "../config";
import "./Chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Dentify AI. I can help you find dentists and view your appointments. How can I help?",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();

    const text = message.trim();

    if (!text || loading) return;

    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please log in to use the AI assistant.",
        },
      ]);
      return;
    }

    // Save the previous conversation before adding the new message.
    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-10);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Chat request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dentify-chatbot">

      {!isOpen && (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI assistant"
        >
          <span>💬</span>
          <span>Ask AI</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">

          <div className="chatbot-header">
            <div>
              <h3>Dentify AI</h3>
              <small>Your Dentist Assistant</small>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`chat-message ${item.role}`}
              >
                <div className="message-bubble">
                  {item.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <div className="message-bubble">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            className="chatbot-input"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about dentists or appointments..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
            >
              Send
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
