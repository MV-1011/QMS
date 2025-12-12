import React, { useState, useEffect } from 'react';
import {
  Home,
  GraduationCap,
  Award,
  Bell,
  FileText,
  RefreshCw,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
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

interface TrainingStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

// Role-based permissions - modules each role can access
const rolePermissions: Record<string, string[]> = {
  admin: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'users', 'my-trainings', 'notifications', 'certificates'],
  qa_manager: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'my-trainings', 'notifications', 'certificates'],
  pharmacist: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'my-trainings', 'notifications', 'certificates'],
  technician: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'my-trainings', 'notifications', 'certificates'],
  trainee: ['dashboard', 'documents', 'change-control', 'deviations', 'capa', 'audits', 'training', 'reports', 'my-trainings', 'notifications', 'certificates'],
};

// Roles that have full edit access (not read-only)
const fullAccessRoles = ['admin', 'qa_manager'];

// Check if user can edit (has full access)
const canEdit = (role: string) => fullAccessRoles.includes(role);

const DashboardContent: React.FC = () => {
  const { user, tenant, logout } = useAuth();
  const { activeModule, navigateTo } = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [trainingStats, setTrainingStats] = useState<TrainingStats>({
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
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  const loadTrainingStats = async () => {
    try {
      setLoadingStats(true);
      const response = await apiService.getMyAssignments();
      const assignments = response.data || [];

      const stats: TrainingStats = {
        total: assignments.length,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
      };

      const now = new Date();
      assignments.forEach((a: any) => {
        if (a.status === 'completed') {
          stats.completed++;
        } else if (a.status === 'in_progress' || a.status === 'exam_pending' || a.status === 'exam_failed') {
          stats.inProgress++;
        } else if (a.status === 'assigned') {
          if (new Date(a.dueDate) < now) {
            stats.overdue++;
          } else {
            stats.pending++;
          }
        } else if (a.status === 'overdue') {
          stats.overdue++;
        }
      });

      setTrainingStats(stats);
    } catch (error) {
      console.error('Failed to load training stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Get user role, map old roles to new if needed
  const getUserRole = () => {
    const role = user?.role || 'trainee';
    // Map old roles to new
    if (role === 'manager') return 'qa_manager';
    if (role === 'user' || role === 'viewer') return 'trainee';
    return role;
  };

  const userRole = getUserRole();
  const allowedModules = rolePermissions[userRole] || rolePermissions.trainee;

  const allModules = [
    { id: 'dashboard', name: 'Dashboard', icon: <Home size={18} /> },
    { id: 'my-trainings', name: 'My Trainings', icon: <GraduationCap size={18} /> },
    { id: 'certificates', name: 'My Certificates', icon: <Award size={18} /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} />, badge: unreadNotifications },
    { id: 'documents', name: 'Document Control', icon: <FileText size={18} /> },
    { id: 'change-control', name: 'Change Control', icon: <RefreshCw size={18} /> },
    { id: 'deviations', name: 'Deviations', icon: <AlertTriangle size={18} /> },
    { id: 'capa', name: 'CAPA', icon: <Wrench size={18} /> },
    { id: 'audits', name: 'Audits', icon: <ClipboardCheck size={18} /> },
    { id: 'training', name: 'Training Management', icon: <BookOpen size={18} /> },
    { id: 'reports', name: 'Reports', icon: <BarChart3 size={18} /> },
  ];

  const modules = allModules.filter(m => allowedModules.includes(m.id));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#c62828';
      case 'qa_manager': return '#1565c0';
      case 'pharmacist': return '#2e7d32';
      case 'technician': return '#ef6c00';
      case 'trainee': return '#7b1fa2';
      default: return '#666';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'qa_manager': return 'QA Manager';
      case 'pharmacist': return 'Pharmacist';
      case 'technician': return 'Technician';
      case 'trainee': return 'Trainee';
      default: return role;
    }
  };

  return (
    <div className={styles.dashboard}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <button
            className={styles.hamburgerBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          {!sidebarCollapsed && (
            tenant?.branding?.logo ? (
              <img src={tenant.branding.logo} alt={tenant.name} className={styles.logo} />
            ) : (
              <h2>{tenant?.name || 'QMS'}</h2>
            )
          )}
        </div>

        <nav className={styles.nav}>
          {modules.map((module) => (
            <button
              key={module.id}
              className={`${styles.navItem} ${
                activeModule === module.id ? styles.active : ''
              }`}
              onClick={() => navigateTo(module.id)}
              title={sidebarCollapsed ? module.name : undefined}
            >
              <span className={styles.icon}>{module.icon}</span>
              {!sidebarCollapsed && <span>{module.name}</span>}
              {!sidebarCollapsed && module.badge ? (
                <span className={styles.navBadge}>{module.badge}</span>
              ) : null}
              {sidebarCollapsed && module.badge ? (
                <span className={styles.collapsedBadge}>{module.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {!sidebarCollapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p
                className={styles.userRole}
                style={{ color: getRoleBadgeColor(userRole) }}
              >
                {getRoleDisplayName(userRole)}
              </p>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={logout} title={sidebarCollapsed ? 'Logout' : undefined}>
            {sidebarCollapsed ? <LogOut size={16} /> : 'Logout'}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {activeModule === 'dashboard' ? (
          <div className={styles.dashboardHome}>
            <div className={styles.welcomeBanner}>
              <div className={styles.welcomeContent}>
                <h1>Welcome to {tenant?.name || 'Quality Management System'}</h1>
                <p>Hello, <strong>{user?.name}</strong>! You are logged in as <span className={styles.roleBadge} style={{ backgroundColor: getRoleBadgeColor(userRole) }}>{getRoleDisplayName(userRole)}</span></p>
              </div>
              <div className={styles.welcomeDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className={styles.statsGrid}>
              {/* Always show My Trainings for all roles */}
              <div className={styles.statCard} onClick={() => navigateTo('my-trainings')}>
                <span className={styles.statIcon}><GraduationCap size={28} /></span>
                <div className={styles.statInfo}>
                  <h3>My Trainings</h3>
                  <p>
                    {trainingStats.total > 0
                      ? `${trainingStats.completed} of ${trainingStats.total} completed`
                      : 'View and complete assigned trainings'
                    }
                  </p>
                </div>
              </div>

              {/* Always show Certificates for all roles */}
              <div className={styles.statCard} onClick={() => navigateTo('certificates')}>
                <span className={styles.statIcon}><Award size={28} /></span>
                <div className={styles.statInfo}>
                  <h3>My Certificates</h3>
                  <p>View your earned certificates</p>
                </div>
              </div>

              {/* Show notifications with badge */}
              <div className={styles.statCard} onClick={() => navigateTo('notifications')}>
                <span className={styles.statIcon}><Bell size={28} /></span>
                <div className={styles.statInfo}>
                  <h3>Notifications {unreadNotifications > 0 && <span className={styles.notifBadge}>{unreadNotifications}</span>}</h3>
                  <p>View your notifications</p>
                </div>
              </div>

              {/* Role-based modules */}
              {allowedModules.includes('documents') && (
                <div className={styles.statCard} onClick={() => navigateTo('documents')}>
                  <span className={styles.statIcon}><FileText size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Documents</h3>
                    <p>Manage SOPs, Policies & Forms</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('change-control') && (
                <div className={styles.statCard} onClick={() => navigateTo('change-control')}>
                  <span className={styles.statIcon}><RefreshCw size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Change Control</h3>
                    <p>Track changes & approvals</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('deviations') && (
                <div className={styles.statCard} onClick={() => navigateTo('deviations')}>
                  <span className={styles.statIcon}><AlertTriangle size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Deviations</h3>
                    <p>Report & resolve deviations</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('capa') && (
                <div className={styles.statCard} onClick={() => navigateTo('capa')}>
                  <span className={styles.statIcon}><Wrench size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>CAPA</h3>
                    <p>Corrective & preventive actions</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('audits') && (
                <div className={styles.statCard} onClick={() => navigateTo('audits')}>
                  <span className={styles.statIcon}><ClipboardCheck size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Audits</h3>
                    <p>Internal & external audits</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('training') && (
                <div className={styles.statCard} onClick={() => navigateTo('training')}>
                  <span className={styles.statIcon}><BookOpen size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Training Management</h3>
                    <p>Create & assign trainings</p>
                  </div>
                </div>
              )}

              {allowedModules.includes('reports') && (
                <div className={styles.statCard} onClick={() => navigateTo('reports')}>
                  <span className={styles.statIcon}><BarChart3 size={28} /></span>
                  <div className={styles.statInfo}>
                    <h3>Reports</h3>
                    <p>Analytics & compliance reports</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeModule === 'my-trainings' ? (
          <MyTrainings />
        ) : activeModule === 'notifications' ? (
          <NotificationsList />
        ) : activeModule === 'certificates' ? (
          <MyCertificates />
        ) : activeModule === 'documents' ? (
          <DocumentsList readOnly={!canEdit(userRole)} />
        ) : activeModule === 'change-control' ? (
          <ChangeControlList readOnly={!canEdit(userRole)} />
        ) : activeModule === 'deviations' ? (
          <DeviationList />
        ) : activeModule === 'capa' ? (
          <CAPAList readOnly={!canEdit(userRole)} />
        ) : activeModule === 'audits' ? (
          <AuditList readOnly={!canEdit(userRole)} />
        ) : activeModule === 'training' ? (
          <TrainingList readOnly={!canEdit(userRole)} />
        ) : activeModule === 'reports' ? (
          <ReportsDashboard />
        ) : (
          <>
            <header className={styles.header}>
              <h1>{modules.find((m) => m.id === activeModule)?.name}</h1>
              <div className={styles.headerActions}>
                <button className={styles.primaryBtn}>+ New</button>
              </div>
            </header>

            <div className={styles.content}>
              <div className={styles.placeholder}>
                <h3>Welcome to {modules.find((m) => m.id === activeModule)?.name}</h3>
                <p>This module is under development.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Wrapper component that provides navigation context
const Dashboard: React.FC = () => {
  return (
    <NavigationProvider>
      <DashboardContent />
    </NavigationProvider>
  );
};

export default Dashboard;
