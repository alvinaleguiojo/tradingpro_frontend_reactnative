// Money Management Levels based on progressive growth strategy
export interface MoneyLevel {
  level: number;
  balance: number;
  lotSize: number;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  completed: boolean;
}

export const moneyManagementLevels: MoneyLevel[] = [
  { level: 1, balance: 100.00, lotSize: 0.01, dailyTarget: 3.00, weeklyTarget: 15.00, monthlyTarget: 60.00, completed: false },
  { level: 2, balance: 150.00, lotSize: 0.01, dailyTarget: 4.50, weeklyTarget: 22.50, monthlyTarget: 90.00, completed: false },
  { level: 3, balance: 225.00, lotSize: 0.02, dailyTarget: 6.75, weeklyTarget: 33.75, monthlyTarget: 135.00, completed: false },
  { level: 4, balance: 337.50, lotSize: 0.03, dailyTarget: 10.13, weeklyTarget: 50.63, monthlyTarget: 202.50, completed: false },
  { level: 5, balance: 506.25, lotSize: 0.05, dailyTarget: 15.19, weeklyTarget: 75.94, monthlyTarget: 303.75, completed: false },
  { level: 6, balance: 759.38, lotSize: 0.08, dailyTarget: 22.78, weeklyTarget: 113.91, monthlyTarget: 455.63, completed: false },
  { level: 7, balance: 1139.06, lotSize: 0.12, dailyTarget: 34.17, weeklyTarget: 170.83, monthlyTarget: 683.44, completed: false },
  { level: 8, balance: 1708.59, lotSize: 0.2, dailyTarget: 51.26, weeklyTarget: 256.28, monthlyTarget: 1025.15, completed: false },
  { level: 9, balance: 2562.89, lotSize: 0.3, dailyTarget: 76.89, weeklyTarget: 384.44, monthlyTarget: 1537.78, completed: false },
  { level: 10, balance: 3844.34, lotSize: 0.5, dailyTarget: 115.33, weeklyTarget: 576.67, monthlyTarget: 2306.67, completed: false },
  { level: 11, balance: 5766.51, lotSize: 0.8, dailyTarget: 172.99, weeklyTarget: 864.94, monthlyTarget: 3459.75, completed: false },
  { level: 12, balance: 8649.76, lotSize: 1.3, dailyTarget: 259.49, weeklyTarget: 1297.46, monthlyTarget: 5189.84, completed: false },
  { level: 13, balance: 12974.63, lotSize: 2, dailyTarget: 389.24, weeklyTarget: 1946.19, monthlyTarget: 7784.75, completed: false },
  { level: 14, balance: 19461.94, lotSize: 3, dailyTarget: 583.86, weeklyTarget: 2919.32, monthlyTarget: 11677.28, completed: false },
  { level: 15, balance: 29192.91, lotSize: 5, dailyTarget: 875.79, weeklyTarget: 4378.93, monthlyTarget: 17515.71, completed: false },
  { level: 16, balance: 43789.37, lotSize: 8, dailyTarget: 1313.68, weeklyTarget: 6568.42, monthlyTarget: 26273.69, completed: false },
  { level: 17, balance: 65684.05, lotSize: 13, dailyTarget: 1970.52, weeklyTarget: 9852.60, monthlyTarget: 39410.40, completed: false },
  { level: 18, balance: 98526.08, lotSize: 20, dailyTarget: 2955.78, weeklyTarget: 14778.91, monthlyTarget: 59115.64, completed: false },
  { level: 19, balance: 147789.12, lotSize: 30, dailyTarget: 4433.67, weeklyTarget: 22168.36, monthlyTarget: 88673.44, completed: false },
  { level: 20, balance: 221683.68, lotSize: 50, dailyTarget: 6650.51, weeklyTarget: 33252.56, monthlyTarget: 133010.24, completed: false },
];

// Get current level based on account balance
export const getCurrentLevel = (balance: number): MoneyLevel => {
  // Find the highest level where balance meets or exceeds the threshold
  for (let i = moneyManagementLevels.length - 1; i >= 0; i--) {
    if (balance >= moneyManagementLevels[i].balance) {
      return moneyManagementLevels[i];
    }
  }
  return moneyManagementLevels[0]; // Default to level 1
};

// Get next level target
export const getNextLevel = (balance: number): MoneyLevel | null => {
  const currentLevel = getCurrentLevel(balance);
  const nextIndex = moneyManagementLevels.findIndex(l => l.level === currentLevel.level) + 1;
  if (nextIndex < moneyManagementLevels.length) {
    return moneyManagementLevels[nextIndex];
  }
  return null; // Already at max level
};

// Calculate progress to next level (0-100%)
export const getProgressToNextLevel = (balance: number): number => {
  const currentLevel = getCurrentLevel(balance);
  const nextLevel = getNextLevel(balance);
  
  if (!nextLevel) return 100; // Max level reached
  
  const progress = ((balance - currentLevel.balance) / (nextLevel.balance - currentLevel.balance)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// Format currency
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Check if daily target is reached
export const isDailyTargetReached = (balance: number, dailyProfit: number): boolean => {
  const currentLevel = getCurrentLevel(balance);
  return dailyProfit >= currentLevel.dailyTarget;
};

// Get remaining target for the day
export const getRemainingDailyTarget = (balance: number, dailyProfit: number): number => {
  const currentLevel = getCurrentLevel(balance);
  return Math.max(0, currentLevel.dailyTarget - dailyProfit);
};

// Get daily target progress percentage
export const getDailyTargetProgress = (balance: number, dailyProfit: number): number => {
  const currentLevel = getCurrentLevel(balance);
  if (currentLevel.dailyTarget <= 0) return 0;
  return Math.min((dailyProfit / currentLevel.dailyTarget) * 100, 100);
};
