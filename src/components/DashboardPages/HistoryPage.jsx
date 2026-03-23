import React from 'react';
import { motion } from 'framer-motion';

const HistoryPage = ({ transactions, budget, getIcon, getIconColor }) => (
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
                Total Transactions: {transactions.length}
            </div>
        </div>

        <div className="history-container glass-panel">
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
                            layout
                        >
                            <div className="tx-col-main">
                                <div className="tx-icon-sm" style={{ backgroundColor: getIconColor(tx.icon) }}>{getIcon(tx.icon)}</div>
                                <span>{tx.category}</span>
                            </div>
                            <div className="tx-col-date">{tx.date}</div>
                            <div className="tx-col-status"><span className="badge-success">Completed</span></div>
                            <div className="tx-col-amount align-right" style={{ color: tx.type === 'income' ? '#4ade80' : 'var(--text-main)' }}>
                                {tx.type === 'income' ? '+' : '-'} {budget.currency}{tx.amount?.toLocaleString()}
                            </div>
                        </motion.div>
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

export default HistoryPage;
