import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tag, CreditCard, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { deleteTransaction } from '../services/db';
import './Modals.css';

const TransactionDetailModal = ({ isOpen, onClose, transaction, getIcon, getIconColor, currency }) => {
    const [deleting, setDeleting] = useState(false);

    if (!transaction) return null;

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                setDeleting(true);
                await deleteTransaction(transaction.id);
                onClose();
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete transaction.");
            } finally {
                setDeleting(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-container glass-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '400px' }}
                    >
                        <div className="modal-header">
                            <h3>Transaction Details</h3>
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '20px',
                                    backgroundColor: getIconColor(transaction.icon),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    color: '#1e1b4b'
                                }}>
                                    {getIcon(transaction.icon)}
                                </div>
                                <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0', color: 'white' }}>
                                    {transaction.type === 'expense' ? '-' : '+'} {currency}{transaction.amount.toLocaleString()}
                                </h2>
                                <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>{transaction.category}</p>
                                <p style={{ color: 'var(--text-main)', margin: '4px 0 0 0', fontWeight: '500' }}>{transaction.description}</p>
                            </div>

                            <div className="detail-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="detail-item-box" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px'
                                }}>
                                    <Calendar size={20} color="var(--primary)" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</p>
                                        <p style={{ margin: '0', fontWeight: '600' }}>{transaction.date}</p>
                                    </div>
                                </div>

                                <div className="detail-item-box" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px'
                                }}>
                                    <Tag size={20} color="var(--secondary)" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</p>
                                        <p style={{ margin: '0', fontWeight: '600' }}>{transaction.category}</p>
                                    </div>
                                </div>

                                <div className="detail-item-box" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px'
                                }}>
                                    <CreditCard size={20} color="#06b6d4" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</p>
                                        <p style={{ margin: '0', fontWeight: '600', color: '#4ade80' }}>{transaction.status || 'Completed'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" style={{ flex: 1 }} onClick={onClose} disabled={deleting}>
                                Close
                            </button>
                            <button 
                                className="modal-btn delete-btn" 
                                style={{ 
                                    flex: 1, 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontWeight: '600',
                                    borderRadius: '16px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }} 
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? <Loader2 className="spinner" size={18} /> : <Trash2 size={18} />}
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TransactionDetailModal;
