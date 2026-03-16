/**
 * Keywords mapping for automatic expense categorization.
 */
const CATEGORY_KEYWORDS = {
  Food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonalds', 'kfc', 'starbucks', 'food', 'dining'],
  Transport: ['uber', 'ola', 'rapido', 'train', 'flight', 'metro', 'taxi', 'petrol', 'fuel', 'bus'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'clothes', 'zara', 'h&m', 'shopping', 'mall', 'electronics'],
  Bills: ['electricity', 'rent', 'water', 'gas', 'wifi', 'jio', 'airtel', 'recharge', 'subscription', 'netflix'],
  Entertainment: ['movie', 'pvr', 'theatre', 'gaming', 'concert', 'spotify', 'disney'],
  Health: ['pharmacy', 'hospital', 'doctor', 'apollo', 'medical', 'gym', 'fitness']
};

/**
 * Mapping of categories to icon names used in the app.
 */
const CATEGORY_ICONS = {
  Food: 'utensils',
  Transport: 'car',
  Shopping: 'shopping-bag',
  Bills: 'more-horizontal',
  Entertainment: 'more-horizontal',
  Health: 'more-horizontal',
  Miscellaneous: 'more-horizontal'
};

/**
 * Auto-categorizes a transaction based on its description.
 * @param {string} description 
 * @returns {object} { category, icon }
 */
export const autoCategorize = (description) => {
  if (!description) return { category: 'Miscellaneous', icon: 'more-horizontal' };
  
  const descLower = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(word => descLower.includes(word))) {
      return { 
        category, 
        icon: CATEGORY_ICONS[category] || 'more-horizontal' 
      };
    }
  }
  
  return { 
    category: 'Miscellaneous', 
    icon: 'more-horizontal' 
  };
};
