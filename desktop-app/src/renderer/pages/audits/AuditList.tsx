import React, { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import apiService from '../../services/api';
import PageHeader from '../../components/PageHeader';
import styles from './AuditList.module.css';

interface Audit {
  _id: string;
  auditNumber: string;
  title: string;
  description: string;
  auditType: 'Internal' | 'External' | 'Regulatory' | 'Supplier' | 'Self-Inspection';
  scope: string;
  standard?: string;
  status: 'planned' | 'in_progress' | 'report_draft' | 'report_review' | 'completed' | 'closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate: string;
  startDate?: string;
  endDate?: string;
  completionDate?: string;
  leadAuditor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  auditTeam?: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
  auditee?: string;
  externalOrganization?: string;
  auditorName?: string;
  findingsCount?: {
    critical: number;
    major: number;
    minor: number;
    observation: number;
  };
  executiveSummary?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  capaGenerated?: boolean;
  capaReferences?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  auditType: 'Internal' | 'External' | 'Regulatory' | 'Supplier' | 'Self-Inspection';
  scope: string;
  standard: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate: string;
  auditee: string;
  externalOrganization: string;
  auditorName: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  auditType: 'Internal',
  scope: '',
  standard: '',
  priority: 'Medium',
  scheduledDate: '',
  auditee: '',
  externalOrganization: '',
  auditorName: '',
};

const AUDIT_TYPES = [
  'Internal',
  'External',
  'Regulatory',
  'Supplier',
  'Self-Inspection',
];

interface AuditListProps {
  readOnly?: boolean;
}

const AuditList: React.FC<AuditListProps> = ({ readOnly = false }) => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadAudits();
  }, [statusFilter, auditTypeFilter, priorityFilter]);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (auditTypeFilter !== 'all') params.auditType = auditTypeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await apiService.getAudits(params);
      setAudits(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audits');
      console.error('Error loading audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (audit: Audit) => {
    setFormData({
      title: audit.title,
      description: audit.description,
      auditType: audit.auditType,
      scope: audit.scope,
      standard: audit.standard || '',
      priority: audit.priority,
      scheduledDate: audit.scheduledDate ? audit.scheduledDate.split('T')[0] : '',
      auditee: audit.auditee || '',
      externalOrganization: audit.externalOrganization || '',
      auditorName: audit.auditorName || '',
    });
    setEditingId(audit._id);
    setShowForm(true);
    setSelectedAudit(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await apiService.updateAudit(editingId, formData);
      } else {
        await apiService.createAudit(formData);
      }
      handleCloseForm();
      loadAudits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save audit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audit?')) return;

    try {
      await apiService.deleteAudit(id);
      loadAudits();
      if (selectedAudit?._id === id) {
        setSelectedAudit(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete audit');
    }
  };

  const handleStatusChange = async (audit: Audit, newStatus: string) => {
    try {
      await apiService.updateAudit(audit._id, { status: newStatus });
      loadAudits();
      if (selectedAudit?._id === audit._id) {
        setSelectedAudit({ ...selectedAudit, status: newStatus as any });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return styles.priorityCritical;
      case 'High':
        return styles.priorityHigh;
      case 'Medium':
        return styles.priorityMedium;
      case 'Low':
        return styles.priorityLow;
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'planned':
        return styles.statusPlanned;
      case 'in_progress':
        return styles.statusInProgress;
      case 'report_draft':
        return styles.statusDraft;
      case 'report_review':
        return styles.statusReview;
      case 'completed':
        return styles.statusCompleted;
      case 'closed':
        return styles.statusClosed;
      default:
        return '';
    }
  };

  const getAuditTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Internal':
        return styles.typeInternal;
      case 'External':
        return styles.typeExternal;
      case 'Regulatory':
        return styles.typeRegulatory;
      case 'Supplier':
        return styles.typeSupplier;
      case 'Self-Inspection':
        return styles.typeSelfInspection;
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStats = () => {
    const total = audits.length;
    const upcoming = audits.filter(
      (a) => a.status === 'planned' && new Date(a.scheduledDate) > new Date()
    ).length;
    const inProgress = audits.filter((a) => a.status === 'in_progress').length;
    const completed = audits.filter((a) => a.status === 'completed' || a.status === 'closed')
      .length;

    return { total, upcoming, inProgress, completed };
  };

  const getTotalFindings = (audit: Audit) => {
    if (!audit.findingsCount) return 0;
    const { critical, major, minor, observation } = audit.findingsCount;
    return critical + major + minor + observation;
  };

  const stats = getStats();

  // Form view
  if (showForm) {
    return (
      <div className={styles.container}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={handleCloseForm}>
            ← Back to List
          </button>
          <h2>{editingId ? 'Edit Audit' : 'New Audit'}</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Audit title"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="Describe the purpose and objectives of this audit"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="auditType">Audit Type *</label>
              <select
                id="auditType"
                name="auditType"
                value={formData.auditType}
                onChange={handleInputChange}
                required
              >
                {AUDIT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority">Priority *</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scope">Scope *</label>
            <textarea
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              required
              rows={2}
              placeholder="Define the scope of the audit"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="standard">Standard/Regulation</label>
              <input
                type="text"
                id="standard"
                name="standard"
                value={formData.standard}
                onChange={handleInputChange}
                placeholder="e.g., ISO 9001, FDA 21 CFR Part 11"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="scheduledDate">Scheduled Date *</label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="auditee">Auditee (Department/Area)</label>
            <input
              type="text"
              id="auditee"
              name="auditee"
              value={formData.auditee}
              onChange={handleInputChange}
              placeholder="e.g., Quality Control, Production"
            />
          </div>

          {(formData.auditType === 'External' || formData.auditType === 'Regulatory') && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="externalOrganization">External Organization</label>
                <input
                  type="text"
                  id="externalOrganization"
                  name="externalOrganization"
                  value={formData.externalOrganization}
                  onChange={handleInputChange}
                  placeholder="Name of external auditing organization"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="auditorName">External Auditor Name</label>
                <input
                  type="text"
                  id="auditorName"
                  name="auditorName"
                  value={formData.auditorName}
                  onChange={handleInputChange}
                  placeholder="Name of external auditor"
                />
              </div>
            </>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} onClick={handleCloseForm}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create Audit')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading audits...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader icon={<ClipboardCheck size={24} />} title="Audit Management" subtitle="Internal, External, Regulatory, and Supplier Audits">
        {!readOnly && (
          <button className={styles.primaryBtn} onClick={handleCreate}>+ New Audit</button>
        )}
      </PageHeader>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Audits</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Upcoming</div>
          <div className={styles.statValue}>{stats.upcoming}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>In Progress</div>
          <div className={styles.statValue}>{stats.inProgress}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Completed</div>
          <div className={styles.statValue}>{stats.completed}</div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="report_draft">Report Draft</option>
            <option value="report_review">Report Review</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Audit Type:</label>
          <select value={auditTypeFilter} onChange={(e) => setAuditTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Supplier">Supplier</option>
            <option value="Self-Inspection">Self-Inspection</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Priority:</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>
        {!selectedAudit ? (
          <div className={styles.listView}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Audit #</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Scheduled Date</th>
                  <th>Auditee</th>
                  <th>Findings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit._id}>
                    <td>
                      <strong>{audit.auditNumber}</strong>
                    </td>
                    <td className={styles.titleCell}>{audit.title}</td>
                    <td>
                      <span className={`${styles.badge} ${getAuditTypeBadgeClass(audit.auditType)}`}>
                        {audit.auditType}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(audit.status)}`}>
                        {audit.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getPriorityBadgeClass(audit.priority)}`}>
                        {audit.priority}
                      </span>
                    </td>
                    <td>{formatDate(audit.scheduledDate)}</td>
                    <td>{audit.auditee || 'N/A'}</td>
                    <td>
                      {audit.findingsCount ? (
                        <span className={styles.findingsCount}>
                          {getTotalFindings(audit)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => setSelectedAudit(audit)}
                        >
                          👁️
                        </button>
                        {!readOnly && (
                          <>
                            <button
                              className={styles.viewBtn}
                              onClick={() => handleEdit(audit)}
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.viewBtn}
                              onClick={() => handleDelete(audit._id)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {audits.length === 0 && (
              <div className={styles.emptyState}>
                <p>No audits found</p>
                {!readOnly && (
                  <button className={styles.primaryBtn} onClick={handleCreate}>
                    Schedule your first audit
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.detailView}>
            <div className={styles.detailHeader}>
              <button className={styles.backBtn} onClick={() => setSelectedAudit(null)}>
                ← Back to List
              </button>
              {!readOnly && (
                <div className={styles.detailActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(selectedAudit)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(selectedAudit._id)}>Delete</button>
                </div>
              )}
            </div>

            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h2>
                  {selectedAudit.auditNumber} - {selectedAudit.title}
                </h2>
                <div className={styles.detailBadges}>
                  <span className={`${styles.badge} ${getAuditTypeBadgeClass(selectedAudit.auditType)}`}>
                    {selectedAudit.auditType}
                  </span>
                  <span className={`${styles.badge} ${getStatusBadgeClass(selectedAudit.status)}`}>
                    {selectedAudit.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`${styles.badge} ${getPriorityBadgeClass(selectedAudit.priority)}`}>
                    {selectedAudit.priority}
                  </span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Description</h3>
                <p>{selectedAudit.description}</p>
              </div>

              <div className={styles.detailSection}>
                <h3>Audit Details</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <label>Scope:</label>
                    <span>{selectedAudit.scope}</span>
                  </div>
                  {selectedAudit.standard && (
                    <div className={styles.detailField}>
                      <label>Standard:</label>
                      <span>{selectedAudit.standard}</span>
                    </div>
                  )}
                  <div className={styles.detailField}>
                    <label>Auditee:</label>
                    <span>{selectedAudit.auditee || 'N/A'}</span>
                  </div>
                  {selectedAudit.externalOrganization && (
                    <div className={styles.detailField}>
                      <label>External Organization:</label>
                      <span>{selectedAudit.externalOrganization}</span>
                    </div>
                  )}
                  {selectedAudit.auditorName && (
                    <div className={styles.detailField}>
                      <label>Auditor Name:</label>
                      <span>{selectedAudit.auditorName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Schedule</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <label>Scheduled Date:</label>
                    <span>{formatDate(selectedAudit.scheduledDate)}</span>
                  </div>
                  {selectedAudit.startDate && (
                    <div className={styles.detailField}>
                      <label>Start Date:</label>
                      <span>{formatDate(selectedAudit.startDate)}</span>
                    </div>
                  )}
                  {selectedAudit.endDate && (
                    <div className={styles.detailField}>
                      <label>End Date:</label>
                      <span>{formatDate(selectedAudit.endDate)}</span>
                    </div>
                  )}
                  {selectedAudit.completionDate && (
                    <div className={styles.detailField}>
                      <label>Completion Date:</label>
                      <span>{formatDate(selectedAudit.completionDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div className={styles.statusSection}>
                  <h3>Update Status</h3>
                  <div className={styles.statusButtons}>
                    {['planned', 'in_progress', 'report_draft', 'report_review', 'completed', 'closed'].map(status => (
                      <button
                        key={status}
                        className={`${styles.statusBtn} ${selectedAudit.status === status ? styles.statusBtnActive : ''}`}
                        onClick={() => handleStatusChange(selectedAudit, status)}
                        disabled={selectedAudit.status === status}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAudit.leadAuditor && (
                <div className={styles.detailSection}>
                  <h3>Audit Team</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailField}>
                      <label>Lead Auditor:</label>
                      <span>
                        {selectedAudit.leadAuditor.firstName} {selectedAudit.leadAuditor.lastName}
                      </span>
                    </div>
                    {selectedAudit.auditTeam && selectedAudit.auditTeam.length > 0 && (
                      <div className={styles.detailField}>
                        <label>Team Members:</label>
                        <span>
                          {selectedAudit.auditTeam.map((member) => (
                            `${member.firstName} ${member.lastName}`
                          )).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAudit.findingsCount && (
                <div className={styles.detailSection}>
                  <h3>Findings Summary</h3>
                  <div className={styles.findingsGrid}>
                    <div className={styles.findingCard}>
                      <div className={styles.findingLabel}>Critical</div>
                      <div className={`${styles.findingValue} ${styles.findingCritical}`}>
                        {selectedAudit.findingsCount.critical}
                      </div>
                    </div>
                    <div className={styles.findingCard}>
                      <div className={styles.findingLabel}>Major</div>
                      <div className={`${styles.findingValue} ${styles.findingMajor}`}>
                        {selectedAudit.findingsCount.major}
                      </div>
                    </div>
                    <div className={styles.findingCard}>
                      <div className={styles.findingLabel}>Minor</div>
                      <div className={`${styles.findingValue} ${styles.findingMinor}`}>
                        {selectedAudit.findingsCount.minor}
                      </div>
                    </div>
                    <div className={styles.findingCard}>
                      <div className={styles.findingLabel}>Observation</div>
                      <div className={`${styles.findingValue} ${styles.findingObservation}`}>
                        {selectedAudit.findingsCount.observation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAudit.executiveSummary && (
                <div className={styles.detailSection}>
                  <h3>Executive Summary</h3>
                  <p>{selectedAudit.executiveSummary}</p>
                </div>
              )}

              {selectedAudit.followUpRequired && (
                <div className={styles.detailSection}>
                  <h3>Follow-up</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailField}>
                      <label>Follow-up Required:</label>
                      <span>Yes</span>
                    </div>
                    {selectedAudit.followUpDate && (
                      <div className={styles.detailField}>
                        <label>Follow-up Date:</label>
                        <span>{formatDate(selectedAudit.followUpDate)}</span>
                      </div>
                    )}
                    {selectedAudit.capaGenerated && (
                      <div className={styles.detailField}>
                        <label>CAPA Generated:</label>
                        <span>Yes</span>
                      </div>
                    )}
                    {selectedAudit.capaReferences && selectedAudit.capaReferences.length > 0 && (
                      <div className={styles.detailField}>
                        <label>CAPA References:</label>
                        <span>{selectedAudit.capaReferences.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditList;
