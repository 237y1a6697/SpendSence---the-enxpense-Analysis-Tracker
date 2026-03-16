import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Utensils, Car, MoreHorizontal, FileText } from 'lucide-react';
import { autoCategorize } from '../utils/categorize';
import './Modals.css';
import './AddTransactionModal.css';

const AddTransactionModal = ({ isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Shopping');
    const [icon, setIcon] = useState('shopping-bag');

    const categories = [
        { name: 'Shopping', icon: 'shopping-bag', lucide: <ShoppingBag size={20} />, color: '#fcd34d' },
        { name: 'Food', icon: 'utensils', lucide: <Utensils size={20} />, color: '#d8b4fe' },
        { name: 'Travel', icon: 'car', lucide: <Car size={20} />, color: '#67e8f9' },
        { name: 'Other', icon: 'more-horizontal', lucide: <MoreHorizontal size={20} />, color: '#cbd5e1' },
    ];

    const handleDescriptionChange = (e) => {
        const val = e.target.value;
        setDescription(val);
        const auto = autoCategorize(val);
        if (auto.category !== 'Miscellaneous') {
            setCategory(auto.category);
            setIcon(auto.icon);
        }
    };

    const handleSave = () => {
        if (amount && !isNaN(amount)) {
            onSave({
                category,
                description: description || 'No Description',
                amount: parseFloat(amount),
                icon,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                type: 'expense',
                status: 'Completed'
            });
            setAmount('');
            setDescription('');
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
                            <h3>Add Transaction</h3>
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-form-group">
                                <label className="modal-label">Description</label>
                                <div className="modal-input-group">
                                    <FileText size={18} className="input-icon-left" />
                                    <input
                                        type="text"
                                        className="modal-input small"
                                        value={description}
                                        onChange={handleDescriptionChange}
                                        placeholder="What was this for?"
                                    />
                                </div>
                            </div>

                            <div className="modal-form-group">
                                <label className="modal-label">Amount</label>
                                <div className="modal-input-group">
                                    <span className="currency-symbol">₹</span>
                                    <input
                                        type="number"
                                        className="modal-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="modal-form-group">
                                <label className="modal-label">Category</label>
                                <div className="category-selector">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.name}
                                            className={`category-option ${category === cat.name ? 'selected' : ''}`}
                                            onClick={() => {
                                                setCategory(cat.name);
                                                setIcon(cat.icon);
                                            }}
                                        >
                                            <div className="cat-icon-box" style={{ backgroundColor: cat.color }}>
                                                {cat.lucide}
                                            </div>
                                            <span>{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="modal-btn save glass-button" onClick={handleSave}>
                                Add Expense
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddTransactionModal;
