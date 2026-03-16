import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "transactions";

/**
 * Add multiple transactions in batches for performance (e.g. CSV upload)
 */
export const addTransactionsBatch = async (userId, transactions) => {
  if (!db) return Promise.reject("Firestore not initialized");
  
  // Firestore batch limit is 500 operations
  const BATCH_SIZE = 500;
  const chunks = [];
  
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    chunks.push(transactions.slice(i, i + BATCH_SIZE));
  }

  try {
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(tx => {
        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, {
          ...tx,
          userId,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error("Error committing batch transactions:", error);
    throw error;
  }
};

/**
 * Add a new transaction for a specific user
 */
export const addTransaction = async (userId, transaction) => {
  if (!db) return Promise.reject("Firestore not initialized");
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transaction,
      userId,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

/**
 * Fetch transactions for a user (real-time listener)
 */
export const subscribeToTransactions = (userId, callback) => {
  if (!db) return () => {};
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort client-side
    
    callback(transactions);
  }, (error) => {
    console.error("Error subscribing to transactions:", error);
    // If it fails, also call the callback with empty data to stop the loading screen
    callback([]);
  });
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (transactionId) => {
  if (!db) return Promise.reject("Firestore not initialized");
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, transactionId));
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (transactionId, updates) => {
  if (!db) return Promise.reject("Firestore not initialized");
  try {
    const docRef = doc(db, COLLECTION_NAME, transactionId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};
