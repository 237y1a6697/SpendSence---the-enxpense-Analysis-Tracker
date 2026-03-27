import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle, AlertCircle, Loader2, Play, Table } from 'lucide-react';
import { addTransactionsBatch } from '../services/db';
import { parseCsvText, normalizeCsvTransactions } from '../utils/csvImport';
import { useAuth } from '../context/AuthContext';
import './Modals.css';

const CsvUploadModal = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, validating, preview, uploading, success, error
    const [error, setError] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('file'); // 'file' or 'manual'
    const [manualText, setManualText] = useState('');
    const [validationSummary, setValidationSummary] = useState(null);
    const fileInputRef = useRef(null);

    const withTimeout = (promise, timeoutMs) => {
        return new Promise((resolve, reject) => {
            const timerId = setTimeout(() => {
                reject(new Error('Upload is taking too long. This can happen on a slow network or restricted Firebase rules.'));
            }, timeoutMs);

            promise
                .then((result) => {
                    clearTimeout(timerId);
                    resolve(result);
                })
                .catch((err) => {
                    clearTimeout(timerId);
                    reject(err);
                });
        });
    };

    const resetState = () => {
        setFile(null);
        setManualText('');
        setStatus('idle');
        setUploadProgress(0);
        setError('');
        setParsedData([]);
        setValidationSummary(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setStatus('idle');
            setValidationSummary(null);
        }
    };

    const startImport = async () => {
        if (status === 'uploading' || status === 'validating') return;
        setStatus('validating');
        setError('');
        setValidationSummary(null);
        
        try {
            let rawData;
            if (activeTab === 'file') {
                if (!file) throw new Error("Please select a file.");
                if (file.size > 5 * 1024 * 1024) throw new Error("File size exceeds 5MB limit.");
                if (!String(file.name || '').toLowerCase().endsWith('.csv')) {
                    throw new Error('Please upload a .csv file.');
                }
                const content = await file.text();
                rawData = await parseCsvText(content);
            } else {
                if (!manualText.trim()) throw new Error("Please paste some CSV data.");
                rawData = await parseCsvText(manualText);
            }

            const { transactions, summary } = normalizeCsvTransactions(rawData);
            setParsedData(transactions);
            setValidationSummary(summary);
            setStatus('preview'); // Show preview before final upload
        } catch (err) {
            console.error("Import Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setStatus('error');
        }
    };

    const confirmUpload = async () => {
        if (!currentUser?.uid) {
            setError('You must be logged in to import transactions.');
            setStatus('error');
            return;
        }
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            setError('You appear to be offline. Please reconnect and try again.');
            setStatus('error');
            return;
        }
        if (!parsedData || parsedData.length === 0) {
            setError('No parsed records to upload. Please process CSV again.');
            setStatus('error');
            return;
        }
        setStatus('uploading');
        setUploadProgress(0);

        try {
            const runUpload = () => withTimeout(
                addTransactionsBatch(currentUser.uid, parsedData, (completed) => {
                    setUploadProgress(completed);
                }),
                60000
            );

            try {
                await runUpload();
            } catch (firstError) {
                if (String(firstError?.message || '').toLowerCase().includes('taking too long')) {
                    await runUpload();
                } else {
                    throw firstError;
                }
            }

            setStatus('success');
            setTimeout(() => {
                handleClose();
            }, 2500);

        } catch (err) {
            console.error('Upload Error:', err);
            const details = err?.code ? ` (${err.code})` : '';
            setError((err?.message || 'Upload failed. Check your internet connection and try again.') + details);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
                    <motion.div
                        className="modal-container glass-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="header-title">
                                <Table className="header-icon" />
                                <h3>CSV Data Import</h3>
                            </div>
                            <button className="modal-close" onClick={handleClose}><X size={20} /></button>
                        </div>

                        <div className="modal-tabs">
                            <button className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`} onClick={() => { setActiveTab('file'); setError(''); }}>Upload File</button>
                            <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => { setActiveTab('manual'); setError(''); }}>Paste Data</button>
                        </div>

                        <div className="modal-body">
                            <AnimatePresence mode="wait">
                                {status === 'idle' || status === 'error' ? (
                                    <motion.div 
                                        key="input"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        {activeTab === 'file' ? (
                                            <div 
                                                className={`drop-zone ${file ? 'has-file' : ''}`}
                                                onClick={() => fileInputRef.current?.click()}
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('drag-over');
                                                    const dropped = e.dataTransfer.files[0];
                                                    if (dropped?.name.endsWith('.csv')) {
                                                        setFile(dropped);
                                                        setError('');
                                                        setStatus('idle');
                                                        setValidationSummary(null);
                                                    }
                                                    else setError('Please drop a valid .csv file');
                                                }}
                                            >
                                                <Upload size={32} className="upload-icon" />
                                                <p>{file ? file.name : "Select or drag CSV file"}</p>
                                                <span className="file-desc">Supported: Date, Description, Amount (Max 5MB)</span>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    style={{ display: 'none' }} 
                                                    accept=".csv" 
                                                    onChange={handleFileChange} 
                                                />
                                            </div>
                                        ) : (
                                            <div className="manual-input-container">
                                                <textarea 
                                                    className="manual-text-input"
                                                    placeholder="Date, Description, Amount&#10;2026-03-21, Grocery, -25.50&#10;2026-03-22, Salary, 5000"
                                                    value={manualText}
                                                    onChange={(e) => setManualText(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        
                                        {error && (
                                            <div className="error-message">
                                                <AlertCircle size={16} />
                                                <span>{error}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : status === 'preview' ? (
                                    <motion.div 
                                        key="preview"
                                        className="preview-container"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <h4>Data Preview ({parsedData.length} records)</h4>
                                        {validationSummary && (
                                            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                <div>
                                                    Processed {validationSummary.totalRows} rows: {validationSummary.validRows} valid, {validationSummary.skippedRows} skipped, {validationSummary.duplicateRows} duplicates removed.
                                                </div>
                                                {validationSummary.errors.length > 0 && (
                                                    <div style={{ marginTop: '6px' }}>
                                                        {validationSummary.errors.map((err, i) => (
                                                            <div key={`${err}-${i}`}>{err}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="preview-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ position: 'sticky', top: 0, backgroundColor: 'var(--sidebar-bg)', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)' }}>Date</th>
                                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)' }}>Description</th>
                                                        <th style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsedData.slice(0, 5).map((tx, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '8px' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                                            <td style={{ padding: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                                                            <td style={{ padding: '8px', color: tx.type === 'expense' ? '#f43f5e' : '#10b981' }}>{tx.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Showing first 5 rows. Is this data correct?</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="status"
                                        className="status-display"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        {status === 'success' ? (
                                            <div className="success-anim">
                                                <CheckCircle size={60} className="success-icon" />
                                                <h4>Import Complete!</h4>
                                                <p>Added {parsedData.length} transactions.</p>
                                            </div>
                                        ) : (
                                            <div className="processing-block">
                                                <Loader2 className="animate-spin proc-spinner" size={48} />
                                                <h4>{status === 'validating' ? 'Analyzing Data...' : 'Syncing Transactions...'}</h4>
                                                <p>{uploadProgress === 0 ? `Starting upload for ${parsedData.length} records...` : `${uploadProgress} of ${parsedData.length} records processed`}</p>
                                                
                                                <div className="progress-bar-bg">
                                                    <motion.div 
                                                        className="progress-bar-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(uploadProgress / (parsedData.length || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={handleClose} disabled={status === 'uploading'}>Cancel</button>
                            
                            {status === 'preview' ? (
                                <button className="modal-btn save glass-button" onClick={confirmUpload} disabled={parsedData.length === 0}>
                                    Confirm & Upload
                                </button>
                            ) : (
                                <button 
                                    className="modal-btn save glass-button"
                                    onClick={startImport}
                                    disabled={(status === 'uploading' || status === 'validating') || (activeTab === 'file' ? !file : !manualText.trim())}
                                >
                                    {status === 'uploading' || status === 'validating' ? (
                                        <><Loader2 size={16} className="animate-spin" /> Processing</>
                                    ) : (
                                        <><Play size={16} /> Process & Preview</>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CsvUploadModal;
