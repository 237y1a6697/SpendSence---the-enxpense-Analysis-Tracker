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
    if (!file) return;

    setStatus('parsing');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data;
          setStatus('uploading');
          setParsedCount(data.length);

          // Map CSV rows to transaction objects
          // Expected format: Date, Description, Amount
          const uploadPromises = data.map(row => {
            // Support both 'Amount' and 'amount' headers
            const rawAmount = row.Amount || row.amount || "0";
            // Remove currency symbols, commas, and handle negative numbers properly
            const cleanAmount = String(rawAmount).replace(/[^\d.-]/g, '');
            const amount = parseFloat(cleanAmount);
            
            const description = row.Description || row.description || 'No Description';
            const { category, icon } = autoCategorize(description);
            const dateStr = row.Date || row.date || new Date().toLocaleDateString('en-IN');

            return addTransaction(currentUser.uid, {
              amount: isNaN(amount) ? 0 : Math.abs(amount),
              category,
              description,
              icon,
              date: dateStr,
              type: amount < 0 ? 'expense' : 'income',
              status: 'Completed'
            });
          });

          await Promise.all(uploadPromises);
          setStatus('success');
          setTimeout(() => {
            onClose();
            setFile(null);
            setStatus('idle');
          }, 2000);
        } catch (err) {
          console.error("CSV Upload failed:", err);
          setError('Failed to upload transactions. Please check the CSV format.');
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
                {status === 'idle' && (
                  <>
                    <div className="upload-icon-wrapper">
                      <Upload size={40} color="var(--primary)" />
                    </div>
                    <p>Upload your bank statement (.csv)</p>
                    <input 
                      type="file" 
                      id="csv-file" 
                      accept=".csv" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="csv-file" className="glass-button btn-sm outline">
                      Select File
                    </label>
                    {file && <div className="file-info"><FileText size={16} /> {file.name}</div>}
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
                  <div className="status-container error">
                    <AlertCircle size={40} color="#ef4444" />
                    <p>{error}</p>
                    <button className="glass-button btn-sm outline" onClick={() => setStatus('idle')}>Try Again</button>
                  </div>
                )}
              </div>

              <div className="csv-format-info">
                <p>Expected CSV format (headers):</p>
                <code>Date, Description, Amount</code>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
              <button 
                className="modal-btn save glass-button" 
                onClick={handleUpload} 
                disabled={!file || status !== 'idle'}
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
