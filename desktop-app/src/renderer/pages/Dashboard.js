import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { NavigationProvider, useNavigation } from '../services/NavigationContext';
import apiService from '../services/api';
import DocumentsList from './documents/DocumentsList';
import ChangeControlList from './change-control/ChangeControlList';
import DeviationList from './deviations/DeviationList';
import CAPAList from './capa/CAPAList';
import AuditList from './audits/AuditList';
import TrainingList from './training/TrainingList';
import ReportsDashboard from './reports/ReportsDashboard';
import MyTrainings from './my-trainings/MyTrainings';
import NotificationsList from './notifications/NotificationsList';
import MyCertificates from './my-certificates/MyCertificates';
import styles from './Dashboard.module.css';
// Role-based permissions
const rolePermissions = {
    admin: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'users', 'my-trainings', 'notifications', 'certificates'],
    qa_manager: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'my-trainings', 'notifications', 'certificates'],
    pharmacist: ['dashboard', 'documents', 'reports', 'my-trainings', 'notifications', 'certificates'],
    technician: ['dashboard', 'my-trainings', 'notifications', 'certificates'],
    trainee: ['dashboard', 'my-trainings', 'notifications', 'certificates'],
};
const DashboardContent = () => {
    const { user, tenant, logout } = useAuth();
    const { activeModule, navigateTo } = useNavigation();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [trainingStats, setTrainingStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    useEffect(() => {
        loadUnreadCount();
        loadTrainingStats();
    }, []);
    const loadUnreadCount = async () => {
        try {
            const response = await apiService.getUnreadNotificationCount();
            setUnreadNotifications(response.data.count);
        }
        catch (error) {
            console.error('Failed to load notification count:', error);
        }
    };
    const loadTrainingStats = async () => {
        try {
            setLoadingStats(true);
            const response = await apiService.getMyAssignments();
            const assignments = response.data || [];
            const stats = {
                total: assignments.length,
                completed: 0,
                inProgress: 0,
                pending: 0,
                overdue: 0,
            };
            const now = new Date();
            assignments.forEach((a) => {
                if (a.status === 'completed') {
                    stats.completed++;
                }
                else if (a.status === 'in_progress' || a.status === 'exam_pending' || a.status === 'exam_failed') {
                    stats.inProgress++;
                }
                else if (a.status === 'assigned') {
                    if (new Date(a.dueDate) < now) {
                        stats.overdue++;
                    }
                    else {
                        stats.pending++;
                    }
                }
                else if (a.status === 'overdue') {
                    stats.overdue++;
                }
            });
            setTrainingStats(stats);
        }
        catch (error) {
            console.error('Failed to load training stats:', error);
        }
        finally {
            setLoadingStats(false);
        }
    };
    // Get user role, map old roles to new if needed
    const getUserRole = () => {
        const role = user?.role || 'trainee';
        // Map old roles to new
        if (role === 'manager')
            return 'qa_manager';
        if (role === 'user' || role === 'viewer')
            return 'trainee';
        return role;
    };
    const userRole = getUserRole();
    const allowedModules = rolePermissions[userRole] || rolePermissions.trainee;
    const allModules = [
        { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
        { id: 'my-trainings', name: 'My Trainings', icon: '📖' },
        { id: 'certificates', name: 'My Certificates', icon: '🎓' },
        { id: 'notifications', name: 'Notifications', icon: '🔔', badge: unreadNotifications },
        { id: 'documents', name: 'Document Control', icon: '📄' },
        { id: 'change-control', name: 'Change Control', icon: '🔄' },
        { id: 'deviations', name: 'Deviations', icon: '⚠️' },
        { id: 'capa', name: 'CAPA', icon: '🔧' },
        { id: 'audits', name: 'Audits', icon: '🔍' },
        { id: 'training', name: 'Training Management', icon: '📚' },
        { id: 'reports', name: 'Reports', icon: '📊' },
    ];
    const modules = allModules.filter(m => allowedModules.includes(m.id));
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return '#c62828';
            case 'qa_manager': return '#1565c0';
            case 'pharmacist': return '#2e7d32';
            case 'technician': return '#ef6c00';
            case 'trainee': return '#7b1fa2';
            default: return '#666';
        }
    };
    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'qa_manager': return 'QA Manager';
            case 'pharmacist': return 'Pharmacist';
            case 'technician': return 'Technician';
            case 'trainee': return 'Trainee';
            default: return role;
        }
    };
    return (_jsxs("div", { className: styles.dashboard, children: [_jsxs("aside", { className: styles.sidebar, children: [_jsx("div", { className: styles.sidebarHeader, children: tenant?.branding?.logo ? (_jsx("img", { src: tenant.branding.logo, alt: tenant.name, className: styles.logo })) : (_jsx("h2", { children: tenant?.name || 'QMS' })) }), _jsx("nav", { className: styles.nav, children: modules.map((module) => (_jsxs("button", { className: `${styles.navItem} ${activeModule === module.id ? styles.active : ''}`, onClick: () => navigateTo(module.id), children: [_jsx("span", { className: styles.icon, children: module.icon }), _jsx("span", { children: module.name }), module.badge ? (_jsx("span", { className: styles.navBadge, children: module.badge })) : null] }, module.id))) }), _jsxs("div", { className: styles.sidebarFooter, children: [_jsxs("div", { className: styles.userInfo, children: [_jsx("p", { className: styles.userName, children: user?.name }), _jsx("p", { className: styles.userRole, style: { color: getRoleBadgeColor(userRole) }, children: getRoleDisplayName(userRole) })] }), _jsx("button", { className: styles.logoutBtn, onClick: logout, children: "Logout" })] })] }), _jsx("main", { className: styles.main, children: activeModule === 'dashboard' ? (_jsxs("div", { className: styles.dashboardHome, children: [_jsxs("div", { className: styles.welcomeBanner, children: [_jsxs("div", { className: styles.welcomeContent, children: [_jsxs("h1", { children: ["Welcome to ", tenant?.name || 'Quality Management System'] }), _jsxs("p", { children: ["Hello, ", _jsx("strong", { children: user?.name }), "! You are logged in as ", _jsx("span", { className: styles.roleBadge, style: { backgroundColor: getRoleBadgeColor(userRole) }, children: getRoleDisplayName(userRole) })] })] }), _jsx("div", { className: styles.welcomeDate, children: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })] }), !loadingStats && trainingStats.total > 0 && (_jsxs("div", { className: styles.trainingProgressSection, children: [_jsx("h2", { children: "Training Progress" }), _jsxs("div", { className: styles.trainingProgressContent, children: [_jsxs("div", { className: styles.progressCircle, children: [_jsxs("svg", { viewBox: "0 0 36 36", className: styles.circularChart, children: [_jsx("path", { className: styles.circleBg, d: "M18 2.0845\n                          a 15.9155 15.9155 0 0 1 0 31.831\n                          a 15.9155 15.9155 0 0 1 0 -31.831" }), _jsx("path", { className: styles.circle, strokeDasharray: `${(trainingStats.completed / trainingStats.total) * 100}, 100`, d: "M18 2.0845\n                          a 15.9155 15.9155 0 0 1 0 31.831\n                          a 15.9155 15.9155 0 0 1 0 -31.831" })] }), _jsxs("div", { className: styles.progressPercentage, children: [Math.round((trainingStats.completed / trainingStats.total) * 100), "%"] })] }), _jsxs("div", { className: styles.progressStats, children: [_jsxs("div", { className: styles.progressStatItem, children: [_jsx("span", { className: styles.progressStatValue, children: trainingStats.completed }), _jsx("span", { className: styles.progressStatLabel, children: "Completed" })] }), _jsxs("div", { className: styles.progressStatItem, children: [_jsx("span", { className: `${styles.progressStatValue} ${styles.inProgress}`, children: trainingStats.inProgress }), _jsx("span", { className: styles.progressStatLabel, children: "In Progress" })] }), _jsxs("div", { className: styles.progressStatItem, children: [_jsx("span", { className: styles.progressStatValue, children: trainingStats.pending }), _jsx("span", { className: styles.progressStatLabel, children: "Pending" })] }), trainingStats.overdue > 0 && (_jsxs("div", { className: styles.progressStatItem, children: [_jsx("span", { className: `${styles.progressStatValue} ${styles.overdue}`, children: trainingStats.overdue }), _jsx("span", { className: styles.progressStatLabel, children: "Overdue" })] }))] })] }), _jsx("button", { className: styles.viewAllTrainingsBtn, onClick: () => navigateTo('my-trainings'), children: "View All Trainings" })] })), _jsxs("div", { className: styles.statsGrid, children: [_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('my-trainings'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDCD6" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "My Trainings" }), _jsx("p", { children: trainingStats.total > 0
                                                        ? `${trainingStats.completed} of ${trainingStats.total} completed`
                                                        : 'View and complete assigned trainings' })] })] }), _jsxs("div", { className: styles.statCard, onClick: () => navigateTo('certificates'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83C\uDF93" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "My Certificates" }), _jsx("p", { children: "View your earned certificates" })] })] }), _jsxs("div", { className: styles.statCard, onClick: () => navigateTo('notifications'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDD14" }), _jsxs("div", { className: styles.statInfo, children: [_jsxs("h3", { children: ["Notifications ", unreadNotifications > 0 && _jsx("span", { className: styles.notifBadge, children: unreadNotifications })] }), _jsx("p", { children: "View your notifications" })] })] }), allowedModules.includes('documents') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('documents'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDCC4" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Documents" }), _jsx("p", { children: "Manage SOPs, Policies & Forms" })] })] })), allowedModules.includes('change-control') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('change-control'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDD04" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Change Control" }), _jsx("p", { children: "Track changes & approvals" })] })] })), allowedModules.includes('deviations') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('deviations'), children: [_jsx("span", { className: styles.statIcon, children: "\u26A0\uFE0F" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Deviations" }), _jsx("p", { children: "Report & resolve deviations" })] })] })), allowedModules.includes('capa') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('capa'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDD27" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "CAPA" }), _jsx("p", { children: "Corrective & preventive actions" })] })] })), allowedModules.includes('audits') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('audits'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDD0D" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Audits" }), _jsx("p", { children: "Internal & external audits" })] })] })), allowedModules.includes('training') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('training'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDCDA" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Training Management" }), _jsx("p", { children: "Create & assign trainings" })] })] })), allowedModules.includes('reports') && (_jsxs("div", { className: styles.statCard, onClick: () => navigateTo('reports'), children: [_jsx("span", { className: styles.statIcon, children: "\uD83D\uDCCA" }), _jsxs("div", { className: styles.statInfo, children: [_jsx("h3", { children: "Reports" }), _jsx("p", { children: "Analytics & compliance reports" })] })] }))] }), _jsx("div", { className: styles.quickInfo, children: _jsxs("p", { children: ["Quality Management System for ", _jsx("strong", { children: tenant?.name || 'Your Pharmacy' })] }) })] })) : activeModule === 'my-trainings' ? (_jsx(MyTrainings, {})) : activeModule === 'notifications' ? (_jsx(NotificationsList, {})) : activeModule === 'certificates' ? (_jsx(MyCertificates, {})) : activeModule === 'documents' ? (_jsx(DocumentsList, {})) : activeModule === 'change-control' ? (_jsx(ChangeControlList, {})) : activeModule === 'deviations' ? (_jsx(DeviationList, {})) : activeModule === 'capa' ? (_jsx(CAPAList, {})) : activeModule === 'audits' ? (_jsx(AuditList, {})) : activeModule === 'training' ? (_jsx(TrainingList, {})) : activeModule === 'reports' ? (_jsx(ReportsDashboard, {})) : (_jsxs(_Fragment, { children: [_jsxs("header", { className: styles.header, children: [_jsx("h1", { children: modules.find((m) => m.id === activeModule)?.name }), _jsx("div", { className: styles.headerActions, children: _jsx("button", { className: styles.primaryBtn, children: "+ New" }) })] }), _jsx("div", { className: styles.content, children: _jsxs("div", { className: styles.placeholder, children: [_jsxs("h3", { children: ["Welcome to ", modules.find((m) => m.id === activeModule)?.name] }), _jsx("p", { children: "This module is under development." })] }) })] })) })] }));
};
// Wrapper component that provides navigation context
const Dashboard = () => {
    return (_jsx(NavigationProvider, { children: _jsx(DashboardContent, {}) }));
};
export default Dashboard;
