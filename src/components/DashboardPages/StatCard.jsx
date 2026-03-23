import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, change, color }) => (
    <motion.div 
        className="stat-card glass-panel" 
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
    >
        <div className="stat-info">
            <span className="stat-label">{label}</span>
            <h4 className="stat-value">{value}</h4>
        </div>
        <div className={`stat-change ${color}`}>
            {change}
        </div>
    </motion.div>
);

export default StatCard;
