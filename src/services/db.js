import { 
  collection, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "transactions";

// Helper: Custom Event for Local Storage Sync
const dispatchLocalDataEvent = () => {
  window.dispatchEvent(new Event('local_db_update'));
};

const getLocalTxs = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`txs_${userId}`) || "[]");
  } catch(e) { return []; }
};

const saveLocalTxs = (userId, txs) => {
  localStorage.setItem(`txs_${userId}`, JSON.stringify(txs));
  dispatchLocalDataEvent();
};

const hashString = (input) => {
  let hash = 5381;
  const str = String(input || "");
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const buildTransactionDocId = (userId, tx) => {
  const key = [
    userId,
    String(tx?.date || "").slice(0, 10),
    String(tx?.description || "").toLowerCase().trim(),
    Number(tx?.amount || 0).toFixed(2),
    String(tx?.type || "expense").toLowerCase(),
  ].join("|");

  return `tx_${hashString(key)}`;
};

/**
 * Add multiple transactions in batches.
 * Instantly saves to local storage so UI doesn't hang on Firebase issues.
 */
export const addTransactionsBatch = async (userId, transactions, onProgress) => {
  if (!Array.isArray(transactions) || transactions.length === 0) return;

  // 1. Instantly save to LocalStorage for instantaneous UI
  const localTransactions = getLocalTxs(userId);
  const newTxs = transactions.map(tx => ({
    ...tx,
    id: buildTransactionDocId(userId, tx),
    userId,
    createdAt: new Date().toISOString()
  }));
  
  // Deduplicate before merging
  const existingIds = new Set(localTransactions.map(t => t.id));
  const uniqueNewTxs = newTxs.filter(t => !existingIds.has(t.id));
  
  saveLocalTxs(userId, [...localTransactions, ...uniqueNewTxs]);

  // Instantly resolve progress since local save is immediate
  if (onProgress) onProgress(transactions.length);

  // 2. Quietly attempt Firebase sync in the background
  if (db) {
    const defaultBatchSize = 120;
    const chunks = [];
    for (let i = 0; i < uniqueNewTxs.length; i += defaultBatchSize) {
      chunks.push(uniqueNewTxs.slice(i, i + defaultBatchSize));
    }

    // Try syncing without awaiting/blocking the user
    (async () => {
      try {
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(tx => {
            const docRef = doc(db, COLLECTION_NAME, tx.id);
            batch.set(docRef, tx);
          });
          
          await Promise.race([
            batch.commit(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase Sync Timeout")), 10000))
          ]);
        }
      } catch (err) {
        console.warn("Background Firebase sync failed (safe to ignore for local usage):", err);
      }
    })();
  }
};

/**
 * Add a new transaction
 */
export const addTransaction = async (userId, transaction) => {
  const newTx = {
    ...transaction,
    id: buildTransactionDocId(userId, transaction) + "_" + Date.now(),
    userId,
    createdAt: new Date().toISOString()
  };

  const localTxs = getLocalTxs(userId);
  saveLocalTxs(userId, [...localTxs, newTx]);

  if (db) {
    try {
      addDoc(collection(db, COLLECTION_NAME), newTx).catch(err => console.warn("Firebase fallback:", err));
    } catch (e) { /* ignore */ }
  }

  return newTx;
};

/**
 * Fetch transactions for a user (combining local and remote seamlessly)
 */
export const subscribeToTransactions = (userId, callback) => {
  let latestFirebaseData = [];

  const updateCallback = () => {
    const localData = getLocalTxs(userId);
    
    // Combine and deduplicate by ID
    const combinedMap = new Map();
    [...localData, ...latestFirebaseData].forEach(tx => {
      if (tx && tx.id) combinedMap.set(tx.id, tx);
    });

    const finalTxs = Array.from(combinedMap.values())
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      
    callback(finalTxs);
  };

  // Initial trigger
  updateCallback();

  // Listen to local changes
  const localListener = () => updateCallback();
  window.addEventListener('local_db_update', localListener);

  let unsubscribeFirebase = () => {};

  if (db) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    unsubscribeFirebase = onSnapshot(q, (snapshot) => {
      latestFirebaseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateCallback();
    }, (error) => {
      console.warn("Firebase listen error (using local data):", error);
    });
  }

  return () => {
    window.removeEventListener('local_db_update', localListener);
    unsubscribeFirebase();
  };
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (transactionId) => {
  const userId = localStorage.getItem('last_user_id') || ""; // basic fallback if needed
  
  // Actually we need userId to update local storage properly...
  // but let's just search all local storage for this app if we need to
  // For simplicity, assumed userId is currently active user
  // Let's do a quick sweep of localStorage keys starting with txs_
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('txs_')) {
      const data = JSON.parse(localStorage.getItem(key));
      const filtered = data.filter(t => t.id !== transactionId);
      if (filtered.length !== data.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        dispatchLocalDataEvent();
      }
    }
  }

  if (db) {
    deleteDoc(doc(db, COLLECTION_NAME, transactionId)).catch(e => console.warn(e));
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (transactionId, updates) => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('txs_')) {
      const data = JSON.parse(localStorage.getItem(key));
      const idx = data.findIndex(t => t.id === transactionId);
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...updates };
        localStorage.setItem(key, JSON.stringify(data));
        dispatchLocalDataEvent();
      }
    }
  }

  if (db) {
    updateDoc(doc(db, COLLECTION_NAME, transactionId), updates).catch(e => console.warn(e));
  }
};