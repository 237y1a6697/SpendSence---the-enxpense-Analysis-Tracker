import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key, Eye, Lock, Smartphone, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Modals.css';
import './SecurityModal.css';

const SecurityModal = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordReset = async () => {
        setIsLoading(true);
        setStatusMsg('');
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setStatusMsg('Reset email sent to your inbox!');
            setTimeout(() => setStatusMsg(''), 5000);
        } catch (error) {
            console.error(error);
            setStatusMsg('Failed to send reset email.');
        } finally {
            setIsLoading(false);
        }
    };

    const securityOptions = [
        {
            icon: <Key size={20} />,
            title: 'Change Password',
            desc: 'Send a secure reset link to your email',
            color: '#3b82f6',
            action: handlePasswordReset
        },
        {
            icon: <Smartphone size={20} />,
            title: 'Two-Factor Authentication',
            desc: 'Add an extra layer of protection',
            color: '#3b82f6',
            action: () => alert('2FA setup is coming soon!')
        },
        {
            icon: <Eye size={20} />,
            title: 'Login Activity',
            desc: 'Review your recent active sessions',
            color: '#3b82f6',
            action: () => alert('Session logging is enabled')
        },
        {
            icon: <Lock size={20} />,
            title: 'Privacy Settings',
            desc: 'Manage your data sharing preferences',
            color: '#3b82f6',
            action: () => alert('Privacy controls are active')
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
                            <div className="title-with-icon" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Shield size={24} color="var(--primary)" />
                                <h3 style={{ margin: 0 }}>Privacy & Security</h3>
                            </div>
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="security-intro" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Manage your account security and privacy preferences to keep your financial data safe.</p>

                            {statusMsg && (
                                <div className="status-message" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <CheckCircle size={18} /> {statusMsg}
                                </div>
                            )}

                            <div className="security-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {securityOptions.map((opt, i) => (
                                    <div key={i} className="security-item-card glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '15px' }}>
                                        <div className="security-icon-box" style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                                            {opt.icon}
                                        </div>
                                        <div className="security-item-info" style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{opt.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                                        </div>
                                        <button 
                                            className="glass-button btn-sm outline" 
                                            onClick={opt.action}
                                            disabled={isLoading && opt.title === 'Change Password'}
                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                        >
                                            {isLoading && opt.title === 'Change Password' ? <Loader2 size={14} className="animate-spin" /> : 'Configure'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '20px' }}>
                            <button className="modal-btn cancel" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SecurityModal;
