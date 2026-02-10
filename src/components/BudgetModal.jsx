import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './Modals.css';

const BudgetModal = ({ isOpen, onClose, currentBudget, onSave }) => {
    const [budgetAmount, setBudgetAmount] = useState(currentBudget?.total || 50000);

    const handleSave = () => {
        if (budgetAmount && !isNaN(budgetAmount) && budgetAmount > 0) {
            onSave(parseInt(budgetAmount));
            onClose();
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
                    >
                        <div className="modal-header">
                            <h3>Set Your Budget</h3>
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <label className="modal-label">Enter new budget total:</label>
                            <div className="modal-input-group">
                                <span className="currency-symbol">₹</span>
                                <input
                                    type="number"
                                    className="modal-input"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    placeholder="50000"
                                    autoFocus
                                />
                            </div>
                            <p className="modal-hint">Set a monthly budget to track your expenses effectively</p>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="modal-btn save glass-button" onClick={handleSave}>
                                Save Budget
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BudgetModal;
