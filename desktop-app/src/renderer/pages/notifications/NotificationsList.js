import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { useNavigation } from '../../services/NavigationContext';
import styles from './NotificationsList.module.css';
const NotificationsList = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { navigateTo } = useNavigation();
    useEffect(() => {
        loadNotifications();
        loadUnreadCount();
    }, []);
    // Parse notification link to determine module and params
    const parseNotificationLink = (link) => {
        if (!link)
            return null;
        // Parse links like:
        // /training/my-trainings/{assignmentId}
        // /training/my-trainings/{assignmentId}/exam
        // /training/certificates/{certificateId}
        const trainingMatch = link.match(/\/training\/my-trainings\/([^/]+)/);
        if (trainingMatch) {
            return {
                module: 'my-trainings',
                params: { assignmentId: trainingMatch[1] }
            };
        }
        const certificateMatch = link.match(/\/training\/certificates\/([^/]+)/);
        if (certificateMatch) {
            return {
                module: 'certificates',
                params: { certificateId: certificateMatch[1] }
            };
        }
        // General module mapping
        if (link.includes('/documents'))
            return { module: 'documents', params: {} };
        if (link.includes('/change-control'))
            return { module: 'change-control', params: {} };
        if (link.includes('/deviations'))
            return { module: 'deviations', params: {} };
        if (link.includes('/capa'))
            return { module: 'capa', params: {} };
        if (link.includes('/audits'))
            return { module: 'audits', params: {} };
        if (link.includes('/training'))
            return { module: 'training', params: {} };
        return null;
    };
    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }
        // Navigate to the linked page if link exists
        const parsed = parseNotificationLink(notification.link);
        if (parsed) {
            navigateTo(parsed.module, parsed.params);
        }
    };
    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiService.getNotifications();
            setNotifications(response.data);
        }
        catch (error) {
            console.error('Failed to load notifications:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadUnreadCount = async () => {
        try {
            const response = await apiService.getUnreadNotificationCount();
            setUnreadCount(response.data.count);
        }
        catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };
    const handleMarkAsRead = async (id) => {
        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };
    const handleMarkAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
        catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'training_assigned': return '📚';
            case 'training_reminder': return '⏰';
            case 'training_overdue': return '⚠️';
            case 'exam_available': return '📝';
            case 'certificate_issued': return '🎓';
            default: return '📢';
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));
        if (days > 0)
            return `${days}d ago`;
        if (hours > 0)
            return `${hours}h ago`;
        if (minutes > 0)
            return `${minutes}m ago`;
        return 'Just now';
    };
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.titleArea, children: [_jsx("h1", { children: "Notifications" }), unreadCount > 0 && (_jsxs("span", { className: styles.badge, children: [unreadCount, " unread"] }))] }), unreadCount > 0 && (_jsx("button", { onClick: handleMarkAllAsRead, className: styles.markAllBtn, children: "Mark all as read" }))] }), loading ? (_jsx("div", { className: styles.loading, children: "Loading notifications..." })) : notifications.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("span", { className: styles.emptyIcon, children: "\uD83D\uDD14" }), _jsx("h3", { children: "No notifications" }), _jsx("p", { children: "You're all caught up!" })] })) : (_jsx("div", { className: styles.notificationList, children: notifications.map(notification => (_jsxs("div", { className: `${styles.notification} ${!notification.isRead ? styles.unread : ''}`, onClick: () => handleNotificationClick(notification), children: [_jsx("div", { className: styles.icon, children: getNotificationIcon(notification.type) }), _jsxs("div", { className: styles.content, children: [_jsx("h3", { children: notification.title }), _jsx("p", { children: notification.message }), _jsx("span", { className: styles.time, children: formatDate(notification.createdAt) })] }), !notification.isRead && (_jsx("span", { className: styles.unreadDot }))] }, notification._id))) }))] }));
};
export default NotificationsList;
