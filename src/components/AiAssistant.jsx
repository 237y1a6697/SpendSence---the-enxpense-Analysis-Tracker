import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, X, MessageCircle } from 'lucide-react';
import './AiAssistant.css';

// ─── Suggestion chips shown at the bottom of the chat ────────────────────────
const SUGGESTIONS = [
    'How much did I spend this month?',
    'What is my highest expense?',
    'Show spending by category',
    'How much did I spend on food?',
    'What is my total income?',
    'How many transactions do I have?',
    'What was my last purchase?',
    'Am I over budget?',
    'What did I spend on shopping?',
    'Average daily spend?',
];

// ─── Core NLP engine ─────────────────────────────────────────────────────────
const generateResponse = (query, txs = []) => {
    const q = query.toLowerCase().trim();
    const currency = '₹';

    const expenses = txs.filter(t => t.type === 'expense');
    const incomes = txs.filter(t => t.type === 'income');
    const allAmounts = txs.map(t => Math.abs(t.amount));

    // Helper: sum amounts
    const sum = arr => arr.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Helper: format currency
    const fmt = v => `${currency}${Math.round(v).toLocaleString('en-IN')}`;

    // Helper: get category from query
    const CATEGORY_KEYWORDS = {
    food: ['food', 'restaurant', 'eat', 'meal', 'groceries'],
    shopping: ['shopping', 'buy', 'purchase', 'clothes'],
    transport: ['transport', 'travel', 'uber', 'bus', 'cab', 'fuel'],
    bills: ['bill', 'electricity', 'water', 'rent'],
    entertainment: ['movie', 'entertainment', 'netflix', 'game'],
    health: ['hospital', 'medicine', 'doctor', 'health'],
    salary: ['salary', 'income', 'pay'],
    miscellaneous: ['misc', 'other']
};

let foundCat = null;
for (const cat in CATEGORY_KEYWORDS) {
    if (CATEGORY_KEYWORDS[cat].some(word => q.includes(word))) {
        foundCat = cat;
        break;
    }
}

    // Helper: filter by period
    const now = new Date();
    const filterPeriod = (arr, period) => arr.filter(t => {
        const d = new Date(t.date);
        if (period === 'today') return d.toDateString() === now.toDateString();
        if (period === 'week') return now - d <= 7 * 86400000;
        if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (period === 'year') return d.getFullYear() === now.getFullYear();
        return true;
    });

    const periodKey =
        (q.includes('today')) ? 'today' :
            (q.includes('week') || q.includes('weekly')) ? 'week' :
                (q.includes('month') || q.includes('monthly')) ? 'month' :
                    (q.includes('year') || q.includes('yearly')) ? 'year' : 'all';

    const periodLabel = { today: 'today', week: 'this week', month: 'this month', year: 'this year', all: 'in total' }[periodKey];

    // ── 1. Total spend / expenses ───────────────────────────────────────────
    if ((q.includes('spend') || q.includes('spent') || q.includes('expense')) && !foundCat) {
        const filtered = filterPeriod(expenses, periodKey);
        if (filtered.length === 0) return `You have no expenses recorded ${periodLabel}.`;
        return `You have spent **${fmt(sum(filtered))}** ${periodLabel} across ${filtered.length} transaction(s).`;
    }

    // ── 2. Category-specific spend ──────────────────────────────────────────
    if (foundCat && (q.includes('spend') || q.includes('spent') || q.includes('on') || q.includes('how much'))) {
        const catTxs = filterPeriod(expenses, periodKey).filter(t => t.category?.toLowerCase() === foundCat);
        if (catTxs.length === 0) return `No ${foundCat} expenses found ${periodLabel}.`;
        return `You spent **${fmt(sum(catTxs))}** on **${foundCat}** ${periodLabel} (${catTxs.length} transaction(s)).`;
    }

    // ── 3. Highest / biggest expense ────────────────────────────────────────
    if (q.includes('highest') || q.includes('biggest') || q.includes('most expensive') || q.includes('largest')) {
        const pool = filterPeriod(expenses, periodKey);
        if (pool.length === 0) return `No expenses recorded ${periodLabel}.`;
        const top = pool.reduce((p, c) => Math.abs(p.amount) > Math.abs(c.amount) ? p : c);
        return `Your biggest expense ${periodLabel} was **${fmt(top.amount)}** for "${top.description}" (${top.category}).`;
    }

    // ── 4. Lowest expense ────────────────────────────────────────────────────
    if (q.includes('lowest') || q.includes('cheapest') || q.includes('smallest')) {
        const pool = filterPeriod(expenses, periodKey);
        if (pool.length === 0) return `No expenses recorded ${periodLabel}.`;
        const low = pool.reduce((p, c) => Math.abs(p.amount) < Math.abs(c.amount) ? p : c);
        return `Your smallest expense ${periodLabel} was **${fmt(low.amount)}** for "${low.description}" (${low.category}).`;
    }

    // ── 5. How many transactions ─────────────────────────────────────────────
    if (q.includes('how many') || q.includes('number of') || q.includes('count')) {
        const pool = filterPeriod(txs, periodKey);
        const exp = pool.filter(t => t.type === 'expense').length;
        const inc = pool.filter(t => t.type === 'income').length;
        return `You have **${pool.length} transaction(s)** ${periodLabel}: ${exp} expense(s) and ${inc} income(s).`;
    }

    // ── 6. Income ────────────────────────────────────────────────────────────
    if (q.includes('income') || q.includes('earned') || q.includes('salary') || q.includes('earning')) {
        const pool = filterPeriod(incomes, periodKey);
        if (pool.length === 0) return `No income recorded ${periodLabel}.`;
        return `Your total income ${periodLabel} is **${fmt(sum(pool))}** from ${pool.length} source(s).`;
    }

    // ── 7. Net savings / balance ─────────────────────────────────────────────
    if (q.includes('save') || q.includes('saving') || q.includes('balance') || q.includes('net') || q.includes('left')) {
        const poolInc = filterPeriod(incomes, periodKey);
        const poolExp = filterPeriod(expenses, periodKey);
        const net = sum(poolInc) - sum(poolExp);
        const sign = net >= 0 ? '✅ Saved' : '⚠️ Overspent by';
        return `${sign} **${fmt(Math.abs(net))}** ${periodLabel}. Total income: ${fmt(sum(poolInc))}, total expenses: ${fmt(sum(poolExp))}.`;
    }

    // ── 8. Budget / over budget ──────────────────────────────────────────────
    if (q.includes('budget') || q.includes('over budget') || q.includes('limit')) {
        const totalSpent = sum(filterPeriod(expenses, periodKey));
        return `You have spent **${fmt(totalSpent)}** ${periodLabel}. Check the Budget Status donut chart on your dashboard for your budget utilisation percentage.`;
    }

    // ── 9. Average spend ─────────────────────────────────────────────────────
    if (q.includes('average') || q.includes('avg')) {
        const pool = filterPeriod(expenses, periodKey);
        if (pool.length === 0) return `No expenses to average ${periodLabel}.`;
        const avg = sum(pool) / pool.length;
        return `Your average expense ${periodLabel} is **${fmt(avg)}** per transaction.`;
    }

    // ── 10. Category breakdown ───────────────────────────────────────────────
    if (q.includes('breakdown') || q.includes('category') || q.includes('categories') || q.includes('by category')) {
        const pool = filterPeriod(expenses, periodKey);
        if (pool.length === 0) return `No expenses to break down ${periodLabel}.`;
        const catMap = pool.reduce((acc, t) => {
            const cat = t.category || 'Miscellaneous';
            acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
            return acc;
        }, {});
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const lines = sorted.map(([cat, val]) => `• ${cat}: ${fmt(val)}`).join('\n');
        return `Spending breakdown ${periodLabel}:\n${lines}`;
    }

    // ── 11. Recent / last purchase ───────────────────────────────────────────
    if (q.includes('last') || q.includes('recent') || q.includes('latest')) {
        const sorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sorted.length === 0) return "No transactions recorded yet.";
        const t = sorted[0];
        const d = new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `Your most recent transaction was **${fmt(t.amount)}** for "${t.description}" (${t.category}) on ${d}.`;
    }

    // ── 12. Top spending category ────────────────────────────────────────────
    if (q.includes('top') || q.includes('most spent') || q.includes('where do i spend')) {
        const pool = filterPeriod(expenses, periodKey);
        if (pool.length === 0) return `No expenses ${periodLabel}.`;
        const catMap = pool.reduce((acc, t) => {
            const cat = t.category || 'Misc';
            acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
            return acc;
        }, {});
        const top = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
        return `Your top spending category ${periodLabel} is **${top[0]}** with ${fmt(top[1])}.`;
    }

    // ── 13. Total transactions count ─────────────────────────────────────────
    if (q.includes('total transactions') || q.includes('all transactions')) {
        return `You have **${txs.length}** total transactions recorded (${expenses.length} expenses, ${incomes.length} income).`;
    }

    // ── 14. Hello / greet ────────────────────────────────────────────────────
    if (q.match(/^(hi|hello|hey|good morning|good evening|sup|yo)\b/)) {
        return `Hello! 👋 I'm your SpendSense AI Assistant. You can ask me things like:\n• "How much did I spend this month?"\n• "What is my highest expense?"\n• "Show spending by category"\n• "What is my total income?"\n• "How much did I spend on food?"`;
    }

    // ── 15. Help / what can you do ───────────────────────────────────────────
    if (q.includes('help') || q.includes('what can you') || q.includes('commands') || q.includes('what do you do')) {
        return `I can answer questions about your finances! Try:\n• "How much did I spend this month?"\n• "What is my biggest expense?"\n• "Show category breakdown"\n• "What is my total income?"\n• "How much did I spend on food/transport/bills?"\n• "What is my average spend?"\n• "What was my last purchase?"\n• "Am I over budget?"\n\nYou can also add time filters like "this week", "this month", "today", "this year".`;
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    return `I couldn't fully understand that. Try asking:\n• "How much did I spend this month?"\n• "What is my highest expense?"\n• "Show spending by category"\n• "How much did I spend on food?"\n\nType **help** to see everything I can do!`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const AiAssistant = ({ transactions = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hello! 👋 I'm your SpendSense AI Assistant. Ask me anything about your spending, income, or transactions!\n\nTry: \"How much did I spend this month?\" or \"Show category breakdown\"." }
    ]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = (text) => {
        const msg = text || input;
        if (!msg.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const botResponse = generateResponse(msg, transactions);
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        }, 650);
    };

    const renderText = (text) =>
        text.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
                <span key={i}>
                    {parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            );
        });

    return (
        <div className="ai-assistant-wrapper">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-chat-window glass-panel"
                        initial={{ opacity: 0, y: 80, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 80, scale: 0.85 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="chat-header">
                            <div className="header-info">
                                <Sparkles size={20} color="var(--primary)" />
                                <span>SpendSense AI</span>
                                <span style={{ fontSize: '0.7rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '999px', marginLeft: '4px' }}>SMART</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="close-chat">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message-row ${msg.role}`}>
                                    <div className="avatar">
                                        {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="message-text">
                                        {renderText(msg.text)}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="message-row bot">
                                    <div className="avatar"><Bot size={16} /></div>
                                    <div className="message-text typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Suggestion Chips */}
                        <div className="suggestion-chips">
                            {SUGGESTIONS.slice(0, 4).map((s, i) => (
                                <button key={i} className="chip-btn" onClick={() => sendMessage(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                placeholder="Ask me anything about your finances..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={() => sendMessage()} className="send-btn" disabled={!input.trim()}>
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
