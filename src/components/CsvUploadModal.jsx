import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle, AlertCircle, Loader2, Play, Table } from 'lucide-react';
import Papa from 'papaparse';
import { autoCategorize } from '../utils/categorize';
import { addTransactionsBatch } from '../services/db';
import { useAuth } from '../context/AuthContext';
import './Modals.css';

const CsvUploadModal = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, validating, uploading, success, error
    const [error, setError] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('file'); // 'file' or 'manual'
    const [manualText, setManualText] = useState('');
    const fileInputRef = useRef(null);

    const resetState = () => {
        setFile(null);
        setManualText('');
        setStatus('idle');
        setUploadProgress(0);
        setError('');
        setParsedData([]);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setStatus('idle');
        }
    };

    const parseCsvData = (csvContent) => {
        return new Promise((resolve, reject) => {
            Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0 && results.data.length === 0) {
                        reject(new Error("Failed to parse CSV. Check the file format."));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => reject(error)
            });
        });
    };

    const validateAndProcess = async (rawData) => {
        if (!rawData || rawData.length === 0) {
            throw new Error('No data found in the input.');
        }

        const keys = Object.keys(rawData[0]);
        const findKey = (possibleNames) => 
            keys.find(k => k && possibleNames.includes(k.trim().toLowerCase()));

        const amountKey = findKey(['amount', 'amt', 'value', 'transaction amount', 'amount (inr)', 'credit/debit', 'balance']);
        const descKey = findKey(['description', 'desc', 'narration', 'particulars', 'remarks', 'transaction details']);
        const dateKey = findKey(['date', 'transaction date', 'txn date', 'value date']);

        const processed = rawData.map((row) => {
            const rowKeys = Object.keys(row);
            const rawDate = dateKey ? row[dateKey] : row[rowKeys[0]];
            const rawDesc = descKey ? row[descKey] : row[rowKeys[1]];
            const rawAmount = amountKey ? row[amountKey] : row[rowKeys[2]];

            const cleanAmount = String(rawAmount || "0").replace(/[^\d.-]/g, '');
            const amountValue = parseFloat(cleanAmount);
            const { category, icon } = autoCategorize(String(rawDesc || ""));

            return {
                amount: isNaN(amountValue) ? 0 : Math.abs(amountValue),
                category,
                description: String(rawDesc || "Imported"),
                icon: icon || "more-horizontal",
                date: String(rawDate || new Date().toLocaleDateString()),
                type: amountValue < 0 ? 'expense' : 'income',
                status: 'Completed'
            };
        }).filter(t => (t.description !== "Imported" || t.amount !== 0) && t.description.trim() !== "");

        if (processed.length === 0) {
            throw new Error("Could not find any valid transactions. Ensure your CSV has Date, Description, and Amount columns.");
        }

        return processed;
    };

    const startImport = async () => {
        if (status === 'uploading') return;
        setStatus('validating');
        setError('');
        
        try {
            let rawData;
            if (activeTab === 'file') {
                if (!file) throw new Error("Please select a file.");
                const content = await file.text();
                rawData = await parseCsvData(content);
            } else {
                if (!manualText.trim()) throw new Error("Please paste some CSV data.");
                rawData = await parseCsvData(manualText);
            }

            const transactions = await validateAndProcess(rawData);
            setParsedData(transactions);
            
            setStatus('uploading');
            setUploadProgress(0);

            await addTransactionsBatch(currentUser.uid, transactions, (completed) => {
                setUploadProgress(completed);
            });

            setStatus('success');
            setTimeout(() => {
                onClose();
                resetState();
            }, 2500);

        } catch (err) {
            console.error("Import Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
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
                            <button className="modal-close" onClick={onClose}><X size={20} /></button>
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
                                            >
                                                <Upload size={32} className="upload-icon" />
                                                <p>{file ? file.name : "Select or drag CSV file"}</p>
                                                <span className="file-desc">Supported: Bank statements, exports</span>
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
                                                    placeholder="Date, Description, Amount&#10;2024-03-21, Grocery, -25.50&#10;2024-03-22, Salary, 5000"
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
                                                <p>{uploadProgress} of {parsedData.length} records processed</p>
                                                
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
                            <button className="modal-btn cancel" onClick={onClose} disabled={status === 'uploading'}>Cancel</button>
                            <button 
                                className="modal-btn save glass-button"
                                onClick={startImport}
                                disabled={status === 'uploading' || (activeTab === 'file' ? !file : !manualText.trim())}
                            >
                                {status === 'uploading' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Processing</>
                                ) : (
                                    <><Play size={16} /> Process & Import</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CsvUploadModal;
