import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShoppingBag, TrendingUp, PieChart as PieChartIcon, Loader2, Download, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToTransactions } from '../services/db';
import { getMockTransactions } from '../utils/mockData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Analytics.css';

const Analytics = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('Month'); // Week, Month, Year

    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = subscribeToTransactions(currentUser.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const allTransactions = React.useMemo(() => {
        if (!transactions || transactions.length < 5) {
            const mocks = getMockTransactions();
            return [...(transactions || []), ...mocks].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        return transactions;
    }, [transactions]);

    // Data Filtering based on period
    const filteredTransactions = React.useMemo(() => {
        if (!allTransactions) return [];
        const now = new Date();
        return allTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            if (selectedPeriod === 'Week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return txDate >= weekAgo;
            } else if (selectedPeriod === 'Month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return txDate >= monthAgo;
            } else if (selectedPeriod === 'Year') {
                return txDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [allTransactions, selectedPeriod]);

    // Export Logic
    const handleExportCSV = () => {
        if (!filteredTransactions || filteredTransactions.length === 0) return;
        setIsExporting(true);
        try {
            const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
            const rows = filteredTransactions.map(tx => [
                new Date(tx.date).toLocaleDateString(),
                `"${tx.description.replace(/"/g, '""')}"`,
                tx.category || 'Uncategorized',
                tx.amount,
                tx.type
            ]);
            
            const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `SpendSense_${selectedPeriod}_Export_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const element = document.querySelector('.page-content');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.body.classList.contains('light-mode') ? '#f8fafc' : '#0f172a',
                logging: false,
                onclone: (clonedDoc) => {
                    const hideElements = clonedDoc.querySelectorAll('.glass-button, .period-selector');
                    hideElements.forEach(el => el.style.display = 'none');
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`SpendSense_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    // Memoize all data processing to prevent lag
    const { expenses, categoryData, monthlyData, totalSpent, topCategory, avgSpend } = React.useMemo(() => {
        const expensesOnly = filteredTransactions.filter(t => t.type === 'expense');
        
        // Category Breakdown Calculation
        const categoryTotals = expensesOnly.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
            return acc;
        }, {});

        const categoryColors = {
            Shopping: '#3b82f6',
            Food: '#60a5fa',
            Transport: '#93c5fd',
            Bills: '#2563eb',
            Entertainment: '#1d4ed8',
            Miscellaneous: '#94a3b8',
            Health: '#10b981'
        };

        const catData = Object.keys(categoryTotals).map(cat => ({
            name: cat,
            value: categoryTotals[cat],
            color: categoryColors[cat] || '#cbd5e1'
        })).sort((a, b) => b.value - a.value);

        // Dynamic Trend Calculation
        const trendMap = filteredTransactions.reduce((acc, t) => {
            const date = new Date(t.date);
            let label = '';
            
            if (selectedPeriod === 'Week') {
                label = date.toLocaleDateString('default', { weekday: 'short' });
            } else if (selectedPeriod === 'Month') {
                label = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
            } else {
                label = date.toLocaleString('default', { month: 'short' });
            }
            
            if (!acc[label]) acc[label] = { label, amount: 0, sortKey: date.getTime() };
            acc[label].amount += Math.abs(t.amount);
            return acc;
        }, {});

        const trendData = Object.values(trendMap)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(d => ({ month: d.label, amount: d.amount }));

        const totalSpentVal = expensesOnly.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const topCat = catData[0] || { name: 'N/A', value: 0 };
        const avgSpendVal = trendData.length > 0 ? totalSpentVal / trendData.length : 0;

        return {
            expenses: expensesOnly,
            categoryData: catData,
            monthlyData: trendData,
            totalSpent: totalSpentVal,
            topCategory: topCat,
            avgSpend: avgSpendVal
        };
    }, [allTransactions, filteredTransactions]);

    if (loading) return (
        <div className="center-flex" style={{ height: '70vh' }}>
            <Loader2 className="spinner" size={40} />
            <p style={{ marginLeft: '10px' }}>Analyzing your data...</p>
        </div>
    );

    return (
        <motion.div className="page-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="section-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '20px', marginBottom: '2.5rem' }}>
                <div>
                    <h2 className="page-title">Analytics & Insights</h2>
                    <div className="analytics-period" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Showing {filteredTransactions.length} transactions
                    </div>
                </div>

                {/* Period Selector */}
                <div className="period-selector glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                    {['Week', 'Month', 'Year'].map(period => (
                        <button
                            key={period}
                            className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                            onClick={() => setSelectedPeriod(period)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: selectedPeriod === period ? 'var(--primary)' : 'transparent',
                                color: selectedPeriod === period ? '#fff' : 'var(--text-muted)',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative' }}>
                    <button 
                        className="glass-button btn-sm outline" 
                        onClick={() => setShowExportMenu(!showExportMenu)} 
                        disabled={isExporting} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', height: 'fit-content', justifyContent: 'space-between' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : 
                             exportSuccess ? <CheckCircle size={16} color="#10b981" /> : 
                             <Download size={16} />}
                             Export
                        </div>
                        <ChevronDown size={16} style={{ transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>

                    {showExportMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-panel" 
                            style={{ 
                                position: 'absolute', 
                                top: '100%', 
                                right: 0, 
                                marginTop: '8px', 
                                padding: '8px', 
                                borderRadius: '12px', 
                                zIndex: 50,
                                minWidth: '160px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}
                        >
                            <button className="glass-button btn-sm outline" style={{ border: 'none', justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => { setShowExportMenu(false); handleExportCSV(); }}>
                                📄 Export as CSV
                            </button>
                            <button className="glass-button btn-sm outline" style={{ border: 'none', justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => { setShowExportMenu(false); handleExportPDF(); }}>
                                📑 Export as PDF
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Insights Cards */}
            <div className="analytics-insights">
                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: 'var(--primary)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Top Category</span>
                        <h3 className="insight-value">{topCategory.name}</h3>
                        <span className="insight-amount">₹{topCategory.value.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: '#3b82f6' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Monthly Average</span>
                        <h3 className="insight-value">₹{Math.round(avgSpend).toLocaleString()}</h3>
                        <span className="insight-trend positive">Calculated overall</span>
                    </div>
                </motion.div>

                <motion.div className="insight-card glass-panel" whileHover={{ y: -5 }}>
                    <div className="insight-icon" style={{ background: '#2563eb' }}>
                        <PieChartIcon size={24} />
                    </div>
                    <div className="insight-details">
                        <span className="insight-label">Total Transactions</span>
                        <h3 className="insight-value">{allTransactions.length}</h3>
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
                                    fill="#3b82f6"
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

                {/* Dynamic Trend */}
                <motion.div
                    className="analytics-card glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3>{selectedPeriod === 'Month' ? 'Monthly' : selectedPeriod === 'Week' ? 'Weekly' : 'Yearly'} Spending Trend</h3>
                    <div className="analytics-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
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
