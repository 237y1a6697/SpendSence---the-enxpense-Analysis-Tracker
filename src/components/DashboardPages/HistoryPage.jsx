import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const formatTransactionDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value || '-';
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const HistoryPage = ({ transactions, budget, getIcon, getIconColor }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);

    const groupedTransactions = useMemo(() => {
        const groups = (transactions || []).reduce((acc, tx) => {
            const cat = tx.category || 'Miscellaneous';
            if (!acc[cat]) {
                acc[cat] = {
                    category: cat,
                    icon: tx.icon,
                    transactions: [],
                    totalAmount: 0,
                    count: 0
                };
            }
            acc[cat].transactions.push(tx);
            const val = tx.type === 'income' ? tx.amount : -(tx.amount || 0);
            acc[cat].totalAmount += val;
            acc[cat].count += 1;
            return acc;
        }, {});

        // Sort groups alphabetically or by amount. Let's do alphabetically for ease of finding.
        return Object.values(groups).sort((a, b) => a.category.localeCompare(b.category));
    }, [transactions]);

    const toggleCategory = (catName) => {
        setExpandedCategory(prev => prev === catName ? null : catName);
    };

    return (
        <motion.div 
            className="page-content" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2 className="page-title">Transaction History</h2>
                <div className="analytics-period" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Total Transactions: {transactions?.length || 0}
                </div>
            </div>

            <div className="history-container glass-panel">
                <div className="tx-grid-header">
                    <span>Category</span>
                    <span>Items</span>
                    <span>Status</span>
                    <span className="align-right">Net Amount</span>
                </div>
                <div className="tx-list">
                    {groupedTransactions.length > 0 ? (
                        groupedTransactions.map((group) => (
                            <React.Fragment key={group.category}>
                                {/* Main Category Row */}
                                <motion.div 
                                    className="tx-row-item tx-item-flat cursor-pointer"
                                    onClick={() => toggleCategory(group.category)}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    style={{ 
                                        borderBottom: expandedCategory === group.category ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer'
                                    }}
                                    layout
                                >
                                    <div className="tx-col-main" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="tx-icon-sm" style={{ backgroundColor: getIconColor(group.icon) }}>{getIcon(group.icon)}</div>
                                        <span style={{ fontWeight: '500' }}>{group.category}</span>
                                        <motion.div 
                                            animate={{ rotate: expandedCategory === group.category ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                                        >
                                            <ChevronDown size={16} />
                                        </motion.div>
                                    </div>
                                    <div className="tx-col-date" style={{ color: 'var(--text-muted)' }}>{group.count} transactions</div>
                                    <div className="tx-col-status"><span className="badge-success">Active</span></div>
                                    <div className="tx-col-amount align-right" style={{ color: group.totalAmount >= 0 ? '#4ade80' : 'var(--text-main)', fontWeight: 'bold' }}>
                                        {group.totalAmount >= 0 ? '+' : '-'} {budget.currency}{Math.abs(group.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </motion.div>

                                {/* Expanded Inner List */}
                                <AnimatePresence>
                                    {expandedCategory === group.category && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)' }}
                                        >
                                            <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                {group.transactions.map((tx, i) => (
                                                    <div 
                                                        key={tx.id || i}
                                                        style={{ 
                                                            display: 'grid', 
                                                            gridTemplateColumns: 'minmax(120px, 1.5fr) 1fr 1fr 1fr', 
                                                            gap: '15px',
                                                            alignItems: 'center',
                                                            padding: '10px 20px 10px 60px',
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-muted)',
                                                            borderBottom: (i === group.transactions.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.03)'
                                                        }}
                                                    >
                                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                                                            {tx.description || tx.category}
                                                        </div>
                                                        <div>{formatTransactionDate(tx.date)}</div>
                                                        <div>
                                                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                                {tx.status || 'Completed'}
                                                            </span>
                                                        </div>
                                                        <div style={{ textAlign: 'right', color: tx.type === 'income' ? '#4ade80' : 'var(--text-main)' }}>
                                                            {tx.type === 'income' ? '+' : '-'} {budget.currency}{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))
                    ) : (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No transaction history found.</div>
                            <p>Import a CSV file or add transactions manually to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default HistoryPage;
