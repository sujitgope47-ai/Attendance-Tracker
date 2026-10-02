# 🎓 My Attendance Tracker

A modern, responsive, and feature-complete **Personal Attendance Tracker Web Application** tailored for college students. Built with standard **HTML5**, **CSS3**, and **Vanilla JavaScript** using **LocalStorage** for 100% offline data persistence without requiring any backend or MongoDB database.

---

## 🌟 Key Features

1. **🔐 Student Login & Session Management**
   - User authentication screen with Student Name, Roll Number, Branch/Course, and optional PIN.
   - Quick "Demo Guest Login" for instant testing.
   - Session state saved in LocalStorage with a one-click **Logout** button in the sidebar.

2. **🎉 College Holidays & Vacations Tracker**
   - Record official college holidays, festival breaks, Sundays, and campus events.
   - Holidays are automatically highlighted on the interactive **Calendar View** (🟡 badge).
   - Displayed in day details and excluded from attendance penalties.

3. **📊 Interactive Dashboard**
   - Overall attendance percentage with dynamic SVG progress ring.
   - Total classes conducted, attended, missed, and total subject count.
   - Current month percentage indicator.
   - Quick one-click daily attendance marking form.
   - Goal Target Simulator providing exact calculations for upcoming classes.

4. **📚 Subject Management**
   - Full CRUD: Add, Edit, and Delete subjects.
   - Assign Subject Code, Subject Name, Faculty Name, and custom accent badge color.
   - Subject-wise table summary with per-subject attendance stats and status indicators.

5. **✅ Daily Attendance Marking**
   - Select date and subject, then mark **Present** or **Absent**.
   - Automatic background calculations and immediate UI update with Toast notifications.

6. **📅 Interactive Monthly Calendar View**
   - View days color-coded with Present (🟢), Absent (🔴), and Holiday (🟡) counters.
   - Click any date to view, edit, delete, or add attendance records for that specific date.

7. **📜 Attendance History & Filter Log**
   - Detailed log table of all class entries.
   - Filters: Filter by Subject, Filter by Month, Filter by Status (Present / Absent).

8. **🎯 Attendance Goal Target & Warning System**
   - Configurable target percentage (Default **75%**).
   - Dynamic math calculations for required consecutive classes or max safe classes to skip.
   - Status Badges & Alerts:
     - **Safe**: $\ge 75\%$
     - **Warning**: $65\% - 74\%$
     - **Low Attendance**: $< 65\%$

9. **📈 Visual Analytics & Reports (Chart.js)**
   - Subject-wise Attendance Percentage Bar Chart.
   - Overall Present vs. Absent Doughnut Chart.
   - Monthly summary breakdown (Total, Attended, Absent, Monthly %).

10. **💾 Data Persistence, Export & Backup**
   - Data stored in browser `LocalStorage` (remains intact upon refresh/closing browser).
   - **CSV Export**: Download full attendance log as `.csv` file.
   - **JSON Backup**: Export and Import `.json` backup files.
   - **Print Report**: Print-friendly CSS `@media print` layout.
   - **Demo Data & Reset**: Option to load realistic sample college data or perform a clean slate reset.

11. **🌙 Dark / Light Mode**
   - Toggle theme button in header bar. Preference persisted in LocalStorage.

---

## 📁 File Structure

```
attendance-tracker/
│
├── index.html       # Single-Page Application (SPA) HTML5 structure
├── style.css        # Responsive CSS3 stylesheet with CSS variables & themes
├── script.js        # Vanilla JS application logic & state management
├── README.md        # Documentation & user guide
└── assets/          # Static assets & icons
```

---

## 🚀 How to Run in VS Code using Live Server

1. Open **VS Code**.
2. Open the project folder `c:\Users\hp\Desktop\ATTENDACE` (or `attendance-tracker`).
3. Install the **Live Server** extension by *Ritwick Dey* from the VS Code Extensions Marketplace (if not already installed).
4. Right-click on `index.html` and select **"Open with Live Server"** (or press `Alt + L, Alt + O`).
5. Your browser will automatically launch `http://127.0.0.1:5500/index.html`.
