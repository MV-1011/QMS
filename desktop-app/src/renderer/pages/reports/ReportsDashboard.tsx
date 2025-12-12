import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { apiService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
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

  // Pure SVG Donut Chart component
  const DonutChart: React.FC<{
    percentage: number;
    completed: number;
    total: number;
    label: string;
    completedLabel: string;
  }> = ({ percentage, completed, total, label, completedLabel }) => {
    const color = getScoreColor(percentage);
    const remaining = total - completed;

    // SVG donut chart calculations
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={styles.pieChartCard}>
        <h3 className={styles.pieChartLabel}>{label}</h3>
        <div className={styles.pieChartContainer}>
          <svg width={size} height={size} className={styles.donutSvg}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className={styles.pieChartCenter}>
            <span className={styles.pieChartPercentage} style={{ color }}>
              {percentage}%
            </span>
          </div>
        </div>
        <div className={styles.pieChartDetail}>
          {completed} / {total} {completedLabel}
        </div>
        <div className={styles.pieChartLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: color }}></span>
            <span>{completedLabel.charAt(0).toUpperCase() + completedLabel.slice(1)}: {completed}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#e5e7eb' }}></span>
            <span>Remaining: {remaining}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!stats || !compliance) return <div className={styles.error}>No data available</div>;

  return (
    <div className={styles.container}>
      <PageHeader icon={<BarChart3 size={24} />} title="Reports & Analytics">
        <button className={styles.refreshBtn} onClick={fetchData}>
          Refresh Data
        </button>
      </PageHeader>

      {/* Compliance Score */}
      <section className={styles.complianceSection}>
        <h2>Compliance Overview</h2>
        <div className={styles.pieChartsGrid}>
          <DonutChart
            percentage={compliance.overallScore}
            completed={Math.round(compliance.overallScore)}
            total={100}
            label="Overall Compliance Score"
            completedLabel="score"
          />
          <DonutChart
            percentage={compliance.metrics.deviations.rate}
            completed={compliance.metrics.deviations.closed}
            total={compliance.metrics.deviations.total}
            label="Deviation Closure"
            completedLabel="closed"
          />
          <DonutChart
            percentage={compliance.metrics.capas.rate}
            completed={compliance.metrics.capas.closed}
            total={compliance.metrics.capas.total}
            label="CAPA Closure"
            completedLabel="closed"
          />
          <DonutChart
            percentage={compliance.metrics.trainings.rate}
            completed={compliance.metrics.trainings.completed}
            total={compliance.metrics.trainings.total}
            label="Training Completion"
            completedLabel="completed"
          />
          <DonutChart
            percentage={compliance.metrics.audits.rate}
            completed={compliance.metrics.audits.completed}
            total={compliance.metrics.audits.total}
            label="Audit Completion"
            completedLabel="completed"
          />
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
