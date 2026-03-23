import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, Trash2, Moon, Sun, Loader2, CheckCircle } from 'lucide-react';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const SettingsPage = ({ transactions = [], isDark, toggleTheme, onManageSecurity }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const handleExportData = () => {
        if (!transactions || transactions.length === 0) {
            alert("No transactions to export");
            return;
        }

        setIsExporting(true);
        try {
            // CSV Conversion logic
            const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
            const rows = transactions.map(tx => [
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
            link.setAttribute('download', `SpendSense_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div 
            className="page-content" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="page-title">Application Settings</h2>
            
            <div className="settings-section" style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="settings-card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                            {isDark ? <Moon size={22} /> : <Sun size={22} />}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Theme Preference</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose between Dark and Light mode experience.</p>
                        </div>
                    </div>
                    <button className={`glass-button btn-sm ${isDark ? 'active' : ''}`} onClick={toggleTheme}>
                        {isDark ? 'Light' : 'Dark'} Mode
                    </button>
                </div>

                <div className="settings-card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                            <Shield size={22} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Privacy & Security</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your account security and data privacy.</p>
                        </div>
                    </div>
                    <button className="glass-button btn-sm outline" onClick={onManageSecurity}>Manage</button>
                </div>

                <div className="settings-card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                            {exportSuccess ? <CheckCircle size={22} color="#10b981" /> : <Download size={22} />}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Data Export</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Download all your transactions as a CSV spreadsheet.</p>
                        </div>
                    </div>
                    <button 
                        className="glass-button btn-sm outline" 
                        onClick={handleExportData} 
                        disabled={isExporting}
                        style={{ minWidth: '130px' }}
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : 'Export CSV'}
                    </button>
                </div>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Danger Zone</h3>
            <div className="settings-card glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
                        <Trash2 size={22} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Delete Account</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanently remove all your financial data and records.</p>
                    </div>
                </div>
                <button className="glass-button btn-sm danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Delete Account</button>
            </div>
        </motion.div>
    );
};

export default SettingsPage;
