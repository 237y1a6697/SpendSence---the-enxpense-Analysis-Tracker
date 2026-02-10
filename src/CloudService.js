// CloudService.js - A mock implementation for cloud operations
// In a real production app, you would replace this with Firebase or Supabase calls.

const STORAGE_KEY_BUDGET = 'spendsense_budget';
const STORAGE_KEY_TRANSACTIONS = 'spendsense_transactions';
const STORAGE_KEY_USER = 'spendsense_user';

class CloudService {
    constructor() {
        // Simulate latency
        this.latency = 600;
    }

    async login() {
        // Simulate cloud login
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = { id: 'u1', name: 'Prashanth Chowdary', email: 'kavuriprashanthchowdary@gmail.com' };
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
                resolve(user);
            }, this.latency);
        });
    }

    async getBudget() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stored = localStorage.getItem(STORAGE_KEY_BUDGET);
                // Default budget if none exists
                const budget = stored ? JSON.parse(stored) : { total: 50000, spent: 35000, currency: '₹' };
                resolve(budget);
            }, this.latency);
        });
    }

    async updateBudget(newBudget) {
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(newBudget));
                resolve(newBudget);
            }, this.latency);
        });
    }

    async getTransactions() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
                // Default transactions if none exists
                let transactions = stored ? JSON.parse(stored) : [
                    { id: 1, category: 'Shopping', date: '15 Mar 2023, 8:20 PM', amount: 12000, icon: 'shopping-bag' },
                    { id: 2, category: 'Food', date: '15 Mar 2023, 5:20 PM', amount: 89, icon: 'utensils' },
                    { id: 3, category: 'Travel', date: '14 Mar 2023, 10:00 AM', amount: 150, icon: 'car' },
                ];
                resolve(transactions);
            }, this.latency);
        });
    }

    async addTransaction(transaction) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
                const current = stored ? JSON.parse(stored) : [];
                const newTransaction = { ...transaction, id: Date.now() };
                const updated = [newTransaction, ...current];
                localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));

                // Also update spent amount in budget automatically for demo
                const budgetStored = localStorage.getItem(STORAGE_KEY_BUDGET);
                if (budgetStored) {
                    const budget = JSON.parse(budgetStored);
                    budget.spent += transaction.amount;
                    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budget));
                }

                resolve(newTransaction);
            }, this.latency);
        });
    }
}

export const cloudService = new CloudService();
