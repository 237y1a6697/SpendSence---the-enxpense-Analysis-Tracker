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

  const handleUpload = () => {
    if (!file) {
      setError('Please select a CSV file first.');
      setStatus('error');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to upload files.');
      setStatus('error');
      return;
    }

    console.log("Starting CSV upload for file:", file.name);
    setStatus('parsing');
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("CSV Parsing results:", results);
        
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV Parsing had errors:", results.errors);
        }

        try {
          const data = results.data;
          if (!data || data.length === 0) {
            setError('The CSV file appears to be empty or formatted incorrectly.');
            setStatus('error');
            return;
          }

          setStatus('uploading');
          setParsedCount(data.length);

          const uploadPromises = data.map((row, index) => {
            const keys = Object.keys(row);
            const findKey = (possibleNames) => 
               keys.find(k => k && possibleNames.includes(k.trim().toLowerCase()));

            const amountKey = findKey(['amount', 'amt', 'value', 'transaction amount', 'amount (inr)']);
            const descKey = findKey(['description', 'desc', 'narration', 'particulars', 'remarks']);
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
            }).catch(e => {
              console.error(`Row ${index} failed:`, e);
              throw e;
            });
          });

          await Promise.all(uploadPromises);
          console.log(`Successfully uploaded ${data.length} transactions`);
          setStatus('success');
          
          setTimeout(() => {
            onClose();
            setFile(null);
            setStatus('idle');
          }, 2000);
        } catch (err) {
          console.error("Full CSV Upload process failed:", err);
          setError(`Upload failed: ${err.message || 'Firestore connection issue'}`);
          setStatus('error');
        }
      },
      error: (err) => {
        console.error("CSV Parsing failed:", err);
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
            style={{ maxWidth: '450px' }}
          >
            <div className="modal-header">
              <h3>Import Transactions</h3>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="upload-area">
                {(status === 'idle' || status === 'error') && (
                  <>
                    <div className="upload-icon-wrapper">
                      <Upload size={40} color={file ? "#4ade80" : "var(--primary)"} />
                    </div>
                    <p>{file ? `File: ${file.name}` : "Upload your bank statement (.csv)"}</p>
                    <input 
                      type="file" 
                      id="csv-file" 
                      accept=".csv" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="csv-file" className={`glass-button btn-sm ${file ? 'success' : 'outline'}`}>
                      {file ? 'Change File' : 'Select File'}
                    </label>
                  </>
                )}

                {(status === 'parsing' || status === 'uploading') && (
                  <div className="status-container">
                    <Loader2 className="spinner" size={40} />
                    <p>{status === 'parsing' ? 'Parsing CSV...' : `Uploading ${parsedCount} transactions...`}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="status-container success">
                    <CheckCircle size={40} color="#4ade80" />
                    <p>Successfully imported {parsedCount} transactions!</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="status-container error" style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontWeight: '500' }}>{error}</span>
                    </div>
                    <button className="glass-button btn-sm outline" onClick={() => { setStatus('idle'); setError(''); }}>Try Again</button>
                  </div>
                )}
              </div>

              <div className="csv-format-info">
                <p><strong>Expected Format:</strong></p>
                <div className="sample-csv glass-panel">
                  <code>Date,Description,Amount</code><br/>
                  <code>12-02-2025,Salary,50000</code><br/>
                  <code>13-02-2025,Swiggy,-350</code>
                </div>
                <p className="hint">Amounts should be negative for expenses.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button 
                className={`modal-btn save glass-button ${!file ? 'disabled' : ''}`}
                onClick={handleUpload} 
                disabled={status === 'parsing' || status === 'uploading'}
              >
                Import CSV
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CsvUploadModal;
