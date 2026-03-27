// CloudService.js - Optimized (NO DELAY)

const STORAGE_KEY_BUDGET = 'spendsense_budget';
const STORAGE_KEY_TRANSACTIONS = 'spendsense_transactions';
const STORAGE_KEY_USER = 'spendsense_user';

class CloudService {

    async login() {
        const user = {
            id: 'u1',
            name: 'Prashanth Chowdary',
            email: 'kavuriprashanthchowdary@gmail.com'
        };

        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        return user;
    }

    async getBudget() {
        const stored = localStorage.getItem(STORAGE_KEY_BUDGET);

        const budget = stored
            ? JSON.parse(stored)
            : { total: 50000, spent: 35000, currency: '₹' };

        return budget;
    }

    async updateBudget(newBudget) {
        localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(newBudget));
        return newBudget;
    }

    async getTransactions() {
        const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

        let transactions = stored
            ? JSON.parse(stored)
            : [
                { id: 1, category: 'Shopping', date: '15 Mar 2023, 8:20 PM', amount: 12000, icon: 'shopping-bag' },
                { id: 2, category: 'Food', date: '15 Mar 2023, 5:20 PM', amount: 89, icon: 'utensils' },
                { id: 3, category: 'Travel', date: '14 Mar 2023, 10:00 AM', amount: 150, icon: 'car' },
            ];

        return transactions;
    }

    async addTransaction(transaction) {
        const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
        const current = stored ? JSON.parse(stored) : [];

        const newTransaction = {
            ...transaction,
            id: Date.now()
        };

        const updated = [newTransaction, ...current];
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));

        // update budget
        const budgetStored = localStorage.getItem(STORAGE_KEY_BUDGET);
        if (budgetStored) {
            const budget = JSON.parse(budgetStored);
            budget.spent += transaction.amount;
            localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budget));
        }

        return newTransaction;
    }
}

export const cloudService = new CloudService();
