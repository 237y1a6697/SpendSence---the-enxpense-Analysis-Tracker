import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Mail, User as UserIcon, Calendar, ShieldCheck, Edit3, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = ({ user, logout, navigate }) => {
    const { updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleUpdateProfile = async () => {
        if (!newName.trim()) return setUpdateError("Name cannot be empty");
        setIsUpdating(true);
        setUpdateError('');
        try {
            await updateUserProfile(newName);
            setIsEditing(false);
        } catch (error) {
            setUpdateError("Failed to update profile.");
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getInitial = () => {
        const name = user?.displayName || user?.email || 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <motion.div 
            className="page-content" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="page-title">User Profile</h2>
            <div className="profile-container glass-panel">
                <div className="profile-header">
                    <div className="letter-avatar-lg">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="profile-avatar" style={{ border: 'none' }} />
                        ) : (
                            getInitial()
                        )}
                    </div>
                    <div className="profile-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {isEditing ? (
                                <div className="edit-name-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        className="search-input" 
                                        style={{ maxWidth: '250px', paddingLeft: '15px' }} 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="icon-btn-header" onClick={handleUpdateProfile} disabled={isUpdating} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    </button>
                                    <button className="icon-btn-header" onClick={() => { setIsEditing(false); setNewName(user?.displayName || ''); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3>{user?.displayName || 'User'}</h3>
                                    <button className="icon-btn-header" onClick={() => setIsEditing(true)} style={{ padding: '6px' }}>
                                        <Edit3 size={16} />
                                    </button>
                                </>
                            )}
                            <span className="badge-plan">Pro Member</span>
                        </div>
                        {updateError && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{updateError}</span>}
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            <Mail size={16} /> {user?.email}
                        </p>
                    </div>
                </div>

                <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    <div className="detail-item glass-panel" style={{ padding: '1.5rem' }}>
                        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text-muted)' }}>
                            <Calendar size={18} /> Member Since
                        </div>
                        <div className="detail-value" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                            {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                        </div>
                    </div>

                    <div className="detail-item glass-panel" style={{ padding: '1.5rem' }}>
                        <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text-muted)' }}>
                            <ShieldCheck size={18} /> Account Status
                        </div>
                        <div className="detail-value" style={{ fontSize: '1.1rem', fontWeight: '500', color: user?.emailVerified ? '#10b981' : '#ef4444' }}>
                            {user?.emailVerified ? 'Verified' : 'Unverified'}
                        </div>
                    </div>
                </div>

                <div className="profile-actions" style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem' }}>
                    {!isEditing && (
                        <button className="glass-button btn-sm outline" onClick={() => setIsEditing(true)} style={{ minWidth: '120px' }}>Edit Details</button>
                    )}
                    <button className="glass-button btn-sm danger" onClick={handleLogout} style={{ minWidth: '120px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <LogOut size={18} style={{ marginRight: '8px' }} /> Sign Out
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfilePage;
