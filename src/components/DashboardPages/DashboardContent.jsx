import React from 'react';
import { motion } from 'framer-motion';

const formatTransactionDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value || '-';
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import StatCard from './StatCard';

const DashboardContent = ({
    budget, transactions, percentage, pieData, trendData,
    selectedPeriod, onPeriodChange, getIcon, getIconColor,
    onViewAll, onTxClick, onViewAnalytics
}) => (
    <motion.div 
        className="content-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div className="stats-row">
            <StatCard label="Total Budget" value={`${budget.currency}${budget.total.toLocaleString()}`} change="+2.5%" color="blue" aria-label="Total Budget Statistics" />
            <StatCard label="Total Spent" value={`${budget.currency}${budget.spent.toLocaleString()}`} change="+12%" color="pink" aria-label="Total Spending Statistics" />
            <StatCard label="Remaining" value={`${budget.currency}${(budget.total - budget.spent).toLocaleString()}`} change="-5%" color="green" aria-label="Remaining Budget Statistics" />
        </div>

        <div className="charts-row">
            <motion.div className="chart-card glass-panel wide" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={onViewAnalytics}>
                        <h3>Spending Trend</h3>
                        <span style={{ fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'underline' }}>View Analytics</span>
                    </div>
                    <select
                        className="period-select"
                        value={selectedPeriod}
                        onChange={(e) => onPeriodChange(e.target.value)}
                        aria-label="Select spending trend period"
                    >
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Past Year">Past Year</option>
                        <option value="This Year">This Year</option>
                        <option value="Past 5 Years">Past 5 Years</option>
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
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
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
                        <span className="dot dot-spent"></span> Spent: {budget.currency}{budget.spent.toLocaleString()}
                    </div>
                    <div className="limit-item">
                        <span className="dot dot-remain"></span> Left: {budget.currency}${(budget.total - budget.spent).toLocaleString()}
                    </div>
                </div>
            </motion.div>
        </div>

        <div className="transactions-row">
            <div className="section-header">
                <h3>Recent Transactions</h3>
                <button onClick={onViewAll} className="view-all-btn" aria-label="View all transaction history">View All</button>
            </div>
            <div className="tx-grid-header">
                <span>Category</span>
                <span>Date</span>
                <span>Status</span>
                <span className="align-right">Amount</span>
            </div>
            <div className="tx-list">
                {transactions.length > 0 ? (
                    transactions.map((tx, i) => (
                        <motion.div 
                            key={tx.id || i} 
                            className="tx-row-item tx-item-flat"
                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            onClick={() => onTxClick(tx)}
                            layout
                        >
                            <div className="tx-col-main">
                                <div className="tx-icon-sm" style={{ backgroundColor: getIconColor(tx.icon) }}>{getIcon(tx.icon)}</div>
                                <span>{tx.category}</span>
                            </div>
                            <div className="tx-col-date">{formatTransactionDate(tx.date)}</div>
                            <div className="tx-col-status"><span className="badge-success">Completed</span></div>
                            <div className="tx-col-amount align-right">- {budget.currency}{tx.amount?.toLocaleString()}</div>
                        </motion.div>
                    ))
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No transactions recorded yet.
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default DashboardContent;
