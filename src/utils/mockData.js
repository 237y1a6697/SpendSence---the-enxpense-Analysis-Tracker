/**
 * Generates a set of mock transactions with dates relative to today.
 */
export const getMockTransactions = () => {
  const now = new Date();
  const generateDate = (daysAgo) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    { id: 'm1', category: 'Shopping', description: 'Amazon Purchase', amount: 4500, date: generateDate(0), type: 'expense', icon: 'shopping-bag' },
    { id: 'm2', category: 'Food', description: 'Swiggy Dinner', amount: 850, date: generateDate(1), type: 'expense', icon: 'utensils' },
    { id: 'm3', category: 'Transport', description: 'Uber Ride', amount: 320, date: generateDate(1), type: 'expense', icon: 'car' },
    { id: 'm4', category: 'Bills', description: 'Electricity Bill', amount: 2400, date: generateDate(2), type: 'expense', icon: 'more-horizontal' },
    { id: 'm5', category: 'Entertainment', description: 'Netflix Subscription', amount: 499, date: generateDate(3), type: 'expense', icon: 'more-horizontal' },
    { id: 'm6', category: 'Health', description: 'Pharmacy', amount: 1200, date: generateDate(4), type: 'expense', icon: 'more-horizontal' },
    { id: 'm7', category: 'Food', description: 'Zomato Lunch', amount: 650, date: generateDate(5), type: 'expense', icon: 'utensils' },
    { id: 'm8', category: 'Salary', description: 'Monthly Salary', amount: 75000, date: generateDate(6), type: 'income', icon: 'more-horizontal' },
    { id: 'm9', category: 'Shopping', description: 'Grocery Mall', amount: 3500, date: generateDate(0), type: 'expense', icon: 'shopping-bag' },
    { id: 'm10', category: 'Transport', description: 'Petrol/Fuel', amount: 2000, date: generateDate(2), type: 'expense', icon: 'car' },
  ];
};
