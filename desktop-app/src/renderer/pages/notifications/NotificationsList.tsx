import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { useNavigation, NavigationParams } from '../../services/NavigationContext';
import styles from './NotificationsList.module.css';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Parse notification link to determine module and params
  const parseNotificationLink = (link?: string): { module: string; params: NavigationParams } | null => {
    if (!link) return null;

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
    if (link.includes('/documents')) return { module: 'documents', params: {} };
    if (link.includes('/change-control')) return { module: 'change-control', params: {} };
    if (link.includes('/deviations')) return { module: 'deviations', params: {} };
    if (link.includes('/capa')) return { module: 'capa', params: {} };
    if (link.includes('/audits')) return { module: 'audits', params: {} };
    if (link.includes('/training')) return { module: 'training', params: {} };

    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
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
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'training_assigned': return '📚';
      case 'training_reminder': return '⏰';
      case 'training_overdue': return '⚠️';
      case 'exam_available': return '📝';
      case 'certificate_issued': return '🎓';
      default: return '📢';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className={styles.markAllBtn}>
            Mark all as read
          </button>
        )}
      </header>

      {loading ? (
        <div className={styles.loading}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔔</span>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className={styles.notificationList}>
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`${styles.notification} ${!notification.isRead ? styles.unread : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={styles.icon}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={styles.content}>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className={styles.time}>{formatDate(notification.createdAt)}</span>
              </div>
              {!notification.isRead && (
                <span className={styles.unreadDot}></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
