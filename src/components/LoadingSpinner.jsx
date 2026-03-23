import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = false, message = "Loading financial insights..." }) => {
    return (
        <AnimatePresence>
            <motion.div 
                className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'p-8 w-full'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: fullScreen ? '100vh' : 'auto',
                    width: '100%',
                    position: fullScreen ? 'fixed' : 'relative',
                    top: 0,
                    left: 0,
                    backgroundColor: fullScreen ? 'rgba(15, 23, 42, 0.8)' : 'transparent',
                    backdropFilter: fullScreen ? 'blur(8px)' : 'none',
                    color: 'white'
                }}
            >
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(139, 92, 246, 0.2)', borderRadius: '50%' }}></div>
                    <Loader2 className="animate-spin text-primary" size={fullScreen ? 48 : 32} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
                </div>
                {message && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '1.5rem', fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}
                    >
                        {message}
                    </motion.p>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default LoadingSpinner;
