
import { Product, UsageLog } from '../types';

const KEYS = {
  SHELF: 'skinlog_shelf',
  HISTORY: 'skinlog_history',
};

export const storage = {
  getShelf: (): Product[] => {
    const data = localStorage.getItem(KEYS.SHELF);
    return data ? JSON.parse(data) : [];
  },
  saveShelf: (products: Product[]) => {
    localStorage.setItem(KEYS.SHELF, JSON.stringify(products));
  },
  getHistory: (): UsageLog[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },
  saveHistory: (logs: UsageLog[]) => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(logs));
  },
  addHistoryEntry: (entry: UsageLog) => {
    const history = storage.getHistory();
    history.push(entry);
    storage.saveHistory(history);
  }
};
