import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, X, MessageCircle } from 'lucide-react';
import './AiAssistant.css';

const AiAssistant = ({ transactions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hello! I'm your SpendSense Assistant. How can I help you with your finances today?" }
    ]);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simple local NLP logic
        setTimeout(() => {
            const botResponse = generateResponse(input, transactions);
            setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        }, 600);
    };

    const generateResponse = (query, txs) => {
        const q = query.toLowerCase();
        const expenses = txs.filter(t => t.type === 'expense');

        if (q.includes('spend') || q.includes('spent')) {
            // Category check
            const categories = ['food', 'shopping', 'transport', 'bills', 'entertainment', 'health'];
            const foundCat = categories.find(cat => q.includes(cat));

            if (foundCat) {
                const total = expenses
                    .filter(t => t.category.toLowerCase() === foundCat)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                return `You have spent ₹${total.toLocaleString()} on ${foundCat} in total.`;
            }

            // Total check
            if (q.includes('total') || q.includes('all')) {
                const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                return `Your total expenses across all categories are ₹${total.toLocaleString()}.`;
            }
        }

        if (q.includes('highest') || q.includes('most')) {
            if (expenses.length === 0) return "You haven't recorded any expenses yet.";
            const highest = expenses.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
            return `Your highest single expense was ₹${highest.amount.toLocaleString()} for "${highest.description}" in ${highest.category}.`;
        }

        if (q.includes('status') || q.includes('budget')) {
            return "You can check your current budget usage in the 'Budget Status' chart on the dashboard.";
        }

        return "I'm a simple assistant. Try asking: 'How much did I spend on food?' or 'What was my highest expense?'";
    };

    return (
        <div className="ai-assistant-wrapper">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="ai-chat-window glass-panel"
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                    >
                        <div className="chat-header">
                            <div className="header-info">
                                <Sparkles size={20} color="var(--primary)" />
                                <span>SpendSense AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="close-chat">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message-row ${msg.role}`}>
                                    <div className="avatar">
                                        {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="message-text">
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <input 
                                type="text" 
                                placeholder="Ask me anything..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} className="send-btn">
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button 
                className="ai-toggle-btn glass-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                {!isOpen && <span className="badge">AI</span>}
            </motion.button>
        </div>
    );
};

export default AiAssistant;
