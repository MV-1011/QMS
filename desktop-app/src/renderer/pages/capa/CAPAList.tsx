import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import apiService from '../../services/api';
import PageHeader from '../../components/PageHeader';
import styles from './CAPAList.module.css';

interface CAPA {
  _id: string;
  capaNumber: string;
  title: string;
  description: string;
  type: 'Corrective' | 'Preventive' | 'Both';
  source: string;
  sourceReference: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  rootCause?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  targetDate?: string;
  completionDate?: string;
  effectivenessCheck?: {
    required: boolean;
    scheduledDate?: string;
    completedDate?: string;
    result?: string;
    notes?: string;
  };
  actionPlan?: Array<{
    action: string;
    responsible: string;
    dueDate: string;
    status: string;
    completedDate?: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  type: 'Corrective' | 'Preventive' | 'Both';
  source: string;
  sourceReference: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  rootCause: string;
  correctiveActions: string;
  preventiveActions: string;
  targetDate: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  type: 'Corrective',
  source: 'Deviation',
  sourceReference: '',
  priority: 'Medium',
  rootCause: '',
  correctiveActions: '',
  preventiveActions: '',
  targetDate: '',
};

const SOURCES = [
  'Deviation',
  'Audit Finding',
  'Customer Complaint',
  'OOS Result',
  'Risk Assessment',
  'Management Review',
  'Regulatory Inspection',
  'Internal Assessment',
  'Other',
];

interface CAPAListProps {
  readOnly?: boolean;
}

const CAPAList: React.FC<CAPAListProps> = ({ readOnly = false }) => {
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadCAPAs();
  }, [statusFilter, priorityFilter]);

  const loadCAPAs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await apiService.getCAPAs(params);
      setCapas(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load CAPAs');
      console.error('Error loading CAPAs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (capa: CAPA) => {
    setFormData({
      title: capa.title,
      description: capa.description,
      type: capa.type,
      source: capa.source,
      sourceReference: capa.sourceReference || '',
      priority: capa.priority,
      rootCause: capa.rootCause || '',
      correctiveActions: capa.correctiveActions || '',
      preventiveActions: capa.preventiveActions || '',
      targetDate: capa.targetDate ? capa.targetDate.split('T')[0] : '',
    });
    setEditingId(capa._id);
    setShowForm(true);
    setSelectedCAPA(null);
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
        await apiService.updateCAPA(editingId, formData);
      } else {
        await apiService.createCAPA(formData);
      }
      handleCloseForm();
      loadCAPAs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save CAPA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CAPA?')) return;

    try {
      await apiService.deleteCAPA(id);
      loadCAPAs();
      if (selectedCAPA?._id === id) {
        setSelectedCAPA(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete CAPA');
    }
  };

  const handleStatusChange = async (capa: CAPA, newStatus: string) => {
    try {
      await apiService.updateCAPA(capa._id, { status: newStatus });
      loadCAPAs();
      if (selectedCAPA?._id === capa._id) {
        setSelectedCAPA({ ...selectedCAPA, status: newStatus });
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
      case 'open':
        return styles.statusOpen;
      case 'in_progress':
        return styles.statusInProgress;
      case 'pending_approval':
        return styles.statusPending;
      case 'approved':
        return styles.statusApproved;
      case 'implementation':
        return styles.statusImplementation;
      case 'effectiveness_check':
        return styles.statusCheck;
      case 'completed':
        return styles.statusCompleted;
      case 'closed':
        return styles.statusClosed;
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStats = () => {
    const total = capas.length;
    const inProgress = capas.filter(
      (c) => c.status === 'in_progress' || c.status === 'implementation'
    ).length;
    const critical = capas.filter((c) => c.priority === 'Critical').length;
    const completed = capas.filter((c) => c.status === 'completed' || c.status === 'closed')
      .length;

    return { total, inProgress, critical, completed };
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
          <h2>{editingId ? 'Edit CAPA' : 'New CAPA'}</h2>
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
              placeholder="CAPA title"
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
              placeholder="Describe the issue requiring corrective/preventive action"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="Corrective">Corrective</option>
                <option value="Preventive">Preventive</option>
                <option value="Both">Both</option>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="source">Source *</label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                required
              >
                {SOURCES.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sourceReference">Source Reference</label>
              <input
                type="text"
                id="sourceReference"
                name="sourceReference"
                value={formData.sourceReference}
                onChange={handleInputChange}
                placeholder="e.g., DEV-2025-001"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="targetDate">Target Completion Date</label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rootCause">Root Cause Analysis</label>
            <textarea
              id="rootCause"
              name="rootCause"
              value={formData.rootCause}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe the root cause of the issue"
            />
          </div>

          {(formData.type === 'Corrective' || formData.type === 'Both') && (
            <div className={styles.formGroup}>
              <label htmlFor="correctiveActions">Corrective Actions</label>
              <textarea
                id="correctiveActions"
                name="correctiveActions"
                value={formData.correctiveActions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the corrective actions to be taken"
              />
            </div>
          )}

          {(formData.type === 'Preventive' || formData.type === 'Both') && (
            <div className={styles.formGroup}>
              <label htmlFor="preventiveActions">Preventive Actions</label>
              <textarea
                id="preventiveActions"
                name="preventiveActions"
                value={formData.preventiveActions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the preventive actions to be taken"
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} onClick={handleCloseForm}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create CAPA')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading CAPAs...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader icon={<Wrench size={24} />} title="CAPA Management" subtitle="Corrective and Preventive Actions">
        {!readOnly && (
          <button className={styles.primaryBtn} onClick={handleCreate}>+ New CAPA</button>
        )}
      </PageHeader>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total CAPAs</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>In Progress</div>
          <div className={styles.statValue}>{stats.inProgress}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Critical</div>
          <div className={styles.statValue}>{stats.critical}</div>
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="implementation">Implementation</option>
            <option value="effectiveness_check">Effectiveness Check</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
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
        {!selectedCAPA ? (
          <div className={styles.listView}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CAPA #</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Target Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {capas.map((capa) => (
                  <tr key={capa._id}>
                    <td>
                      <strong>{capa.capaNumber}</strong>
                    </td>
                    <td>{capa.title}</td>
                    <td>
                      <span className={styles.typeBadge}>{capa.type}</span>
                    </td>
                    <td>{capa.source}</td>
                    <td>
                      <span className={`${styles.badge} ${getPriorityBadgeClass(capa.priority)}`}>
                        {capa.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(capa.status)}`}>
                        {capa.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {capa.assignedTo
                        ? `${capa.assignedTo.firstName} ${capa.assignedTo.lastName}`
                        : 'Unassigned'}
                    </td>
                    <td>{formatDate(capa.targetDate)}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => setSelectedCAPA(capa)}
                        >
                          👁️
                        </button>
                        {!readOnly && (
                          <>
                            <button
                              className={styles.viewBtn}
                              onClick={() => handleEdit(capa)}
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.viewBtn}
                              onClick={() => handleDelete(capa._id)}
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

            {capas.length === 0 && (
              <div className={styles.emptyState}>
                <p>No CAPAs found</p>
                {!readOnly && (
                  <button className={styles.primaryBtn} onClick={handleCreate}>
                    Create your first CAPA
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.detailView}>
            <div className={styles.detailHeader}>
              <button className={styles.backBtn} onClick={() => setSelectedCAPA(null)}>
                ← Back to List
              </button>
              {!readOnly && (
                <div className={styles.detailActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(selectedCAPA)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(selectedCAPA._id)}>Delete</button>
                </div>
              )}
            </div>

            <div className={styles.detailContent}>
              <div className={styles.detailSection}>
                <h2>
                  {selectedCAPA.capaNumber} - {selectedCAPA.title}
                </h2>
                <div className={styles.detailBadges}>
                  <span className={`${styles.badge} ${getPriorityBadgeClass(selectedCAPA.priority)}`}>
                    {selectedCAPA.priority}
                  </span>
                  <span className={`${styles.badge} ${getStatusBadgeClass(selectedCAPA.status)}`}>
                    {selectedCAPA.status.replace(/_/g, ' ')}
                  </span>
                  <span className={styles.typeBadge}>{selectedCAPA.type}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Description</h3>
                <p>{selectedCAPA.description}</p>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <label>Source:</label>
                  <span>{selectedCAPA.source}</span>
                </div>
                <div className={styles.detailField}>
                  <label>Source Reference:</label>
                  <span>{selectedCAPA.sourceReference || 'N/A'}</span>
                </div>
                <div className={styles.detailField}>
                  <label>Assigned To:</label>
                  <span>
                    {selectedCAPA.assignedTo
                      ? `${selectedCAPA.assignedTo.firstName} ${selectedCAPA.assignedTo.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
                <div className={styles.detailField}>
                  <label>Target Date:</label>
                  <span>{formatDate(selectedCAPA.targetDate)}</span>
                </div>
                {selectedCAPA.completionDate && (
                  <div className={styles.detailField}>
                    <label>Completion Date:</label>
                    <span>{formatDate(selectedCAPA.completionDate)}</span>
                  </div>
                )}
              </div>

              {selectedCAPA.rootCause && (
                <div className={styles.detailSection}>
                  <h3>Root Cause Analysis</h3>
                  <p>{selectedCAPA.rootCause}</p>
                </div>
              )}

              {selectedCAPA.correctiveActions && (
                <div className={styles.detailSection}>
                  <h3>Corrective Actions</h3>
                  <p>{selectedCAPA.correctiveActions}</p>
                </div>
              )}

              {selectedCAPA.preventiveActions && (
                <div className={styles.detailSection}>
                  <h3>Preventive Actions</h3>
                  <p>{selectedCAPA.preventiveActions}</p>
                </div>
              )}

              {!readOnly && (
                <div className={styles.statusSection}>
                  <h3>Update Status</h3>
                  <div className={styles.statusButtons}>
                    {['open', 'in_progress', 'pending_approval', 'approved', 'implementation', 'effectiveness_check', 'completed', 'closed'].map(status => (
                      <button
                        key={status}
                        className={`${styles.statusBtn} ${selectedCAPA.status === status ? styles.statusBtnActive : ''}`}
                        onClick={() => handleStatusChange(selectedCAPA, status)}
                        disabled={selectedCAPA.status === status}
                      >
                        {status.replace(/_/g, ' ')}
                    </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCAPA.actionPlan && Array.isArray(selectedCAPA.actionPlan) && selectedCAPA.actionPlan.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Action Plan</h3>
                  <table className={styles.actionTable}>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Responsible</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCAPA.actionPlan.map((action, index) => (
                        <tr key={index}>
                          <td>{action.action}</td>
                          <td>{action.responsible}</td>
                          <td>{formatDate(action.dueDate)}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                action.status === 'Completed'
                                  ? styles.statusCompleted
                                  : styles.statusInProgress
                              }`}
                            >
                              {action.status}
                            </span>
                          </td>
                          <td>{formatDate(action.completedDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedCAPA.effectivenessCheck?.required && (
                <div className={styles.detailSection}>
                  <h3>Effectiveness Check</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailField}>
                      <label>Scheduled Date:</label>
                      <span>
                        {formatDate(selectedCAPA.effectivenessCheck.scheduledDate)}
                      </span>
                    </div>
                    {selectedCAPA.effectivenessCheck.completedDate && (
                      <div className={styles.detailField}>
                        <label>Completed Date:</label>
                        <span>
                          {formatDate(selectedCAPA.effectivenessCheck.completedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedCAPA.effectivenessCheck.result && (
                    <>
                      <h4>Result</h4>
                      <p>{selectedCAPA.effectivenessCheck.result}</p>
                    </>
                  )}
                  {selectedCAPA.effectivenessCheck.notes && (
                    <>
                      <h4>Notes</h4>
                      <p>{selectedCAPA.effectivenessCheck.notes}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CAPAList;
