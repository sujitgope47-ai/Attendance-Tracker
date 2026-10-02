/**
 * ============================================================================
 * MY ATTENDANCE TRACKER - MAIN JAVASCRIPT APPLICATION LOGIC
 * ============================================================================
 * This script handles single-page app state management, LocalStorage persistence,
 * User Authentication (Sign In & New User Registration), Holidays tracking,
 * UI rendering, calculations, calendar generation, Chart.js graphs, and JSON/CSV backup.
 *
 * Beginner-friendly code comments provided throughout for Diploma CSE students!
 */

// ----------------------------------------------------------------------------
// 1. GLOBAL STATE DEFINITION & LOCALSTORAGE INITIALIZATION
// ----------------------------------------------------------------------------

const STORAGE_KEY = 'my_attendance_tracker_data';
const THEME_KEY = 'my_attendance_tracker_theme';
const USERS_DB_KEY = 'my_attendance_tracker_users';

// Default initial application state if LocalStorage is empty
const defaultState = {
    user: {
        isLoggedIn: false,
        name: 'College Student',
        email: '',
        roll: '',
        branch: 'Diploma CSE',
        pin: ''
    },
    settings: {
        studentName: 'College Student',
        studentBranch: 'Diploma CSE',
        targetPercentage: 75,
        theme: 'dark'
    },
    subjects: [],
    attendance: [],
    holidays: []
};

// Main reactive state container
let appState = loadStateFromStorage();

// Database of registered users saved in LocalStorage
let registeredUsers = loadRegisteredUsers();

// Global reference for Chart.js instances
let chartInstances = {
    subjectBar: null,
    ratioDoughnut: null
};

// Calendar navigation state (Year and Month)
let calendarCurrentDate = new Date();

/**
 * Reads and parses saved application data from browser LocalStorage
 */
function loadStateFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return {
                user: { ...defaultState.user, ...parsed.user },
                settings: { ...defaultState.settings, ...parsed.settings },
                subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
                attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
                holidays: Array.isArray(parsed.holidays) ? parsed.holidays : []
            };
        }
    } catch (err) {
        console.error('Error parsing LocalStorage data:', err);
    }
    return JSON.parse(JSON.stringify(defaultState));
}

/**
 * Reads registered user accounts database
 */
function loadRegisteredUsers() {
    try {
        const users = localStorage.getItem(USERS_DB_KEY);
        return users ? JSON.parse(users) : [];
    } catch (err) {
        console.error('Error loading registered users:', err);
        return [];
    }
}

function saveRegisteredUsers() {
    try {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(registeredUsers));
    } catch (err) {
        console.error('Error saving registered users:', err);
    }
}

/**
 * Saves current appState into LocalStorage
 */
function saveStateToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
        console.error('Failed to save to LocalStorage:', err);
        showToast('Failed to save data to browser storage', 'danger');
    }
}


// ----------------------------------------------------------------------------
// 2. DOM ELEMENT REFERENCES & EVENT LISTENERS
// ----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupNavigation();
    setupEventListeners();
    setDefaultFormDates();
    checkAuthStatus();
    
    // Initial Render of All Views
    renderAllViews();
});

/**
 * Checks User Authentication Login Status
 */
function checkAuthStatus() {
    const authOverlay = document.getElementById('authOverlay');
    if (!appState.user || !appState.user.isLoggedIn) {
        authOverlay.classList.add('active');
    } else {
        authOverlay.classList.remove('active');
        updateUserProfileDisplay();
    }
}

function updateUserProfileDisplay() {
    const name = appState.user.name || appState.settings.studentName || 'College Student';
    const role = appState.user.branch || appState.settings.studentBranch || 'Diploma CSE';

    document.getElementById('profileNameDisplay').textContent = name;
    document.getElementById('profileRoleDisplay').textContent = role;

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('avatarDisplay').textContent = initials || 'CS';
}

/**
 * Sets up initial theme (Dark/Light mode) based on stored preferences
 */
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || appState.settings.theme || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    appState.settings.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');
    if (themeIcon && themeLabel) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-moon';
            themeLabel.textContent = 'Dark Mode';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
            themeLabel.textContent = 'Light Mode';
        }
    }
    renderCharts();
}

/**
 * Single-Page Application (SPA) Navigation Tab Switcher
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item, [data-tab]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;
            
            e.preventDefault();
            switchTab(targetTab);

            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.getAttribute('data-tab') === tabId) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-page').forEach(page => {
        if (page.id === `tab-${tabId}`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    const titleMap = {
        'dashboard': 'Dashboard',
        'mark-attendance': 'Mark Attendance',
        'subjects': 'Subject Management',
        'calendar': 'Calendar View',
        'holidays': 'College Holidays',
        'history': 'Attendance History Log',
        'reports': 'Analytics & Reports',
        'settings': 'Settings & Backup'
    };
    const subtitleMap = {
        'dashboard': 'Overview of your academic attendance performance',
        'mark-attendance': 'Record your daily subject presence or absence',
        'subjects': 'Manage your subjects, faculty details, and target stats',
        'calendar': 'Monthly calendar view of your class history & holidays',
        'holidays': 'Manage official college holidays, festivals, and breaks',
        'history': 'Complete filterable logs of all recorded classes',
        'reports': 'Visual charts, monthly breakdowns, and CSV export',
        'settings': 'Configure target threshold and manage data backups'
    };

    document.getElementById('pageTitle').textContent = titleMap[tabId] || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = subtitleMap[tabId] || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'reports') {
        renderCharts();
    }
}

/**
 * Binds DOM event handlers for forms, modals, buttons
 */
function setupEventListeners() {
    // Auth Tab Switchers (Sign In vs Register)
    document.getElementById('tabSignInBtn').addEventListener('click', () => switchAuthTab('signin'));
    document.getElementById('tabRegisterBtn').addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('linkToRegister').addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
    document.getElementById('linkToSignIn').addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('signin'); });

    // User Authentication Sign In & Register Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('demoLoginBtn').addEventListener('click', handleDemoLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Mobile Sidebar Toggles
    document.getElementById('openSidebarBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('mobile-open');
    });
    document.getElementById('closeSidebarBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('mobile-open');
    });

    // Quick Mark Attendance Buttons
    document.getElementById('quickPresentBtn').addEventListener('click', () => handleMarkAttendance('quick', 'present'));
    document.getElementById('quickAbsentBtn').addEventListener('click', () => handleMarkAttendance('quick', 'absent'));

    // Dedicated Mark Attendance Buttons
    document.getElementById('markPresentBtn').addEventListener('click', () => handleMarkAttendance('main', 'present'));
    document.getElementById('markAbsentBtn').addEventListener('click', () => handleMarkAttendance('main', 'absent'));

    // Subject Modal Trigger
    document.getElementById('openAddSubjectModalBtn').addEventListener('click', () => openSubjectModal());
    document.getElementById('closeSubjectModalBtn').addEventListener('click', () => closeSubjectModal());
    document.getElementById('cancelSubjectModalBtn').addEventListener('click', () => closeSubjectModal());
    document.getElementById('subjectForm').addEventListener('submit', handleSaveSubject);

    // Holiday Modal Trigger
    document.getElementById('openAddHolidayModalBtn').addEventListener('click', () => openHolidayModal());
    document.getElementById('closeHolidayModalBtn').addEventListener('click', () => closeHolidayModal());
    document.getElementById('cancelHolidayModalBtn').addEventListener('click', () => closeHolidayModal());
    document.getElementById('holidayForm').addEventListener('submit', handleSaveHoliday);

    // Edit Attendance Record Modal
    document.getElementById('closeEditAttendanceModalBtn').addEventListener('click', () => closeEditAttendanceModal());
    document.getElementById('cancelEditAttendanceBtn').addEventListener('click', () => closeEditAttendanceModal());
    document.getElementById('editAttendanceForm').addEventListener('submit', handleSaveEditAttendance);

    // Day Details Modal (from Calendar click)
    document.getElementById('closeDayDetailsModalBtn').addEventListener('click', () => closeDayDetailsModal());
    document.getElementById('closeDayDetailsModalBtn2').addEventListener('click', () => closeDayDetailsModal());

    // Calendar Month Navigation
    document.getElementById('calPrevMonthBtn').addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('calNextMonthBtn').addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });
    document.getElementById('calTodayBtn').addEventListener('click', () => {
        calendarCurrentDate = new Date();
        renderCalendar();
    });

    // History Table Filters
    document.getElementById('historyFilterSubject').addEventListener('change', renderHistoryTable);
    document.getElementById('historyFilterMonth').addEventListener('change', renderHistoryTable);
    document.getElementById('historyFilterStatus').addEventListener('change', renderHistoryTable);
    document.getElementById('resetHistoryFiltersBtn').addEventListener('click', () => {
        document.getElementById('historyFilterSubject').value = '';
        document.getElementById('historyFilterMonth').value = '';
        document.getElementById('historyFilterStatus').value = '';
        renderHistoryTable();
    });

    // Report Month Selector
    document.getElementById('reportMonthSelect').addEventListener('change', (e) => {
        renderMonthlyReport(e.target.value);
    });

    // Export CSV & Print Report Buttons
    document.getElementById('exportCsvBtn').addEventListener('click', exportAttendanceCSV);
    document.getElementById('printReportBtn').addEventListener('click', () => window.print());

    // Settings Form
    document.getElementById('settingsTargetForm').addEventListener('submit', handleSaveSettings);

    // Backup & Restore Buttons
    document.getElementById('exportBackupBtn').addEventListener('click', exportBackupJSON);
    document.getElementById('importBackupInput').addEventListener('change', importBackupJSON);

    // Sample Data & Reset
    document.getElementById('loadSampleDataBtn').addEventListener('click', loadSampleData);
    document.getElementById('clearAllDataBtn').addEventListener('click', clearAllData);
    
    // Banner Action Shortcut
    document.getElementById('bannerActionBtn').addEventListener('click', () => switchTab('settings'));
}

/**
 * Pre-fills date inputs with today's date (YYYY-MM-DD)
 */
function setDefaultFormDates() {
    const today = new Date();
    const formattedToday = formatDateForInput(today);
    
    const quickDate = document.getElementById('quickDate');
    const markDate = document.getElementById('markDate');
    const reportMonthSelect = document.getElementById('reportMonthSelect');
    const holidayDateInput = document.getElementById('holidayDateInput');
    
    if (quickDate) quickDate.value = formattedToday;
    if (markDate) markDate.value = formattedToday;
    if (holidayDateInput) holidayDateInput.value = formattedToday;
    
    const yearMonth = formattedToday.substring(0, 7);
    if (reportMonthSelect) reportMonthSelect.value = yearMonth;

    const headerDateText = document.getElementById('headerDateText');
    if (headerDateText) {
        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        headerDateText.textContent = today.toLocaleDateString('en-US', options);
    }
}


// ----------------------------------------------------------------------------
// 3. USER AUTHENTICATION (SIGN IN & REGISTER) LOGIC
// ----------------------------------------------------------------------------

function switchAuthTab(tab) {
    const tabSignInBtn = document.getElementById('tabSignInBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authFormTitle');
    const subtitle = document.getElementById('authFormSubtitle');

    if (tab === 'register') {
        tabSignInBtn.classList.remove('active');
        tabRegisterBtn.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        title.textContent = 'Create New Account';
        subtitle.textContent = 'Register your student profile to start tracking attendance.';
    } else {
        tabRegisterBtn.classList.remove('active');
        tabSignInBtn.classList.add('active');
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
        title.textContent = 'Student Sign In';
        subtitle.textContent = 'Access your saved attendance tracker and subject stats.';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const input = document.getElementById('loginNameInput').value.trim();
    const pin = document.getElementById('loginPinInput').value.trim();

    if (!input) {
        showToast('Please enter your name or email', 'warning');
        return;
    }

    // Check registered accounts list
    const existingUser = registeredUsers.find(u => 
        u.email.toLowerCase() === input.toLowerCase() || 
        u.name.toLowerCase() === input.toLowerCase()
    );

    if (existingUser) {
        if (existingUser.pin && existingUser.pin !== pin) {
            showToast('Incorrect PIN / Password', 'danger');
            return;
        }
        appState.user = {
            isLoggedIn: true,
            name: existingUser.name,
            email: existingUser.email,
            roll: existingUser.roll || '',
            branch: existingUser.branch || 'Diploma CSE',
            pin: existingUser.pin || ''
        };
        appState.settings.studentName = existingUser.name;
        appState.settings.studentBranch = existingUser.branch || 'Diploma CSE';
        if (existingUser.targetPct) {
            appState.settings.targetPercentage = existingUser.targetPct;
        }
    } else {
        // Quick Sign in with entered name
        appState.user = {
            isLoggedIn: true,
            name: input,
            email: input.includes('@') ? input : '',
            roll: '',
            branch: 'Diploma CSE',
            pin: pin
        };
        appState.settings.studentName = input;
    }

    saveStateToStorage();
    checkAuthStatus();
    showToast(`Welcome back, ${appState.user.name}!`, 'success');
    renderAllViews();
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regNameInput').value.trim();
    const email = document.getElementById('regEmailInput').value.trim();
    const roll = document.getElementById('regRollInput').value.trim();
    const branch = document.getElementById('regBranchInput').value.trim();
    const pin = document.getElementById('regPinInput').value.trim();
    const target = parseFloat(document.getElementById('regTargetInput').value) || 75;

    if (!name || !email || !pin) {
        showToast('Name, Email, and 4-digit PIN are required', 'warning');
        return;
    }

    // Check if account already exists
    const duplicate = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicate) {
        showToast('An account with this email already exists! Please Sign In.', 'warning');
        switchAuthTab('signin');
        document.getElementById('loginNameInput').value = email;
        return;
    }

    const newUser = {
        id: 'usr-' + Date.now(),
        name,
        email,
        roll: roll || 'CSE-2026',
        branch: branch || 'Diploma CSE',
        pin,
        targetPct: target
    };

    registeredUsers.push(newUser);
    saveRegisteredUsers();

    // Log the newly registered user in
    appState.user = {
        isLoggedIn: true,
        name,
        email,
        roll: newUser.roll,
        branch: newUser.branch,
        pin
    };
    appState.settings.studentName = name;
    appState.settings.studentBranch = newUser.branch;
    appState.settings.targetPercentage = target;

    saveStateToStorage();
    checkAuthStatus();
    showToast(`Account registered successfully! Welcome ${name}`, 'success');
    renderAllViews();
}

function handleDemoLogin() {
    appState.user = {
        isLoggedIn: true,
        name: 'Rahul Sharma',
        email: 'rahul@college.edu',
        roll: 'CSE-2026-042',
        branch: 'Diploma CSE',
        pin: '1234'
    };
    appState.settings.studentName = 'Rahul Sharma';
    appState.settings.studentBranch = 'Diploma CSE';

    saveStateToStorage();
    checkAuthStatus();
    showToast('Signed in as Guest Student (Rahul Sharma)', 'success');
    renderAllViews();
}

function handleLogout() {
    if (confirm('Are you sure you want to log out of your session?')) {
        appState.user.isLoggedIn = false;
        saveStateToStorage();
        checkAuthStatus();
        showToast('Logged out successfully', 'info');
    }
}


// ----------------------------------------------------------------------------
// 4. STATISTICAL CALCULATIONS & GOAL ANALYSIS MATH
// ----------------------------------------------------------------------------

function getSubjectStats(subjectId) {
    const records = appState.attendance.filter(a => a.subjectId === subjectId);
    const total = records.length;
    const attended = records.filter(a => a.status === 'present').length;
    const absent = records.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? ((attended / total) * 100) : 0;
    
    let statusText = 'No Data';
    let badgeClass = 'badge-neutral';
    
    if (total > 0) {
        if (percentage >= 75) {
            statusText = 'Safe';
            badgeClass = 'badge-safe';
        } else if (percentage >= 65) {
            statusText = 'Warning';
            badgeClass = 'badge-warning';
        } else {
            statusText = 'Low Attendance';
            badgeClass = 'badge-danger';
        }
    }

    return { total, attended, absent, percentage, statusText, badgeClass };
}

function getOverallStats() {
    const total = appState.attendance.length;
    const attended = appState.attendance.filter(a => a.status === 'present').length;
    const absent = appState.attendance.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? ((attended / total) * 100) : 0;
    
    let statusText = 'No Data';
    let badgeClass = 'badge-neutral';
    
    if (total > 0) {
        if (percentage >= 75) {
            statusText = 'Safe';
            badgeClass = 'badge-safe';
        } else if (percentage >= 65) {
            statusText = 'Warning';
            badgeClass = 'badge-warning';
        } else {
            statusText = 'Low Attendance';
            badgeClass = 'badge-danger';
        }
    }

    return { total, attended, absent, percentage, statusText, badgeClass };
}

function analyzeGoal(attended, total, targetPct) {
    if (total === 0) {
        return {
            type: 'info',
            message: 'No classes recorded yet. Mark daily attendance to see target goal analysis.'
        };
    }

    const currentPct = (attended / total) * 100;
    const targetFrac = targetPct / 100;

    if (currentPct < targetPct) {
        const required = Math.ceil((targetFrac * total - attended) / (1 - targetFrac));
        return {
            type: 'warning',
            requiredClasses: required,
            message: `Your current attendance is <strong>${currentPct.toFixed(1)}%</strong>, which is below your target of <strong>${targetPct}%</strong>. You need to attend the next <strong>${required}</strong> consecutive classes to reach your target!`
        };
    } else {
        const safeToMiss = Math.floor((attended - targetFrac * total) / targetFrac);
        return {
            type: 'safe',
            safeToMissClasses: safeToMiss,
            message: `Awesome! Your attendance is <strong>${currentPct.toFixed(1)}%</strong>, exceeding your target of <strong>${targetPct}%</strong>. You can safely miss up to <strong>${safeToMiss}</strong> upcoming classes without falling below ${targetPct}%.`
        };
    }
}


// ----------------------------------------------------------------------------
// 5. MAIN UI RENDERING FUNCTIONS
// ----------------------------------------------------------------------------

function renderAllViews() {
    updateUserProfileDisplay();
    renderDashboard();
    renderSubjectDropdowns();
    renderSubjectsView();
    renderRecentAttendanceTable();
    renderCalendar();
    renderHolidaysView();
    renderHistoryTable();
    renderMonthlyReport(document.getElementById('reportMonthSelect').value);
    renderSettingsView();
}

function renderDashboard() {
    const overall = getOverallStats();
    const targetPct = appState.settings.targetPercentage || 75;

    document.getElementById('totalSubjectsVal').textContent = appState.subjects.length;
    document.getElementById('totalClassesVal').textContent = overall.total;
    document.getElementById('attendedClassesVal').textContent = overall.attended;
    document.getElementById('missedClassesVal').textContent = overall.absent;
    document.getElementById('overallPercentage').textContent = `${overall.percentage.toFixed(1)}%`;
    document.getElementById('targetPercentageDisplay').textContent = `${targetPct}%`;

    const overallBadge = document.getElementById('overallBadge');
    overallBadge.textContent = overall.statusText;
    overallBadge.className = `badge ${overall.badgeClass}`;

    const targetDiffText = document.getElementById('targetDiffText');
    if (overall.total === 0) {
        targetDiffText.textContent = 'No Data';
        targetDiffText.className = 'target-diff text-muted';
    } else if (overall.percentage >= targetPct) {
        targetDiffText.textContent = `+${(overall.percentage - targetPct).toFixed(1)}% Above Goal`;
        targetDiffText.className = 'target-diff text-success';
    } else {
        targetDiffText.textContent = `-${(targetPct - overall.percentage).toFixed(1)}% Below Goal`;
        targetDiffText.className = 'target-diff text-danger';
    }

    const circle = document.getElementById('overallProgressRing');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (overall.percentage / 100) * circumference;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    if (overall.percentage >= 75) {
        circle.style.stroke = 'var(--success)';
    } else if (overall.percentage >= 65) {
        circle.style.stroke = 'var(--warning)';
    } else {
        circle.style.stroke = 'var(--danger)';
    }

    const currentYearMonth = formatDateForInput(new Date()).substring(0, 7);
    const monthlyRecords = appState.attendance.filter(a => a.date.startsWith(currentYearMonth));
    const mTotal = monthlyRecords.length;
    const mAttended = monthlyRecords.filter(a => a.status === 'present').length;
    const mPct = mTotal > 0 ? (mAttended / mTotal) * 100 : 0;
    document.getElementById('currentMonthPctVal').textContent = `${mPct.toFixed(1)}%`;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    document.getElementById('currentMonthNameLabel').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    renderGoalWarningBanner(overall, targetPct);
    renderGoalAnalysisBox(overall, targetPct);
    renderDashboardSubjectsGrid();
}

function renderGoalWarningBanner(overall, targetPct) {
    const banner = document.getElementById('goalWarningBanner');
    const icon = document.getElementById('bannerIcon');
    const title = document.getElementById('bannerTitle');
    const message = document.getElementById('bannerMessage');

    if (overall.total === 0) {
        banner.className = 'status-banner banner-safe';
        icon.innerHTML = '<i class="fa-solid fa-circle-info text-primary"></i>';
        title.textContent = `Welcome ${appState.user.name || 'Student'}!`;
        message.textContent = 'Start by adding your subjects and marking daily class attendance.';
        return;
    }

    if (overall.percentage >= targetPct) {
        banner.className = 'status-banner banner-safe';
        icon.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
        title.textContent = 'Attendance Status: Safe & Excellent!';
        message.textContent = `Your overall attendance is ${overall.percentage.toFixed(1)}%, which satisfies your ${targetPct}% requirement. Keep up the good work!`;
    } else if (overall.percentage >= 65) {
        banner.className = 'status-banner banner-warning';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-warning"></i>';
        title.textContent = 'Attendance Warning: Approaching Threshold';
        message.textContent = `Your attendance is ${overall.percentage.toFixed(1)}%. You are close to falling below 75%. Attend upcoming classes carefully!`;
    } else {
        banner.className = 'status-banner banner-danger';
        icon.innerHTML = '<i class="fa-solid fa-circle-exclamation text-danger"></i>';
        title.textContent = 'Low Attendance Warning!';
        message.textContent = `Your attendance is below 75% (${overall.percentage.toFixed(1)}%). You need to attend more classes to avoid exam shortage!`;
    }
}

function renderGoalAnalysisBox(overall, targetPct) {
    document.getElementById('goalCurrentStatus').textContent = `${overall.percentage.toFixed(1)}%`;
    document.getElementById('goalTargetVal').textContent = `${targetPct}%`;

    const analysis = analyzeGoal(overall.attended, overall.total, targetPct);
    const adviceText = document.getElementById('goalAdviceText');
    adviceText.innerHTML = analysis.message;
}

function renderDashboardSubjectsGrid() {
    const grid = document.getElementById('dashboardSubjectsGrid');
    grid.innerHTML = '';

    if (appState.subjects.length === 0) {
        grid.innerHTML = `
            <div class="card p-6 text-center text-muted" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-book-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>No subjects added yet. Click "Manage Subjects" to add your courses!</p>
            </div>
        `;
        return;
    }

    appState.subjects.forEach(subject => {
        const stats = getSubjectStats(subject.id);
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.setProperty('--subject-accent', subject.color || 'var(--primary)');

        card.innerHTML = `
            <div class="subject-card-header">
                <div class="subject-info-title">
                    <span class="subject-code">${escapeHtml(subject.code)}</span>
                    <h3 class="subject-name">${escapeHtml(subject.name)}</h3>
                    ${subject.faculty ? `<span class="faculty-name"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(subject.faculty)}</span>` : ''}
                </div>
                <span class="badge ${stats.badgeClass}">${stats.statusText}</span>
            </div>
            
            <div class="subject-card-body">
                <div class="subject-progress-header">
                    <span>Attendance</span>
                    <strong>${stats.percentage.toFixed(1)}%</strong>
                </div>
                <div class="subject-progress-bar">
                    <div class="subject-progress-fill" style="width: ${stats.percentage}%;"></div>
                </div>
            </div>

            <div class="subject-stats-row">
                <div class="subject-stat">
                    <span class="label">Total</span>
                    <span class="num">${stats.total}</span>
                </div>
                <div class="subject-stat">
                    <span class="label text-success">Attended</span>
                    <span class="num text-success">${stats.attended}</span>
                </div>
                <div class="subject-stat">
                    <span class="label text-danger">Absent</span>
                    <span class="num text-danger">${stats.absent}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderSubjectDropdowns() {
    const quickSubject = document.getElementById('quickSubject');
    const markSubjectSelect = document.getElementById('markSubjectSelect');
    const historyFilterSubject = document.getElementById('historyFilterSubject');
    const editAttSubject = document.getElementById('editAttSubject');

    const optionsHtml = appState.subjects.length === 0 
        ? '<option value="">-- No Subjects Created --</option>'
        : '<option value="">-- Select Subject --</option>' + 
          appState.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.code)} - ${escapeHtml(s.name)}</option>`).join('');

    if (quickSubject) quickSubject.innerHTML = optionsHtml;
    if (markSubjectSelect) markSubjectSelect.innerHTML = optionsHtml;
    if (editAttSubject) editAttSubject.innerHTML = optionsHtml;

    if (historyFilterSubject) {
        historyFilterSubject.innerHTML = '<option value="">All Subjects</option>' +
            appState.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.code)} - ${escapeHtml(s.name)}</option>`).join('');
    }
}

function renderSubjectsView() {
    const container = document.getElementById('subjectsContainer');
    const tableBody = document.getElementById('subjectSummaryTableBody');
    
    container.innerHTML = '';
    tableBody.innerHTML = '';

    if (appState.subjects.length === 0) {
        container.innerHTML = `
            <div class="card p-6 text-center text-muted" style="grid-column: 1 / -1;">
                <p>No subjects added yet. Click "+ Add New Subject" above!</p>
            </div>
        `;
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted p-4">No subject data found</td></tr>`;
        return;
    }

    appState.subjects.forEach(subject => {
        const stats = getSubjectStats(subject.id);

        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.setProperty('--subject-accent', subject.color || 'var(--primary)');
        card.innerHTML = `
            <div class="subject-card-header">
                <div class="subject-info-title">
                    <span class="subject-code">${escapeHtml(subject.code)}</span>
                    <h3 class="subject-name">${escapeHtml(subject.name)}</h3>
                    ${subject.faculty ? `<span class="faculty-name"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(subject.faculty)}</span>` : ''}
                </div>
                <div class="dropdown-actions">
                    <button class="icon-btn" onclick="openSubjectModal('${subject.id}')" title="Edit Subject">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="icon-btn text-danger" onclick="confirmDeleteSubject('${subject.id}')" title="Delete Subject">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            
            <div class="subject-card-body">
                <div class="subject-progress-header">
                    <span>Attendance</span>
                    <strong>${stats.percentage.toFixed(1)}%</strong>
                </div>
                <div class="subject-progress-bar">
                    <div class="subject-progress-fill" style="width: ${stats.percentage}%;"></div>
                </div>
            </div>

            <div class="subject-stats-row">
                <div class="subject-stat">
                    <span class="label">Total</span>
                    <span class="num">${stats.total}</span>
                </div>
                <div class="subject-stat">
                    <span class="label text-success">Attended</span>
                    <span class="num text-success">${stats.attended}</span>
                </div>
                <div class="subject-stat">
                    <span class="label text-danger">Absent</span>
                    <span class="num text-danger">${stats.absent}</span>
                </div>
            </div>
        `;
        container.appendChild(card);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(subject.code)}</strong></td>
            <td>${escapeHtml(subject.name)}</td>
            <td>${subject.faculty ? escapeHtml(subject.faculty) : '<span class="text-muted">N/A</span>'}</td>
            <td>${stats.total}</td>
            <td class="text-success font-bold">${stats.attended}</td>
            <td class="text-danger font-bold">${stats.absent}</td>
            <td><strong>${stats.percentage.toFixed(2)}%</strong></td>
            <td><span class="badge ${stats.badgeClass}">${stats.statusText}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openSubjectModal('${subject.id}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteSubject('${subject.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderRecentAttendanceTable() {
    const tableBody = document.getElementById('recentAttendanceBody');
    tableBody.innerHTML = '';

    const recent = [...appState.attendance]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    if (recent.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-4">No recent attendance marked</td></tr>`;
        return;
    }

    recent.forEach(record => {
        const subject = appState.subjects.find(s => s.id === record.subjectId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDisplayDate(record.date)}</td>
            <td>${subject ? `${escapeHtml(subject.code)} - ${escapeHtml(subject.name)}` : 'Unknown Subject'}</td>
            <td>
                <span class="badge ${record.status === 'present' ? 'badge-safe' : 'badge-danger'}">
                    ${record.status === 'present' ? '✅ Present' : '❌ Absent'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openEditAttendanceModal('${record.id}')">Edit</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendarMonthTitle').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendarDaysGrid');
    grid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayStr = formatDateForInput(new Date());

    for (let x = firstDayIndex; x > 0; x--) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell other-month';
        dayCell.innerHTML = `<span class="day-number">${prevMonthDays - x + 1}</span>`;
        grid.appendChild(dayCell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateFormatted = `${year}-${monthStr}-${dayStr}`;

        if (dateFormatted === todayStr) {
            dayCell.classList.add('today-cell');
        }

        const holiday = appState.holidays.find(h => h.date === dateFormatted);
        if (holiday) {
            dayCell.classList.add('holiday-cell');
        }

        const dayRecords = appState.attendance.filter(a => a.date === dateFormatted);
        const presentCount = dayRecords.filter(a => a.status === 'present').length;
        const absentCount = dayRecords.filter(a => a.status === 'absent').length;

        let pillsHtml = '';
        if (holiday) {
            pillsHtml += `<span class="day-pill pill-holiday" title="${escapeHtml(holiday.name)}">🎉 ${escapeHtml(holiday.name.substring(0, 10))}...</span>`;
        }
        if (presentCount > 0) {
            pillsHtml += `<span class="day-pill pill-present"><span>Present</span> <strong>${presentCount}</strong></span>`;
        }
        if (absentCount > 0) {
            pillsHtml += `<span class="day-pill pill-absent"><span>Absent</span> <strong>${absentCount}</strong></span>`;
        }

        dayCell.innerHTML = `
            <span class="day-number">${day}</span>
            <div class="day-status-pills">${pillsHtml}</div>
        `;

        dayCell.addEventListener('click', () => {
            openDayDetailsModal(dateFormatted);
        });

        grid.appendChild(dayCell);
    }

    const totalGridCells = firstDayIndex + totalDaysInMonth;
    const nextDays = (7 - (totalGridCells % 7)) % 7;
    for (let j = 1; j <= nextDays; j++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell other-month';
        dayCell.innerHTML = `<span class="day-number">${j}</span>`;
        grid.appendChild(dayCell);
    }
}

function renderHolidaysView() {
    const tableBody = document.getElementById('holidaysTableBody');
    const totalVal = document.getElementById('totalHolidaysVal');
    const upcomingVal = document.getElementById('upcomingHolidaysVal');

    tableBody.innerHTML = '';
    
    const todayStr = formatDateForInput(new Date());
    const total = appState.holidays.length;
    const upcoming = appState.holidays.filter(h => h.date >= todayStr).length;

    totalVal.textContent = total;
    upcomingVal.textContent = upcoming;

    if (total === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-4">No holidays added yet. Click "+ Add Holiday" to record official breaks.</td></tr>`;
        return;
    }

    const sortedHolidays = [...appState.holidays].sort((a, b) => a.date.localeCompare(b.date));

    sortedHolidays.forEach(holiday => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${formatDisplayDate(holiday.date)}</strong></td>
            <td>${escapeHtml(holiday.name)}</td>
            <td><span class="badge badge-warning">${escapeHtml(holiday.type || 'Holiday')}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openHolidayModal('${holiday.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteHoliday('${holiday.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    const countText = document.getElementById('historyCountText');
    
    const filterSubject = document.getElementById('historyFilterSubject').value;
    const filterMonth = document.getElementById('historyFilterMonth').value;
    const filterStatus = document.getElementById('historyFilterStatus').value;

    let filtered = [...appState.attendance];

    if (filterSubject) {
        filtered = filtered.filter(a => a.subjectId === filterSubject);
    }
    if (filterMonth) {
        filtered = filtered.filter(a => a.date.startsWith(filterMonth));
    }
    if (filterStatus) {
        filtered = filtered.filter(a => a.status === filterStatus);
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date));

    tableBody.innerHTML = '';
    countText.textContent = `Showing ${filtered.length} record(s)`;

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">No matching attendance records found.</td></tr>`;
        return;
    }

    filtered.forEach(record => {
        const subject = appState.subjects.find(s => s.id === record.subjectId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${formatDisplayDate(record.date)}</strong></td>
            <td>${subject ? escapeHtml(subject.code) : 'N/A'}</td>
            <td>${subject ? escapeHtml(subject.name) : 'Unknown Subject'}</td>
            <td>
                <span class="badge ${record.status === 'present' ? 'badge-safe' : 'badge-danger'}">
                    ${record.status === 'present' ? '✅ Present' : '❌ Absent'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openEditAttendanceModal('${record.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteAttendance('${record.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderMonthlyReport(yearMonthStr) {
    if (!yearMonthStr) return;

    const [yearStr, monthStr] = yearMonthStr.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('monthlyReportTitle').textContent = `${monthNames[monthIndex]} ${year} Summary Report`;

    const monthlyRecords = appState.attendance.filter(a => a.date.startsWith(yearMonthStr));
    const total = monthlyRecords.length;
    const attended = monthlyRecords.filter(a => a.status === 'present').length;
    const absent = monthlyRecords.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? ((attended / total) * 100) : 0;

    document.getElementById('monthlyTotalClasses').textContent = total;
    document.getElementById('monthlyAttended').textContent = attended;
    document.getElementById('monthlyAbsent').textContent = absent;
    document.getElementById('monthlyPercentage').textContent = `${percentage.toFixed(1)}%`;
}

function renderCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f9fafb' : '#111827';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const barCtx = document.getElementById('subjectBarChart');
    if (barCtx) {
        if (chartInstances.subjectBar) chartInstances.subjectBar.destroy();

        const labels = appState.subjects.map(s => s.code);
        const percentages = appState.subjects.map(s => getSubjectStats(s.id).percentage);
        const colors = appState.subjects.map(s => s.color || '#6366f1');

        chartInstances.subjectBar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['No Subjects'],
                datasets: [{
                    label: 'Attendance %',
                    data: percentages.length > 0 ? percentages : [0],
                    backgroundColor: colors.length > 0 ? colors : ['#6366f1'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    const doughnutCtx = document.getElementById('ratioDoughnutChart');
    if (doughnutCtx) {
        if (chartInstances.ratioDoughnut) chartInstances.ratioDoughnut.destroy();

        const overall = getOverallStats();

        chartInstances.ratioDoughnut = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: overall.total > 0 ? [overall.attended, overall.absent] : [1, 0],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });
    }
}

function renderSettingsView() {
    document.getElementById('studentNameInput').value = appState.user.name || appState.settings.studentName || 'College Student';
    document.getElementById('studentBranchInput').value = appState.user.branch || appState.settings.studentBranch || 'Diploma CSE';
    document.getElementById('targetPercentageInput').value = appState.settings.targetPercentage || 75;
}


// ----------------------------------------------------------------------------
// 7. HOLIDAYS MODALS & HANDLERS
// ----------------------------------------------------------------------------

function openHolidayModal(holidayId = null) {
    const modal = document.getElementById('holidayModal');
    const form = document.getElementById('holidayForm');
    form.reset();

    if (holidayId) {
        const holiday = appState.holidays.find(h => h.id === holidayId);
        if (holiday) {
            document.getElementById('holidayModalTitle').textContent = 'Edit Holiday';
            document.getElementById('editHolidayId').value = holiday.id;
            document.getElementById('holidayDateInput').value = holiday.date;
            document.getElementById('holidayNameInput').value = holiday.name;
            document.getElementById('holidayTypeSelect').value = holiday.type || 'National Holiday';
        }
    } else {
        document.getElementById('holidayModalTitle').textContent = 'Add Holiday';
        document.getElementById('editHolidayId').value = '';
        document.getElementById('holidayDateInput').value = formatDateForInput(new Date());
    }

    modal.classList.add('active');
}

function closeHolidayModal() {
    document.getElementById('holidayModal').classList.remove('active');
}

function handleSaveHoliday(e) {
    e.preventDefault();
    const id = document.getElementById('editHolidayId').value;
    const date = document.getElementById('holidayDateInput').value;
    const name = document.getElementById('holidayNameInput').value.trim();
    const type = document.getElementById('holidayTypeSelect').value;

    if (!date || !name) {
        showToast('Please enter both date and holiday name', 'warning');
        return;
    }

    if (id) {
        const holiday = appState.holidays.find(h => h.id === id);
        if (holiday) {
            holiday.date = date;
            holiday.name = name;
            holiday.type = type;
            showToast('Holiday updated', 'success');
        }
    } else {
        const newHoliday = {
            id: 'hol-' + Date.now(),
            date,
            name,
            type
        };
        appState.holidays.push(newHoliday);
        showToast('Holiday added!', 'success');
    }

    saveStateToStorage();
    closeHolidayModal();
    renderAllViews();
}

function confirmDeleteHoliday(holidayId) {
    if (confirm('Delete this holiday record?')) {
        appState.holidays = appState.holidays.filter(h => h.id !== holidayId);
        saveStateToStorage();
        showToast('Holiday deleted', 'info');
        renderAllViews();
    }
}


// ----------------------------------------------------------------------------
// 8. SUBJECTS & ATTENDANCE ACTIONS
// ----------------------------------------------------------------------------

function handleMarkAttendance(formType, status) {
    let dateInput, subjectInput;
    
    if (formType === 'quick') {
        dateInput = document.getElementById('quickDate').value;
        subjectInput = document.getElementById('quickSubject').value;
    } else {
        dateInput = document.getElementById('markDate').value;
        subjectInput = document.getElementById('markSubjectSelect').value;
    }

    if (!dateInput || !subjectInput) {
        showToast('Please select both a valid date and a subject', 'warning');
        return;
    }

    const existingIndex = appState.attendance.findIndex(a => a.date === dateInput && a.subjectId === subjectInput);
    
    if (existingIndex !== -1) {
        appState.attendance[existingIndex].status = status;
        showToast('Updated attendance record for selected date', 'info');
    } else {
        const newRecord = {
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            date: dateInput,
            subjectId: subjectInput,
            status: status
        };
        appState.attendance.push(newRecord);
        showToast(`Attendance marked as ${status.toUpperCase()}!`, 'success');
    }

    saveStateToStorage();
    renderAllViews();
}

function openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    form.reset();

    if (subjectId) {
        const subject = appState.subjects.find(s => s.id === subjectId);
        if (subject) {
            document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
            document.getElementById('editSubjectId').value = subject.id;
            document.getElementById('subjectNameInput').value = subject.name;
            document.getElementById('subjectCodeInput').value = subject.code;
            document.getElementById('facultyNameInput').value = subject.faculty || '';
            document.getElementById('subjectColorInput').value = subject.color || '#4f46e5';
        }
    } else {
        document.getElementById('subjectModalTitle').textContent = 'Add New Subject';
        document.getElementById('editSubjectId').value = '';
    }

    modal.classList.add('active');
}

function closeSubjectModal() {
    document.getElementById('subjectModal').classList.remove('active');
}

function handleSaveSubject(e) {
    e.preventDefault();
    const id = document.getElementById('editSubjectId').value;
    const name = document.getElementById('subjectNameInput').value.trim();
    const code = document.getElementById('subjectCodeInput').value.trim();
    const faculty = document.getElementById('facultyNameInput').value.trim();
    const color = document.getElementById('subjectColorInput').value;

    if (!name || !code) {
        showToast('Subject Name and Code are required', 'warning');
        return;
    }

    if (id) {
        const subject = appState.subjects.find(s => s.id === id);
        if (subject) {
            subject.name = name;
            subject.code = code;
            subject.faculty = faculty;
            subject.color = color;
            showToast('Subject updated successfully', 'success');
        }
    } else {
        const newSubject = {
            id: 'sub-' + Date.now(),
            name,
            code,
            faculty,
            color
        };
        appState.subjects.push(newSubject);
        showToast('New subject added!', 'success');
    }

    saveStateToStorage();
    closeSubjectModal();
    renderAllViews();
}

function confirmDeleteSubject(subjectId) {
    const subject = appState.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    if (confirm(`Are you sure you want to delete "${subject.name}"? This will also remove all its attendance records!`)) {
        appState.subjects = appState.subjects.filter(s => s.id !== subjectId);
        appState.attendance = appState.attendance.filter(a => a.subjectId !== subjectId);
        
        saveStateToStorage();
        showToast('Subject deleted', 'info');
        renderAllViews();
    }
}

function openEditAttendanceModal(recordId) {
    const record = appState.attendance.find(a => a.id === recordId);
    if (!record) return;

    document.getElementById('editAttendanceId').value = record.id;
    document.getElementById('editAttDate').value = record.date;
    document.getElementById('editAttSubject').value = record.subjectId;
    document.getElementById('editAttStatus').value = record.status;

    document.getElementById('editAttendanceModal').classList.add('active');
}

function closeEditAttendanceModal() {
    document.getElementById('editAttendanceModal').classList.remove('active');
}

function handleSaveEditAttendance(e) {
    e.preventDefault();
    const id = document.getElementById('editAttendanceId').value;
    const record = appState.attendance.find(a => a.id === id);

    if (record) {
        record.date = document.getElementById('editAttDate').value;
        record.subjectId = document.getElementById('editAttSubject').value;
        record.status = document.getElementById('editAttStatus').value;

        saveStateToStorage();
        showToast('Attendance record updated', 'success');
        closeEditAttendanceModal();
        renderAllViews();
    }
}

function confirmDeleteAttendance(recordId) {
    if (confirm('Delete this attendance record?')) {
        appState.attendance = appState.attendance.filter(a => a.id !== recordId);
        saveStateToStorage();
        showToast('Record deleted', 'info');
        renderAllViews();
    }
}

function openDayDetailsModal(dateStr) {
    document.getElementById('dayModalTitle').textContent = `Attendance for ${formatDisplayDate(dateStr)}`;
    const list = document.getElementById('dayRecordsList');
    const alertBox = document.getElementById('dayHolidayAlert');
    list.innerHTML = '';
    alertBox.innerHTML = '';

    const holiday = appState.holidays.find(h => h.date === dateStr);
    if (holiday) {
        alertBox.innerHTML = `
            <div class="status-banner banner-warning p-3">
                <i class="fa-solid fa-umbrella-beach text-warning"></i>
                <div>
                    <strong>🎉 ${escapeHtml(holiday.name)}</strong> (${escapeHtml(holiday.type || 'Holiday')})
                    <p class="text-xs text-muted mb-0">This date is declared as an official college holiday.</p>
                </div>
            </div>
        `;
    }

    const records = appState.attendance.filter(a => a.date === dateStr);

    if (records.length === 0) {
        list.innerHTML = `<p class="text-muted text-center p-4">No class attendance recorded on this day.</p>`;
    } else {
        records.forEach(rec => {
            const subject = appState.subjects.find(s => s.id === rec.subjectId);
            const item = document.createElement('div');
            item.className = 'day-record-item';
            item.innerHTML = `
                <div>
                    <strong>${subject ? escapeHtml(subject.code) : 'N/A'}</strong> - ${subject ? escapeHtml(subject.name) : 'Unknown'}
                </div>
                <div class="flex-align gap-2">
                    <span class="badge ${rec.status === 'present' ? 'badge-safe' : 'badge-danger'}">
                        ${rec.status === 'present' ? '✅ Present' : '❌ Absent'}
                    </span>
                    <button class="icon-btn text-danger" onclick="confirmDeleteAttendance('${rec.id}'); openDayDetailsModal('${dateStr}');" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    const addBtn = document.getElementById('dayAddEntryBtn');
    addBtn.onclick = () => {
        closeDayDetailsModal();
        switchTab('mark-attendance');
        document.getElementById('markDate').value = dateStr;
    };

    document.getElementById('dayDetailsModal').classList.add('active');
}

function closeDayDetailsModal() {
    document.getElementById('dayDetailsModal').classList.remove('active');
}

function handleSaveSettings(e) {
    e.preventDefault();
    const name = document.getElementById('studentNameInput').value.trim();
    const branch = document.getElementById('studentBranchInput').value.trim();
    const target = parseFloat(document.getElementById('targetPercentageInput').value);

    if (!name || isNaN(target) || target < 1 || target > 100) {
        showToast('Please enter a valid name and target percentage between 1 and 100.', 'warning');
        return;
    }

    appState.user.name = name;
    appState.user.branch = branch || 'Diploma CSE';
    appState.settings.studentName = name;
    appState.settings.studentBranch = branch || 'Diploma CSE';
    appState.settings.targetPercentage = target;

    saveStateToStorage();
    showToast('Preferences updated successfully', 'success');
    renderAllViews();
}


// ----------------------------------------------------------------------------
// 9. EXPORT, IMPORT & SAMPLE DATA UTILITIES
// ----------------------------------------------------------------------------

function exportAttendanceCSV() {
    if (appState.attendance.length === 0) {
        showToast('No attendance records to export', 'warning');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Subject Code,Subject Name,Status\n";

    appState.attendance.forEach(record => {
        const subject = appState.subjects.find(s => s.id === record.subjectId);
        const code = subject ? `"${subject.code}"` : '""';
        const name = subject ? `"${subject.name}"` : '""';
        const line = `${record.date},${code},${name},${record.status}\n`;
        csvContent += line;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${formatDateForInput(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV Report Downloaded', 'success');
}

function exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `attendance_backup_${formatDateForInput(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup JSON downloaded successfully', 'success');
}

function importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (imported && Array.isArray(imported.subjects) && Array.isArray(imported.attendance)) {
                appState = imported;
                saveStateToStorage();
                checkAuthStatus();
                renderAllViews();
                showToast('Backup imported successfully!', 'success');
            } else {
                showToast('Invalid backup file format', 'danger');
            }
        } catch (err) {
            console.error('Error importing backup:', err);
            showToast('Failed to parse backup JSON file', 'danger');
        }
    };
    reader.readAsText(file);
}

function loadSampleData() {
    if (confirm('Load sample subjects, attendance data, and holidays? This will overwrite your current state.')) {
        appState = {
            user: {
                isLoggedIn: true,
                name: 'Rahul Sharma',
                email: 'rahul@college.edu',
                roll: 'CSE-2026-042',
                branch: 'Diploma CSE',
                pin: '1234'
            },
            settings: {
                studentName: 'Rahul Sharma',
                studentBranch: 'Diploma CSE',
                targetPercentage: 75,
                theme: document.documentElement.getAttribute('data-theme') || 'dark'
            },
            subjects: [
                { id: 'sub-101', code: 'CS301', name: 'Database Management System', faculty: 'Dr. R. K. Sharma', color: '#4f46e5' },
                { id: 'sub-102', code: 'CS302', name: 'Computer Networks', faculty: 'Prof. Anjali Mehta', color: '#10b981' },
                { id: 'sub-103', code: 'CS303', name: 'Operating System', faculty: 'Dr. S. K. Gupta', color: '#f59e0b' },
                { id: 'sub-104', code: 'MA301', name: 'Applied Mathematics', faculty: 'Prof. Verma', color: '#ec4899' },
                { id: 'sub-105', code: 'CS304', name: 'Web Development', faculty: 'Er. Nitin Patel', color: '#3b82f6' }
            ],
            attendance: [
                { id: 'att-1', date: '2026-10-01', subjectId: 'sub-101', status: 'present' },
                { id: 'att-2', date: '2026-10-01', subjectId: 'sub-102', status: 'present' },
                { id: 'att-3', date: '2026-10-01', subjectId: 'sub-103', status: 'absent' },
                { id: 'att-4', date: '2026-10-05', subjectId: 'sub-102', status: 'present' },
                { id: 'att-5', date: '2026-10-05', subjectId: 'sub-103', status: 'present' },
                { id: 'att-6', date: '2026-10-06', subjectId: 'sub-101', status: 'present' },
                { id: 'att-7', date: '2026-10-06', subjectId: 'sub-104', status: 'absent' },
                { id: 'att-8', date: '2026-10-07', subjectId: 'sub-105', status: 'present' },
                { id: 'att-9', date: '2026-10-07', subjectId: 'sub-102', status: 'present' },
                { id: 'att-10', date: '2026-10-08', subjectId: 'sub-103', status: 'present' },
                { id: 'att-11', date: '2026-10-08', subjectId: 'sub-101', status: 'absent' },
                { id: 'att-12', date: '2026-10-09', subjectId: 'sub-105', status: 'present' }
            ],
            holidays: [
                { id: 'hol-1', date: '2026-10-02', name: 'Gandhi Jayanti', type: 'National Holiday' },
                { id: 'hol-2', date: '2026-10-24', name: 'Diwali Festival Break', type: 'Festival' },
                { id: 'hol-3', date: '2026-10-31', name: 'Sardar Patel Jayanti', type: 'National Holiday' }
            ]
        };

        saveStateToStorage();
        checkAuthStatus();
        renderAllViews();
        showToast('Sample college data and holidays loaded!', 'success');
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to clear ALL subjects, attendance records, and holidays? This action cannot be undone!')) {
        appState = JSON.parse(JSON.stringify(defaultState));
        saveStateToStorage();
        checkAuthStatus();
        renderAllViews();
        showToast('All data cleared', 'info');
    }
}


// ----------------------------------------------------------------------------
// 10. HELPER UTILITIES
// ----------------------------------------------------------------------------

function showToast(message, type = 'primary') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function formatDateForInput(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
