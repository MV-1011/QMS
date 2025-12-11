import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './ReportsDashboard.module.css';

interface DashboardStats {
  totals: {
    documents: number;
    changeControls: number;
    deviations: number;
    capas: number;
    audits: number;
    trainings: number;
  };
  byStatus: {
    documents: Array<{ _id: string; count: number }>;
    changeControls: Array<{ _id: string; count: number }>;
    deviations: Array<{ _id: string; count: number }>;
    capas: Array<{ _id: string; count: number }>;
    audits: Array<{ _id: string; count: number }>;
    trainings: Array<{ _id: string; count: number }>;
  };
  alerts: {
    openDeviations: number;
    openCAPAs: number;
    overdueTrainings: number;
    upcomingAudits: number;
  };
}

interface ComplianceData {
  overallScore: number;
  metrics: {
    deviations: { total: number; closed: number; rate: number };
    capas: { total: number; closed: number; rate: number };
    trainings: { total: number; completed: number; rate: number };
    audits: { total: number; completed: number; rate: number };
  };
}

const ReportsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, complianceResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getComplianceSummary(),
      ]);
      setStats(statsResponse.data);
      setCompliance(complianceResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!stats || !compliance) return <div className={styles.error}>No data available</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Reports & Analytics</h1>
        <button className={styles.refreshBtn} onClick={fetchData}>
          Refresh Data
        </button>
      </header>

      {/* Compliance Score */}
      <section className={styles.complianceSection}>
        <h2>Compliance Overview</h2>
        <div className={styles.scoreCard}>
          <div className={styles.mainScore} style={{ borderColor: getScoreColor(compliance.overallScore) }}>
            <span className={styles.scoreValue} style={{ color: getScoreColor(compliance.overallScore) }}>
              {compliance.overallScore}%
            </span>
            <span className={styles.scoreLabel}>Overall Compliance Score</span>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Deviation Closure</span>
                <span style={{ color: getScoreColor(compliance.metrics.deviations.rate) }}>
                  {compliance.metrics.deviations.rate}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${compliance.metrics.deviations.rate}%`, backgroundColor: getScoreColor(compliance.metrics.deviations.rate) }}
                />
              </div>
              <span className={styles.metricDetail}>{compliance.metrics.deviations.closed} / {compliance.metrics.deviations.total} closed</span>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>CAPA Closure</span>
                <span style={{ color: getScoreColor(compliance.metrics.capas.rate) }}>
                  {compliance.metrics.capas.rate}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${compliance.metrics.capas.rate}%`, backgroundColor: getScoreColor(compliance.metrics.capas.rate) }}
                />
              </div>
              <span className={styles.metricDetail}>{compliance.metrics.capas.closed} / {compliance.metrics.capas.total} closed</span>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Training Completion</span>
                <span style={{ color: getScoreColor(compliance.metrics.trainings.rate) }}>
                  {compliance.metrics.trainings.rate}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${compliance.metrics.trainings.rate}%`, backgroundColor: getScoreColor(compliance.metrics.trainings.rate) }}
                />
              </div>
              <span className={styles.metricDetail}>{compliance.metrics.trainings.completed} / {compliance.metrics.trainings.total} completed</span>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Audit Completion</span>
                <span style={{ color: getScoreColor(compliance.metrics.audits.rate) }}>
                  {compliance.metrics.audits.rate}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${compliance.metrics.audits.rate}%`, backgroundColor: getScoreColor(compliance.metrics.audits.rate) }}
                />
              </div>
              <span className={styles.metricDetail}>{compliance.metrics.audits.completed} / {compliance.metrics.audits.total} completed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className={styles.alertsSection}>
        <h2>Action Items</h2>
        <div className={styles.alertsGrid}>
          <div className={`${styles.alertCard} ${stats.alerts.openDeviations > 0 ? styles.alertWarning : styles.alertSuccess}`}>
            <span className={styles.alertCount}>{stats.alerts.openDeviations}</span>
            <span className={styles.alertLabel}>Open Deviations</span>
          </div>
          <div className={`${styles.alertCard} ${stats.alerts.openCAPAs > 0 ? styles.alertWarning : styles.alertSuccess}`}>
            <span className={styles.alertCount}>{stats.alerts.openCAPAs}</span>
            <span className={styles.alertLabel}>Open CAPAs</span>
          </div>
          <div className={`${styles.alertCard} ${stats.alerts.overdueTrainings > 0 ? styles.alertDanger : styles.alertSuccess}`}>
            <span className={styles.alertCount}>{stats.alerts.overdueTrainings}</span>
            <span className={styles.alertLabel}>Overdue Trainings</span>
          </div>
          <div className={`${styles.alertCard} ${styles.alertInfo}`}>
            <span className={styles.alertCount}>{stats.alerts.upcomingAudits}</span>
            <span className={styles.alertLabel}>Upcoming Audits (30 days)</span>
          </div>
        </div>
      </section>

      {/* Module Summary */}
      <section className={styles.summarySection}>
        <h2>Module Summary</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📄</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.documents}</span>
              <span className={styles.summaryLabel}>Documents</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.documents.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🔄</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.changeControls}</span>
              <span className={styles.summaryLabel}>Change Controls</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.changeControls.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>⚠️</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.deviations}</span>
              <span className={styles.summaryLabel}>Deviations</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.deviations.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🔧</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.capas}</span>
              <span className={styles.summaryLabel}>CAPAs</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.capas.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🔍</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.audits}</span>
              <span className={styles.summaryLabel}>Audits</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.audits.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📚</div>
            <div className={styles.summaryInfo}>
              <span className={styles.summaryCount}>{stats.totals.trainings}</span>
              <span className={styles.summaryLabel}>Trainings</span>
            </div>
            <div className={styles.statusBreakdown}>
              {stats.byStatus.trainings.map((s) => (
                <span key={s._id} className={styles.statusItem}>
                  {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportsDashboard;
