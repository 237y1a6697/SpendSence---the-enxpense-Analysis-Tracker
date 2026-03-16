import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { autoCategorize } from '../utils/categorize';
import { addTransaction } from '../services/db';
import { useAuth } from '../context/AuthContext';
import './Modals.css';

const CsvUploadModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, parsing, uploading, success, error
  const [error, setError] = useState('');
  const [parsedCount, setParsedCount] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isCsv = selectedFile.type === 'text/csv' || 
                    selectedFile.type === 'application/vnd.ms-excel' ||
                    selectedFile.name.endsWith('.csv');
      
      if (isCsv) {
        setFile(selectedFile);
        setStatus('idle');
        setError('');
      } else {
        setError('Please select a valid CSV file.');
        setFile(null);
      }
    }
  };

  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'manual'
  const [manualText, setManualText] = useState('');

  const handleManualImport = () => {
    if (!manualText.trim()) return setError('Please paste some CSV data.');
    
    // Convert text to a File-like object or just parse string
    setStatus('parsing');
    setError('');
    
    Papa.parse(manualText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => processParsedData(results.data),
      error: (err) => {
        setError('Failed to parse the text. Ensure it is valid CSV format.');
        setStatus('error');
      }
    });
  };

  const processParsedData = async (data) => {
    if (!data || data.length === 0) {
      setError('No data found. Ensure your headers match: Date, Description, Amount');
      setStatus('error');
      return;
    }

    try {
      setStatus('uploading');
      setParsedCount(data.length);

      const uploadPromises = data.map((row, index) => {
        const keys = Object.keys(row);
        console.log(`Processing row ${index}, keys:`, keys);
        
        const findKey = (possibleNames) => 
            keys.find(k => k && possibleNames.includes(k.trim().toLowerCase()));

        const amountKey = findKey(['amount', 'amt', 'value', 'transaction amount', 'amount (inr)', 'credit/debit']);
        const descKey = findKey(['description', 'desc', 'narration', 'particulars', 'remarks', 'transaction details']);
        const dateKey = findKey(['date', 'transaction date', 'txn date', 'value date']);

        const rawAmount = amountKey ? row[amountKey] : "0";
        const cleanAmount = String(rawAmount).replace(/[^\d.-]/g, '');
        const amount = parseFloat(cleanAmount);
        
        const description = descKey ? row[descKey] : 'Imported Transaction';
        const { category, icon } = autoCategorize(description);
        const dateValue = dateKey ? row[dateKey] : new Date().toLocaleDateString('en-IN');

        return addTransaction(currentUser.uid, {
          amount: isNaN(amount) ? 0 : Math.abs(amount),
          category,
          description,
          icon,
          date: dateValue,
          type: amount < 0 ? 'expense' : 'income',
          status: 'Completed'
        });
      });

      await Promise.all(uploadPromises);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setFile(null);
        setManualText('');
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error("Firestore Upload Error:", err);
      setError(`Database Error: ${err.message || 'Check your permissions'}`);
      setStatus('error');
    }
  };

  const handleUpload = () => {
    if (activeTab === 'manual') return handleManualImport();
    
    if (!file) {
      setError('Please select a CSV file first.');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => processParsedData(results.data),
      error: (err) => {
        setError('Failed to parse the CSV file.');
        setStatus('error');
      }
    });
  };

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
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <h3>Import Transactions</h3>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                    className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('file')}
                    style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'file' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'file' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
                >
                    CSV File
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('manual')}
                    style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'manual' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'manual' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
                >
                    Paste Text
                </button>
            </div>

            <div className="modal-body">
              <div className="upload-area" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                {(status === 'idle' || status === 'error') && (
                  <>
                    {activeTab === 'file' ? (
                      <>
                        <div className="upload-icon-wrapper">
                          <Upload size={40} color={file ? "#4ade80" : "var(--primary)"} />
                        </div>
                        <p>{file ? `File: ${file.name}` : "Select your bank statement (.csv)"}</p>
                        <input 
                          type="file" 
                          id="csv-file" 
                          accept=".csv" 
                          onChange={handleFileChange} 
                          style={{ display: 'none' }} 
                        />
                        <label htmlFor="csv-file" className={`glass-button btn-sm ${file ? 'success' : 'outline'}`} style={{ marginTop: '10px' }}>
                          {file ? 'Change File' : 'Browse Files'}
                        </label>
                      </>
                    ) : (
                      <textarea 
                        className="manual-paste-area glass-panel"
                        placeholder="Paste CSV data here... (e.g. Date,Description,Amount)"
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', resize: 'none', outline: 'none' }}
                      />
                    )}
                  </>
                )}

                {(status === 'parsing' || status === 'uploading') && (
                  <div className="status-container">
                    <Loader2 className="spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '15px' }}>{status === 'parsing' ? 'Analyzing Data...' : `Uploading ${parsedCount} transactions...`}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="status-container success">
                    <CheckCircle size={40} color="#4ade80" />
                    <p style={{ marginTop: '15px' }}>Successfully imported {parsedCount} transactions!</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="status-container error" style={{ marginTop: '15px', padding: '15px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '10px', justifyContent: 'center' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontWeight: '500' }}>{error}</span>
                    </div>
                    <button className="glass-button btn-sm outline" onClick={() => { setStatus('idle'); setError(''); }}>Try Again</button>
                  </div>
                )}
              </div>

              <div className="csv-format-info" style={{ marginTop: '20px', fontSize: '0.85rem' }}>
                <p><strong>Required Format:</strong></p>
                <div className="sample-csv glass-panel" style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', fontFamily: 'monospace', borderRadius: '8px', margin: '5px 0' }}>
                  Date,Description,Amount<br/>
                  12-02-2025,Salary,50000<br/>
                  13-02-2025,Food,-350
                </div>
                <p className="hint" style={{ color: 'var(--text-muted)' }}>* Expense amounts should be negative.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button 
                className={`modal-btn save glass-button ${(activeTab === 'file' ? !file : !manualText) ? 'disabled' : ''}`}
                onClick={handleUpload} 
                disabled={status === 'parsing' || status === 'uploading' || (activeTab === 'file' ? !file : !manualText)}
              >
                {status === 'uploading' ? 'Uploading...' : 'Import Now'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CsvUploadModal;
