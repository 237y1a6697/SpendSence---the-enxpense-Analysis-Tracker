import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShoppingBag, TrendingUp, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToTransactions } from '../services/db';
import './Analytics.css';

const Analytics = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = subscribeToTransactions(currentUser.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Data Processing
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Category Breakdown Calculation
    const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
    }, {});

    const categoryColors = {
        Shopping: '#fcd34d',
        Food: '#d8b4fe',
        Transport: '#67e8f9',
        Bills: '#ec4899',
        Entertainment: '#fb923c',
        Miscellaneous: '#94a3b8',
        Health: '#4ade80'
    };

    const categoryData = Object.keys(categoryTotals).map(cat => ({
        name: cat,
        value: categoryTotals[cat],
        color: categoryColors[cat] || '#cbd5e1'
    })).sort((a, b) => b.value - a.value);

    // Monthly Trend Calculation (Last 6 months)
    const monthlyData = Object.values(expenses.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYear = date.toLocaleString('default', { month: 'short' });
        if (!acc[monthYear]) acc[monthYear] = { month: monthYear, amount: 0 };
        acc[monthYear].amount += Math.abs(t.amount);
        return acc;
    }, {})).slice(-6);

    const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const topCategory = categoryData[0] || { name: 'N/A', value: 0 };
    const avgSpend = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;

    if (loading) return (
        <div className="center-flex" style={{ height: '70vh' }}>
            <Loader2 className="spinner" size={40} />
            <p style={{ marginLeft: '10px' }}>Analyzing your data...</p>
        </div>
    );

    return (
        <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="section-header">
                <h2 className="page-title">Analytics & Insights</h2>
                <div className="analytics-period" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Based on {transactions.length} transactions
                </div>
            </div>

            {/* Insights Cards */}
            <div className="analytics-insights">
                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Top Category</span>
                        <h3 className="insight-value">{topCategory.name}</h3>
                        <span className="insight-amount">₹{topCategory.value.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Monthly Average</span>
                        <h3 className="insight-value">₹{Math.round(avgSpend).toLocaleString()}</h3>
                        <span className="insight-trend positive">Calculated overall</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                        <PieChartIcon size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Total Transactions</span>
                        <h3 className="insight-value">{transactions.length}</h3>
                        <span className="insight-trend">Real-time data</span>
                    </div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="analytics-charts">
                {/* Category Breakdown */}
                <motion.div
                    className="analytics-card glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Spending by Category</h3>
                    <div className="analytics-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="category-legend">
                        {categoryData.slice(0, 5).map((cat) => (
                            <div key={cat.name} className="legend-row">
                                <div className="legend-dot" style={{ backgroundColor: cat.color }}></div>
                                <span className="legend-name">{cat.name}</span>
                                <span className="legend-value">₹{cat.value.toLocaleString()}</span>
                                <span className="legend-percent">{((cat.value / totalSpent) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Monthly Trend */}
                <motion.div
                    className="analytics-card glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3>Monthly Spending Trend</h3>
                    <div className="analytics-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#ec4899"
                                    fillOpacity={1}
                                    fill="url(#colorMonthly)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="trend-summary">
                        <div className="summary-item">
                            <span className="summary-label">Highest Month</span>
                            <span className="summary-value">
                                {monthlyData.length > 0 ? `₹${Math.max(...monthlyData.map(d => d.amount)).toLocaleString()}` : 'N/A'}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Period Spend</span>
                            <span className="summary-value">₹{totalSpent.toLocaleString()}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Analytics;
