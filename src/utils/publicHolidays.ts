// Common public holidays that will be automatically marked in the calendar
export interface PublicHoliday {
  date: string; // Format: YYYY-MM-DD
  name: string;
  description: string;
  isRecurring: boolean; // If true, appears every year
  country?: string;
}

// List of common public holidays (you can customize this for your region)
export const PUBLIC_HOLIDAYS_2024: PublicHoliday[] = [
  // New Year's Day
  {
    date: '2024-01-01',
    name: 'New Year\'s Day',
    description: 'Beginning of the new calendar year',
    isRecurring: true,
    country: 'Global'
  },
  
  // Independence Day (adjust for your country)
  {
    date: '2024-07-04',
    name: 'Independence Day',
    description: 'National independence celebration',
    isRecurring: true,
    country: 'US'
  },
  
  // Christmas Day
  {
    date: '2024-12-25',
    name: 'Christmas Day',
    description: 'Christian holiday celebrating the birth of Jesus Christ',
    isRecurring: true,
    country: 'Global'
  },
  
  // Christmas Eve
  {
    date: '2024-12-24',
    name: 'Christmas Eve',
    description: 'Evening before Christmas Day',
    isRecurring: true,
    country: 'Global'
  },
  
  // Labor Day
  {
    date: '2024-05-01',
    name: 'Labor Day',
    description: 'International Workers\' Day',
    isRecurring: true,
    country: 'Global'
  },
  
  // Valentine's Day
  {
    date: '2024-02-14',
    name: 'Valentine\'s Day',
    description: 'Day of love and romance',
    isRecurring: true,
    country: 'Global'
  }
];

export const PUBLIC_HOLIDAYS_2025: PublicHoliday[] = [
  // New Year's Day
  {
    date: '2025-01-01',
    name: 'New Year\'s Day',
    description: 'Beginning of the new calendar year',
    isRecurring: true,
    country: 'Global'
  },
  
  // Independence Day (adjust for your country)
  {
    date: '2025-07-04',
    name: 'Independence Day',
    description: 'National independence celebration',
    isRecurring: true,
    country: 'US'
  },
  
  // Christmas Day
  {
    date: '2025-12-25',
    name: 'Christmas Day',
    description: 'Christian holiday celebrating the birth of Jesus Christ',
    isRecurring: true,
    country: 'Global'
  },
  
  // Christmas Eve
  {
    date: '2025-12-24',
    name: 'Christmas Eve',
    description: 'Evening before Christmas Day',
    isRecurring: true,
    country: 'Global'
  },
  
  // Labor Day
  {
    date: '2025-05-01',
    name: 'Labor Day',
    description: 'International Workers\' Day',
    isRecurring: true,
    country: 'Global'
  },
  
  // Valentine's Day
  {
    date: '2025-02-14',
    name: 'Valentine\'s Day',
    description: 'Day of love and romance',
    isRecurring: true,
    country: 'Global'
  }
];

// Combine all years
export const ALL_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  ...PUBLIC_HOLIDAYS_2024,
  ...PUBLIC_HOLIDAYS_2025
];

// Function to get public holidays for a specific year
export const getPublicHolidaysForYear = (year: number): PublicHoliday[] => {
  return ALL_PUBLIC_HOLIDAYS.filter(holiday => 
    holiday.date.startsWith(year.toString())
  );
};

// Function to check if a date is a public holiday
export const isPublicHoliday = (date: string): PublicHoliday | null => {
  return ALL_PUBLIC_HOLIDAYS.find(holiday => holiday.date === date) || null;
};

// Function to generate holidays for future years (for recurring holidays)
export const generateHolidaysForYear = (year: number): PublicHoliday[] => {
  const baseHolidays = PUBLIC_HOLIDAYS_2025; // Use 2025 as template
  
  return baseHolidays
    .filter(holiday => holiday.isRecurring)
    .map(holiday => ({
      ...holiday,
      date: holiday.date.replace('2025', year.toString())
    }));
};