import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Cloud, PieChart, ArrowRight, Wallet, Sun, Moon } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);

    const handleStart = () => {
        navigate('/login');
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.classList.toggle('light-mode');
    };

    return (
        <div className="landing-wrapper">
            {/* Navbar */}
            <nav className="navbar glass-panel">
                <div className="logo">
                    <Wallet className="logo-icon" />
                    <span className="logo-text">SpendSense</span>
                </div>
                <div className="nav-actions">
                    <button className="nav-btn icon-btn" onClick={toggleTheme} title="Toggle Theme">
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <motion.h1
                    className="hero-title"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    Master Your Money. <span className="gradient-text">Instantly.</span>
                </motion.h1>

                <motion.p
                    className="hero-subtitle"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    Track expenses, set budgets, and visualize your financial future in seconds.
                    Powered by intelligent cloud analytics.
                </motion.p>

                <motion.div
                    className="cta-container"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                >
                    <button className="glass-button cta-btn" onClick={handleStart}>
                        Get Started <ArrowRight size={18} />
                    </button>
                </motion.div>

                {/* Floating Abstract Elements (Decorations) */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </section>

            {/* Features Grid */}
            <section className="features-grid container">
                <FeatureCard
                    icon={<PieChart size={32} color="#ec4899" />}
                    title="Smart Analytics"
                    desc="Visualize your spending patterns with dynamic charts and real-time data analysis."
                    route="/dashboard/analytics"
                    delay={0.6}
                />
                <FeatureCard
                    icon={<Shield size={32} color="#8b5cf6" />}
                    title="Bank-Grade Security"
                    desc="Your financial data is encrypted and protected with industry-leading security standards."
                    route="/dashboard/settings"
                    delay={0.7}
                />
                <FeatureCard
                    icon={<Cloud size={32} color="#06b6d4" />}
                    title="Cloud Sync"
                    desc="Access your budget from any device. Seamless synchronization across the globe."
                    route="/dashboard"
                    delay={0.8}
                />
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, route, delay }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            className="feature-card glass-panel"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate(route)}
            style={{ cursor: 'pointer' }}
        >
            <div className="icon-wrapper glass-panel">
                {icon}
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
            <div className="card-link">Explore <ArrowRight size={14} /></div>
        </motion.div>
    );
};

export default LandingPage;
