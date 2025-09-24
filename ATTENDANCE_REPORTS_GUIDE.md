# Attendance Reports Feature

## Overview
The Attendance Reports feature provides comprehensive insights into employee attendance patterns, including daily attendance tracking, monthly summaries, and exportable data for HR and management purposes.

## Features

### 1. **Multiple View Modes**
- **Table View**: Detailed tabular data showing attendance statistics
- **Calendar View**: Visual calendar showing daily attendance status for each employee
- **Chart View**: Graphical representation with performance categories

### 2. **Key Metrics**
- Total working days in the month
- Days present/absent for each employee
- Total hours worked
- Attendance percentage
- Performance categorization (Excellent/Good/Needs Improvement)

### 3. **Export Functionality**
- Export to Excel (.xlsx format) with two sheets:
  - Summary: Employee statistics overview
  - Daily Attendance: Day-by-day attendance matrix

### 4. **Interactive Controls**
- Month/Year navigation
- Employee search functionality
- Real-time filtering

## How to Use

### Accessing Reports
1. Log in as Admin
2. Navigate to the "Reports" tab in the admin dashboard
3. The system will automatically load the current month's data

### Navigating Data
- Use the left/right arrows to navigate between months
- Use the search box to find specific employees
- Switch between Table, Calendar, and Chart views using the view mode buttons

### Understanding the Data

#### Table View
- Shows summary statistics for each employee
- Green numbers indicate good attendance
- Red numbers highlight areas of concern
- Percentage shows overall attendance rate

#### Calendar View
- **P** = Present (full day)
- **H** = Half day
- **A** = Absent
- **-** = Non-working day (weekend/holiday)
- Color coding: Green (present), Yellow (half-day), Red (absent)

#### Chart View
- Progress bars show attendance percentage visually
- Performance categories group employees by attendance rate:
  - Excellent: 90%+ attendance
  - Good: 75-89% attendance  
  - Needs Improvement: <75% attendance

### Exporting Reports
1. Click the "Export Excel" button
2. Choose save location
3. File will contain both summary and detailed daily data
4. File name includes month and year for easy organization

## Data Calculation

### Attendance Percentage
```
Attendance % = (Days Present / Total Working Days) × 100
```

### Working Days
- Based on each employee's configured working days (e.g., Monday-Friday)
- Excludes weekends and holidays
- Accounts for employee-specific schedules

### Day Classification
- **Present**: ≥75% of expected daily hours
- **Half Day**: 25-74% of expected daily hours  
- **Absent**: <25% of expected daily hours or no check-in

## Technical Notes

### Data Sources
- Employee records from Firestore `employees` collection
- Attendance data from `attendanceRecords` collection
- Working hours configuration per employee

### Performance Optimization
- Data is filtered by month/year to improve loading times
- Real-time calculations based on employee working schedules
- Responsive design works on desktop and mobile devices

## Troubleshooting

### Common Issues
1. **No data showing**: Ensure employees have attendance records for the selected month
2. **Export not working**: Check browser popup blockers
3. **Slow loading**: Large datasets may take a few seconds to process

### Data Accuracy
- Attendance is calculated based on actual check-in/check-out times
- Working hours are based on individual employee configurations
- Holiday exclusions are handled automatically