import React from 'react';
import { motion } from 'framer-motion';

export const CardSkeleton = () => (
    <div className="glass-panel" style={{ padding: '20px', minHeight: '150px' }}>
        <div className="skeleton-title" style={{ height: '20px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '15px' }}></div>
        <div className="skeleton-value" style={{ height: '40px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
    </div>
);

export const TableSkeleton = () => (
    <div className="glass-panel" style={{ padding: '20px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ height: '40px', width: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ flex: 1 }}>
                    <div style={{ height: '15px', width: '80%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ height: '10px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                </div>
            </div>
        ))}
    </div>
);

export const DashboardSkeleton = () => (
    <div className="content-grid">
        <div className="stats-row">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
        <div className="charts-row">
            <div className="chart-card glass-panel wide" style={{ height: '350px' }}>
                <div style={{ height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}></div>
            </div>
            <div className="chart-card glass-panel narrow" style={{ height: '350px' }}>
                <div style={{ height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}></div>
            </div>
        </div>
    </div>
);
