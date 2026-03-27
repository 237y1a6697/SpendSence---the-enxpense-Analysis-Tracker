import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { 
    ShoppingBag, Utensils, Car, MoreHorizontal, Bell, Home, Clock, 
    User, Plus, Settings, Wallet, Search, Sun, Moon, TrendingUp, 
    Shield, LogOut, Download, Loader2, Sparkles 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { useAuth } from '../context/AuthContext';
import { subscribeToTransactions, addTransaction } from '../services/db';

// Lazy load dashboard sub-pages for better performance
const DashboardContent = lazy(() => import('./DashboardPages/DashboardContent'));
const HistoryPage = lazy(() => import('./DashboardPages/HistoryPage'));
const Analytics = lazy(() => import('./Analytics'));
const ProfilePage = lazy(() => import('./DashboardPages/ProfilePage'));
const SettingsPage = lazy(() => import('./DashboardPages/SettingsPage'));

// Import common modals
import BudgetModal from './BudgetModal';
import AddTransactionModal from './AddTransactionModal';
import CsvUploadModal from './CsvUploadModal';
import AiAssistant from './AiAssistant';
import SecurityModal from './SecurityModal';
import TransactionDetailModal from './TransactionDetailModal';
import LoadingSpinner from './LoadingSpinner';
import { DashboardSkeleton } from './DashboardPages/SkeletonLoader';
import { getMockTransactions } from '../utils/mockData';

import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const queryClient = useQueryClient();
    
    // UI State
    const [isDark, setIsDark] = useState(true);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [selectedTxForDetail, setSelectedTxForDetail] = useState(null);
    const [showTxDetailModal, setShowTxDetailModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [budget, setBudget] = useState({ total: 50000, spent: 0, currency: '₹' });

    // Use React Query for shared transactions data across all pages
    // This provides automatic caching and avoids redundant fetches
    const { data: transactions = [], isLoading: isDataLoading } = useQuery({
        queryKey: ['transactions', currentUser?.uid],
        queryFn: () => new Promise((resolve) => {
            const unsubscribe = subscribeToTransactions(currentUser.uid, (data) => {
                resolve(data);
                // After first fetch, let onSnapshot handle updates via manual query invalidation if needed
                // But for simplicity, we'll keep it as a live listener update
            });
            return () => unsubscribe();
        }),
        enabled: !!currentUser?.uid,
    });

    // Merge real data with mock data if real data is empty or very limited
    // to ensure the UI looks "full" and "premium" as requested
    const allTransactions = useMemo(() => {
        if (!transactions || transactions.length < 5) {
            const mocks = getMockTransactions();
            return [...(transactions || []), ...mocks].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        return transactions;
    }, [transactions]);

    const [selectedPeriod, setSelectedPeriod] = useState('This Week');

    // Calculate trend data for the chart
    const trendData = useMemo(() => {
        if (!allTransactions || allTransactions.length === 0) return [];

        const now = new Date();
        const dataMap = {};
        
        let startBound;
        let endBound = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        let points = 7;
        let labelFn;
        let stepFn;

        if (selectedPeriod === 'This Week') {
            points = 7;
            startBound = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
            labelFn = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
            stepFn = (i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        } else if (selectedPeriod === 'This Month') {
            points = 30;
            startBound = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
            labelFn = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
            stepFn = (i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        } else if (selectedPeriod === 'This Year') {
            points = 12;
            startBound = new Date(now.getFullYear(), 0, 1);
            endBound = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short' });
            stepFn = (i) => new Date(now.getFullYear(), 11 - i, 1);
        } else if (selectedPeriod === 'Past Year') {
            points = 12;
            startBound = new Date(now.getFullYear() - 1, 0, 1);
            endBound = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
            labelFn = (d) => d.toLocaleDateString('en-US', { month: 'short' });
            stepFn = (i) => new Date(now.getFullYear() - 1, 11 - i, 1);
        } else if (selectedPeriod === 'Past 5 Years') {
            points = 5;
            startBound = new Date(now.getFullYear() - 4, 0, 1);
            labelFn = (d) => String(d.getFullYear());
            stepFn = (i) => new Date(now.getFullYear() - i, 0, 1);
        } else {
            // Fallback default
            points = 7;
            startBound = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
            labelFn = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
            stepFn = (i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        }

        // Initialize points
        for (let i = points - 1; i >= 0; i--) {
            const d = stepFn(i);
            const label = labelFn(d);
            dataMap[label] = { name: label, amount: 0, sortKey: d.getTime() };
        }

        // Fill with isolated timeline data
        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate >= startBound && txDate <= endBound) {
                const label = labelFn(txDate);
                if (dataMap[label]) {
                    dataMap[label].amount += Math.abs(tx.amount);
                }
            }
        });

        // Ensure chronological order
        return Object.values(dataMap)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(item => ({ name: item.name, amount: item.amount }));
    }, [allTransactions, selectedPeriod]);

    // Real-time listener bridge for React Query
    useEffect(() => {
        if (!currentUser?.uid) return;
        const unsubscribe = subscribeToTransactions(currentUser.uid, (data) => {
            queryClient.setQueryData(['transactions', currentUser.uid], data);
        });
        return () => unsubscribe();
    }, [currentUser?.uid, queryClient]);

    // Derived State memoization
    const { totalSpent, totalIncome } = useMemo(() => {
        return allTransactions.reduce((acc, t) => {
            const val = Math.abs(t.amount);
            if (t.type === 'expense') acc.totalSpent += val;
            else acc.totalIncome += val;
            return acc;
        }, { totalSpent: 0, totalIncome: 0 });
    }, [allTransactions]);

    useEffect(() => {
        setBudget(prev => ({ ...prev, spent: totalSpent }));
    }, [totalSpent]);

    // PDF Export Logic
    const handleDownloadReport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        
        try {
            const element = document.querySelector('.main-content');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    // Hide buttons/elements we don't want in the PDF
                    clonedDoc.querySelectorAll('.glass-button, .view-all-btn, .top-header, .sidebar, .ai-assistant-wrapper').forEach(el => {
                        el.style.display = 'none';
                    });
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`SpendSense_Report_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleBudgetClick = () => setShowBudgetModal(true);
    const handleSaveBudget = (newTotal) => setBudget(prev => ({ ...prev, total: newTotal }));

    const handleSaveTransaction = async (newTx) => {
        try {
            await addTransaction(currentUser.uid, newTx);
            // State updates automatically via onSnapshot -> setQueryData
        } catch (error) {
            console.error("Failed to save transaction:", error);
        }
    };

    const handleLogout = async () => {
        try { await logout(); navigate('/'); } catch (err) { console.error(err); }
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.classList.toggle('light-mode');
    };

    const percentage = budget.total > 0 ? Math.round((budget.spent / budget.total) * 100) : 0;
    const pieData = [
        { name: 'Spent', value: budget.spent },
        { name: 'Remaining', value: Math.max(0, budget.total - budget.spent) },
    ];

    const getIcon = (name) => {
        switch (name) {
            case 'shopping-bag': return <ShoppingBag size={20} />;
            case 'utensils': return <Utensils size={20} />;
            case 'car': return <Car size={20} />;
            default: return <MoreHorizontal size={20} />;
        }
    };

    const getIconColor = (name) => {
        switch (name) {
            case 'shopping-bag': return '#fcd34d';
            case 'utensils': return '#d8b4fe';
            case 'car': return '#67e8f9';
            default: return '#cbd5e1';
        }
    };

    // Sub-render helpers
    const getNavClass = (path) => {
        const currentPath = location.pathname;
        if (path === '/dashboard' && currentPath === '/dashboard') return 'active';
        return currentPath.startsWith(path) && path !== '/dashboard' ? 'active' : '';
    };

    if (isDataLoading) return <LoadingSpinner fullScreen message="Syncing with your bank records..." />;

    return (
        <div className={`desktop-layout ${isDark ? 'dark' : 'light'}`}>
            {/* Sidebar */}
            <aside className="sidebar glass-panel">
                <div className="logo-area" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <div className="logo-circle">
                        <Wallet size={24} className="logo-icon" />
                    </div>
                    <h2 className="logo-text">SpendSense</h2>
                </div>

                <nav className="sidebar-nav">
                    <div className={`nav-item ${getNavClass('/dashboard')}`} onClick={() => navigate('/dashboard')}>
                        <Home size={20} /> Dashboard
                    </div>
                    <div className={`nav-item ${getNavClass('/dashboard/history')}`} onClick={() => navigate('/dashboard/history')}>
                        <Clock size={20} /> History
                    </div>
                    <div className={`nav-item ${getNavClass('/dashboard/analytics')}`} onClick={() => navigate('/dashboard/analytics')}>
                        <TrendingUp size={20} /> Analytics
                    </div>
                    <div className={`nav-item ${getNavClass('/dashboard/profile')}`} onClick={() => navigate('/dashboard/profile')}>
                        <User size={20} /> Profile
                    </div>
                    <div className={`nav-item ${getNavClass('/dashboard/settings')}`} onClick={() => navigate('/dashboard/settings')}>
                        <Settings size={20} /> Settings
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-mini" onClick={() => navigate('/dashboard/profile')} style={{ cursor: 'pointer' }}>
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="avatar-sm" />
                        ) : (
                            <div className="letter-avatar-sm">
                                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="user-details-mini">
                            <span>{currentUser?.displayName || currentUser?.email?.split('@')[0]}</span>
                            <span className="sub">Pro Account</span>
                        </div>
                    </div>
                    <button className="nav-item logout-btn" onClick={handleLogout} style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', justifyContent: 'flex-start' }}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-search">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search transactions..." className="search-input" />
                    </div>
                    <div className="header-actions">
                        {location.pathname === '/dashboard/analytics' && (
                            <button className="glass-button btn-sm outline success" onClick={handleDownloadReport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                Download Report
                            </button>
                        )}
                        <button className="icon-btn-header" onClick={toggleTheme}>
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="glass-button btn-sm outline" onClick={() => setShowCsvModal(true)}>Import CSV</button>
                        <button className="glass-button btn-sm" onClick={() => setShowTxModal(true)}>+ Entry</button>
                    </div>
                </header>

                <div className="page-transition-container">
                    <AnimatePresence mode="wait">
                        <Suspense fallback={<DashboardSkeleton />}>
                            <Routes location={location} key={location.pathname}>
                                <Route index element={
                                    <DashboardContent 
                                        budget={budget} 
                                        transactions={allTransactions.slice(0, 5)} 
                                        percentage={percentage}
                                        pieData={pieData}
                                        trendData={trendData}
                                        selectedPeriod={selectedPeriod}
                                        onPeriodChange={(newPeriod) => setSelectedPeriod(newPeriod)}
                                        getIcon={getIcon}
                                        getIconColor={getIconColor}
                                        onViewAll={() => navigate('/dashboard/history')}
                                        onViewAnalytics={() => navigate('/dashboard/analytics')}
                                        onTxClick={(tx) => {
                                            setSelectedTxForDetail(tx);
                                            setShowTxDetailModal(true);
                                        }}
                                    />
                                } />
                                <Route path="history" element={<HistoryPage transactions={allTransactions} budget={budget} getIcon={getIcon} getIconColor={getIconColor} />} />
                                <Route path="analytics" element={<Analytics />} />
                                <Route path="profile" element={<ProfilePage user={currentUser} logout={logout} navigate={navigate} />} />
                                <Route path="settings" element={<SettingsPage transactions={allTransactions} isDark={isDark} toggleTheme={toggleTheme} onManageSecurity={() => setShowSecurityModal(true)} />} />
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Suspense>
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} currentBudget={budget} onSave={handleSaveBudget} />
            <AddTransactionModal isOpen={showTxModal} onClose={() => setShowTxModal(false)} onSave={handleSaveTransaction} />
            <CsvUploadModal isOpen={showCsvModal} onClose={() => setShowCsvModal(false)} />
            <SecurityModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
            <TransactionDetailModal isOpen={showTxDetailModal} onClose={() => setShowTxDetailModal(false)} transaction={selectedTxForDetail} getIcon={getIcon} getIconColor={getIconColor} currency={budget.currency} />
            
            {/* AI Floating Assistant */}
            <AiAssistant transactions={allTransactions} />
        </div>
    );
};

export default Dashboard;
