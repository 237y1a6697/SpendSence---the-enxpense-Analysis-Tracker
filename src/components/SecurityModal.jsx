import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key, Eye, Lock, Smartphone } from 'lucide-react';
import './Modals.css';
import './SecurityModal.css';

const SecurityModal = ({ isOpen, onClose }) => {
    const securityOptions = [
        {
            icon: <Key size={20} />,
            title: 'Change Password',
            desc: 'Last changed 3 months ago',
            color: '#8b5cf6'
        },
        {
            icon: <Smartphone size={20} />,
            title: 'Two-Factor Authentication',
            desc: 'Enabled via Authenticator App',
            color: '#10b981'
        },
        {
            icon: <Eye size={20} />,
            title: 'Login Activity',
            desc: '3 active sessions found',
            color: '#3b82f6'
        },
        {
            icon: <Lock size={20} />,
            title: 'Privacy Settings',
            desc: 'Manage data sharing preferences',
            color: '#f43f5e'
        }
    ];

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
                            <div className="title-with-icon">
                                <Shield className="header-icon-main" />
                                <h3>Privacy & Security</h3>
                            </div>
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="security-intro">Manage your account security and privacy preferences to keep your financial data safe.</p>

                            <div className="security-list">
                                {securityOptions.map((opt, i) => (
                                    <div key={i} className="security-item-card">
                                        <div className="security-icon-box" style={{ background: `${opt.color}20`, color: opt.color }}>
                                            {opt.icon}
                                        </div>
                                        <div className="security-item-info">
                                            <h4>{opt.title}</h4>
                                            <span>{opt.desc}</span>
                                        </div>
                                        <button className="security-action-btn">Configure</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={onClose}>
                                Close
                            </button>
                            <button className="modal-btn save glass-button" onClick={onClose}>
                                Download Security Audit
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SecurityModal;
