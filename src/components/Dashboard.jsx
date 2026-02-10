import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShoppingBag, Utensils, Car, MoreHorizontal, Bell, Home, Clock, User, Plus, Settings, Wallet, Search, Sun, Moon, TrendingUp, Shield } from 'lucide-react';
import { cloudService } from '../CloudService';
import Analytics from './Analytics';
import BudgetModal from './BudgetModal';
import AddTransactionModal from './AddTransactionModal';
import SecurityModal from './SecurityModal';
import './Dashboard.css';

const Dashboard = ({ initialSection = 'dashboard' }) => {
    const navigate = useNavigate();
    const [budget, setBudget] = useState({ total: 50000, spent: 35000, currency: '₹' });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);
    const [activeNav, setActiveNav] = useState(initialSection);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const b = await cloudService.getBudget();
            const t = await cloudService.getTransactions();
            setBudget(b);
            setTransactions(t);
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setActiveNav(initialSection);
    }, [initialSection]);

    const percentage = Math.round((budget.spent / budget.total) * 100);
    const pieData = [
        { name: 'Spent', value: budget.spent },
        { name: 'Remaining', value: budget.total - budget.spent },
    ];

    const trendData = [
        { name: 'Mon', amount: 4000 },
        { name: 'Tue', amount: 3000 },
        { name: 'Wed', amount: 2000 },
        { name: 'Thu', amount: 2780 },
        { name: 'Fri', amount: 1890 },
        { name: 'Sat', amount: 2390 },
        { name: 'Sun', amount: 3490 },
    ];

    const getIcon = (name) => {
        switch (name) {
            case 'shopping-bag': return <ShoppingBag size={20} />;
            case 'utensils': return <Utensils size={20} />;
            case 'car': return <Car size={20} />;
            default: return <MoreHorizontal size={20} />;
        }
    };

    const getIconColor = (name) => {
        switch (name) {
            case 'shopping-bag': return '#fcd34d';
            case 'utensils': return '#d8b4fe';
            case 'car': return '#67e8f9';
            default: return '#cbd5e1';
        }
    }

    const handleBudgetClick = () => {
        setShowBudgetModal(true);
    }

    const handleSaveBudget = (newTotal) => {
        const updated = { ...budget, total: newTotal };
        setBudget(updated);
        cloudService.updateBudget(updated);
    }

    const handleSaveTransaction = (newTx) => {
        const updatedTxs = [newTx, ...transactions];
        setTransactions(updatedTxs);
        const newSpent = budget.spent + newTx.amount;
        const updatedBudget = { ...budget, spent: newSpent };
        setBudget(updatedBudget);
        cloudService.updateBudget(updatedBudget);
        cloudService.addTransaction(newTx);
    }

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.classList.toggle('light-mode');
    }

    const handleNavClick = (navItem) => {
        setActiveNav(navItem);
        const routes = {
            'dashboard': '/dashboard',
            'history': '/dashboard/history',
            'analytics': '/dashboard/analytics',
            'profile': '/dashboard/profile',
            'settings': '/dashboard/settings',
        };
        navigate(routes[navItem]);
    }

    if (loading) return <div className="loading">Loading Cloud Data...</div>;

    return (
        <div className="desktop-layout">
            {/* Sidebar */}
            <aside className="sidebar glass-panel">
                <div className="logo-area" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <Wallet size={28} className="logo-icon" />
                    <h2 className="logo-text">SpendSense</h2>
                </div>

                <nav className="sidebar-nav">
                    <div
                        className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleNavClick('dashboard')}
                    >
                        <Home size={20} /> Dashboard
                    </div>
                    <div
                        className={`nav-item ${activeNav === 'history' ? 'active' : ''}`}
                        onClick={() => handleNavClick('history')}
                    >
                        <Clock size={20} /> History
                    </div>
                    <div
                        className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
                        onClick={() => handleNavClick('analytics')}
                    >
                        <TrendingUp size={20} /> Analytics
                    </div>
                    <div
                        className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`}
                        onClick={() => handleNavClick('profile')}
                    >
                        <User size={20} /> Profile
                    </div>
                    <div
                        className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
                        onClick={() => handleNavClick('settings')}
                    >
                        <Settings size={20} /> Settings
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-mini" onClick={() => handleNavClick('profile')} style={{ cursor: 'pointer' }}>
                        <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User" className="avatar-sm" />
                        <div className="user-details-mini">
                            <span>User</span>
                            <span className="sub">Free Plan</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Header */}
                <header className="top-header">
                    <div className="header-search">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search transactions..." className="search-input" />
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn-header" onClick={toggleTheme} title="Toggle Theme">
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="icon-btn-header"><Bell size={20} /></button>
                        <button className="glass-button btn-sm outline" onClick={() => setShowTxModal(true)}>+ Transaction</button>
                        <button className="glass-button btn-sm" onClick={handleBudgetClick}>+ Add Budget</button>
                    </div>
                </header>

                {/* Render different content based on activeNav */}
                {activeNav === 'dashboard' && (
                    <DashboardContent
                        budget={budget}
                        transactions={transactions.slice(0, 5)}
                        percentage={percentage}
                        pieData={pieData}
                        trendData={trendData}
                        getIcon={getIcon}
                        getIconColor={getIconColor}
                        onViewAll={() => handleNavClick('history')}
                    />
                )}

                {activeNav === 'history' && <HistoryPage transactions={transactions} budget={budget} getIcon={getIcon} getIconColor={getIconColor} />}
                {activeNav === 'analytics' && <Analytics />}
                {activeNav === 'profile' && <ProfilePage />}
                {activeNav === 'settings' && <SettingsPage isDark={isDark} toggleTheme={toggleTheme} onManageSecurity={() => setShowSecurityModal(true)} />}
            </main>

            <BudgetModal
                isOpen={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                currentBudget={budget}
                onSave={handleSaveBudget}
            />

            <AddTransactionModal
                isOpen={showTxModal}
                onClose={() => setShowTxModal(false)}
                onSave={handleSaveTransaction}
            />

            <SecurityModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
            />
        </div>
    );
};

// Dashboard Content Component
const DashboardContent = ({ budget, transactions, percentage, pieData, trendData, getIcon, getIconColor, onViewAll }) => (
    <div className="content-grid">
        <div className="stats-row">
            <StatCard label="Total Budget" value={`${budget.currency}${budget.total.toLocaleString()}`} change="+2.5%" color="blue" />
            <StatCard label="Total Spent" value={`${budget.currency}${budget.spent.toLocaleString()}`} change="+12%" color="pink" />
            <StatCard label="Remaining" value={`${budget.currency}${(budget.total - budget.spent).toLocaleString()}`} change="-5%" color="green" />
        </div>

        <div className="charts-row">
            <motion.div className="chart-card glass-panel wide" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-header">
                    <h3>Spending Trend</h3>
                    <select className="period-select">
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Past Year</option>
                        <option>This Year</option>
                        <option>Past 5 Years</option>
                    </select>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                            <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAmount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div className="chart-card glass-panel narrow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3>Budget Status</h3>
                <div className="donut-wrapper">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                <Cell key="spent" fill="#ec4899" />
                                <Cell key="remaining" fill="#334155" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                        <span className="big-perc">{percentage}%</span>
                        <span className="label">Used</span>
                    </div>
                </div>
                <div className="budget-summary">
                    <div className="limit-item">
                        <span className="dot dot-spent"></span> Spent: {budget.currency}{budget.spent}
                    </div>
                    <div className="limit-item">
                        <span className="dot dot-remain"></span> Left: {budget.currency}{budget.total - budget.spent}
                    </div>
                </div>
            </motion.div>
        </div>

        <div className="transactions-row">
            <div className="section-header">
                <h3>Recent Transactions</h3>
                <button onClick={onViewAll} className="view-all-btn">View All</button>
            </div>
            <div className="tx-grid-header">
                <span>Category</span>
                <span>Date</span>
                <span>Status</span>
                <span className="align-right">Amount</span>
            </div>
            <div className="tx-list">
                {transactions.map((tx, i) => (
                    <motion.div key={tx.id} className="tx-row-item glass-panel"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    >
                        <div className="tx-col-main">
                            <div className="tx-icon-sm" style={{ backgroundColor: getIconColor(tx.icon) }}>{getIcon(tx.icon)}</div>
                            <span>{tx.category}</span>
                        </div>
                        <div className="tx-col-date">{tx.date.split(',')[0]}</div>
                        <div className="tx-col-status"><span className="badge-success">Completed</span></div>
                        <div className="tx-col-amount align-right">- {budget.currency}{tx.amount}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
);

// History Page
const HistoryPage = ({ transactions, budget, getIcon, getIconColor }) => (
    <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="page-title">Transaction History</h2>
        <div className="history-container glass-panel">
            <div className="tx-grid-header">
                <span>Category</span>
                <span>Date</span>
                <span>Status</span>
                <span className="align-right">Amount</span>
            </div>
            <div className="tx-list">
                {transactions.map((tx, i) => (
                    <div key={tx.id} className="tx-row-item glass-panel">
                        <div className="tx-col-main">
                            <div className="tx-icon-sm" style={{ backgroundColor: getIconColor(tx.icon) }}>{getIcon(tx.icon)}</div>
                            <span>{tx.category}</span>
                        </div>
                        <div className="tx-col-date">{tx.date}</div>
                        <div className="tx-col-status"><span className="badge-success">Completed</span></div>
                        <div className="tx-col-amount align-right">- {budget.currency}{tx.amount}</div>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

// Profile Page
const ProfilePage = () => (
    <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="page-title">Profile</h2>
        <div className="profile-container glass-panel">
            <div className="profile-header">
                <img src="https://ui-avatars.com/api/?name=Prashanth+Chowdary&background=0D8ABC&color=fff&size=120" alt="Profile" className="profile-avatar" />
                <div className="profile-info">
                    <h3>Prashanth Chowdary</h3>
                    <p>kavuriprashanthchowdary@gmail.com</p>
                    <span className="badge-plan">Free Plan</span>
                </div>
            </div>
            <div className="profile-details">
                <div className="detail-item">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">January 2024</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Total Transactions</span>
                    <span className="detail-value">245</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Account Status</span>
                    <span className="detail-value">Active</span>
                </div>
            </div>
        </div>
    </motion.div>
);

// Settings Page
const SettingsPage = ({ isDark, toggleTheme, onManageSecurity }) => (
    <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="page-title">Settings</h2>
        <div className="settings-container glass-panel">
            <div className="setting-item">
                <div className="setting-label">
                    <Settings size={20} />
                    <span>Theme</span>
                </div>
                <button className="glass-button btn-sm" onClick={toggleTheme}>
                    {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
            </div>
            <div className="setting-item">
                <div className="setting-label">
                    <Shield size={20} />
                    <span>Privacy & Security</span>
                </div>
                <button className="glass-button btn-sm" onClick={onManageSecurity}>Manage</button>
            </div>
        </div>
    </motion.div>
);

const StatCard = ({ label, value, change, color }) => (
    <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
        <div className="stat-info">
            <span className="stat-label">{label}</span>
            <h4 className="stat-value">{value}</h4>
        </div>
        <div className={`stat-change ${color}`}>
            {change}
        </div>
    </motion.div>
);

export default Dashboard;
