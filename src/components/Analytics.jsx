import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShoppingBag, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
    // Mock analytics data
    const categoryData = [
        { name: 'Shopping', value: 12000, color: '#fcd34d' },
        { name: 'Food', value: 8500, color: '#d8b4fe' },
        { name: 'Travel', value: 5200, color: '#67e8f9' },
        { name: 'Entertainment', value: 3800, color: '#fb923c' },
        { name: 'Other', value: 5500, color: '#94a3b8' },
    ];

    const monthlyData = [
        { month: 'Jan', amount: 28000 },
        { month: 'Feb', amount: 32000 },
        { month: 'Mar', amount: 35000 },
        { month: 'Apr', amount: 29000 },
        { month: 'May', amount: 38000 },
        { month: 'Jun', amount: 35000 },
    ];

    const totalSpent = categoryData.reduce((sum, cat) => sum + cat.value, 0);

    return (
        <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="section-header">
                <h2 className="page-title">Analytics & Insights</h2>
                <select className="period-select">
                    <option>This Month</option>
                    <option>This Year</option>
                    <option>Past Year</option>
                    <option>Past 5 Years</option>
                </select>
            </div>

            {/* Insights Cards */}
            <div className="analytics-insights">
                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Top Category</span>
                        <h3 className="insight-value">Shopping</h3>
                        <span className="insight-amount">₹12,000</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Avg. Monthly Spend</span>
                        <h3 className="insight-value">₹32,833</h3>
                        <span className="insight-trend positive">+8.5% vs last month</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                        <PieChartIcon size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Total Transactions</span>
                        <h3 className="insight-value">127</h3>
                        <span className="insight-trend">This month</span>
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
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="category-legend">
                        {categoryData.map((cat) => (
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
                            <span className="summary-label">Highest</span>
                            <span className="summary-value">₹38,000 (May)</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Lowest</span>
                            <span className="summary-value">₹28,000 (Jan)</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Analytics;
