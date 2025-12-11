import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './ChangeControlList.module.css';

interface ChangeControl {
  _id: string;
  changeNumber: string;
  title: string;
  changeType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'initiated' | 'assessment' | 'approval_pending' | 'approved' | 'implementation' | 'verification' | 'completed' | 'rejected' | 'cancelled';
  description: string;
  impactAssessment?: string;
  riskLevel?: string;
  requestorId?: {
    firstName: string;
    lastName: string;
  };
  implementationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  changeType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  impactAssessment: string;
  riskLevel: string;
  implementationDate: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  changeType: 'Process Change',
  priority: 'Medium',
  impactAssessment: '',
  riskLevel: 'Medium',
  implementationDate: '',
};

const CHANGE_TYPES = [
  'Process Change',
  'Equipment Upgrade',
  'Document Change',
  'System Upgrade',
  'Facility Change',
  'Supplier Change',
  'Protocol Change',
  'Maintenance',
  'Technology Implementation',
  'Emergency Repair',
];

const ChangeControlList: React.FC = () => {
  const [changeControls, setChangeControls] = useState<ChangeControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCC, setSelectedCC] = useState<ChangeControl | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadChangeControls();
  }, [statusFilter, priorityFilter]);

  const loadChangeControls = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await apiService.getChangeControls(params);
      setChangeControls(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load change controls');
      console.error('Error loading change controls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (cc: ChangeControl) => {
    setSelectedCC(cc);
  };

  const handleCloseDetails = () => {
    setSelectedCC(null);
  };

  const handleCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (cc: ChangeControl) => {
    setFormData({
      title: cc.title,
      description: cc.description,
      changeType: cc.changeType,
      priority: cc.priority,
      impactAssessment: cc.impactAssessment || '',
      riskLevel: cc.riskLevel || 'Medium',
      implementationDate: cc.implementationDate ? cc.implementationDate.split('T')[0] : '',
    });
    setEditingId(cc._id);
    setShowForm(true);
    setSelectedCC(null);
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
    setError('');

    try {
      if (editingId) {
        await apiService.updateChangeControl(editingId, formData);
      } else {
        await apiService.createChangeControl(formData);
      }
      handleCloseForm();
      loadChangeControls();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save change control');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this change control?')) return;

    try {
      await apiService.deleteChangeControl(id);
      loadChangeControls();
      if (selectedCC?._id === id) {
        setSelectedCC(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete change control');
    }
  };

  const handleStatusChange = async (cc: ChangeControl, newStatus: string) => {
    try {
      await apiService.updateChangeControl(cc._id, { status: newStatus });
      loadChangeControls();
      if (selectedCC?._id === cc._id) {
        setSelectedCC({ ...selectedCC, status: newStatus as any });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.badgeCompleted;
      case 'approved':
      case 'implementation':
      case 'verification':
        return styles.badgeApproved;
      case 'approval_pending':
      case 'assessment':
        return styles.badgePending;
      case 'initiated':
        return styles.badgeDraft;
      case 'rejected':
      case 'cancelled':
        return styles.badgeRejected;
      default:
        return '';
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

  const filteredChangeControls = changeControls.filter((cc) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        cc.title.toLowerCase().includes(term) ||
        cc.changeNumber.toLowerCase().includes(term) ||
        cc.changeType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Form view
  if (showForm) {
    return (
      <div className={styles.container}>
        <div className={styles.detailsHeader}>
          <button className={styles.backBtn} onClick={handleCloseForm}>
            ← Back to List
          </button>
          <h2>{editingId ? 'Edit Change Control' : 'New Change Control'}</h2>
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
              placeholder="Enter change control title"
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
              rows={4}
              placeholder="Describe the change in detail"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="changeType">Change Type *</label>
              <select
                id="changeType"
                name="changeType"
                value={formData.changeType}
                onChange={handleInputChange}
                required
              >
                {CHANGE_TYPES.map(type => (
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="riskLevel">Risk Level</label>
              <select
                id="riskLevel"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="implementationDate">Target Implementation Date</label>
              <input
                type="date"
                id="implementationDate"
                name="implementationDate"
                value={formData.implementationDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="impactAssessment">Impact Assessment</label>
            <textarea
              id="impactAssessment"
              name="impactAssessment"
              value={formData.impactAssessment}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe the potential impact of this change"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={handleCloseForm}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Detail view
  if (selectedCC) {
    return (
      <div className={styles.container}>
        <div className={styles.detailsHeader}>
          <button className={styles.backBtn} onClick={handleCloseDetails}>
            ← Back to List
          </button>
          <h2>{selectedCC.changeNumber}</h2>
          <div className={styles.detailsActions}>
            <button className={styles.btnSecondary} onClick={() => handleEdit(selectedCC)}>
              Edit
            </button>
            <button className={styles.btnDanger} onClick={() => handleDelete(selectedCC._id)}>
              Delete
            </button>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <div className={styles.detailsSection}>
            <h3>{selectedCC.title}</h3>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${getStatusBadgeClass(selectedCC.status)}`}>
                {selectedCC.status.replace('_', ' ')}
              </span>
              <span className={`${styles.badge} ${getPriorityBadgeClass(selectedCC.priority)}`}>
                {selectedCC.priority}
              </span>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h4>Description</h4>
            <p>{selectedCC.description}</p>
          </div>

          {selectedCC.impactAssessment && (
            <div className={styles.detailsSection}>
              <h4>Impact Assessment</h4>
              <p>{selectedCC.impactAssessment}</p>
            </div>
          )}

          <div className={styles.detailsGrid}>
            <div className={styles.detailsItem}>
              <label>Change Type:</label>
              <span>{selectedCC.changeType}</span>
            </div>
            <div className={styles.detailsItem}>
              <label>Risk Level:</label>
              <span>{selectedCC.riskLevel || 'Not assessed'}</span>
            </div>
            <div className={styles.detailsItem}>
              <label>Requestor:</label>
              <span>
                {selectedCC.requestorId
                  ? `${selectedCC.requestorId.firstName} ${selectedCC.requestorId.lastName}`
                  : 'N/A'}
              </span>
            </div>
            {selectedCC.implementationDate && (
              <div className={styles.detailsItem}>
                <label>Implementation Date:</label>
                <span>{new Date(selectedCC.implementationDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className={styles.detailsItem}>
              <label>Created:</label>
              <span>{new Date(selectedCC.createdAt).toLocaleDateString()}</span>
            </div>
            <div className={styles.detailsItem}>
              <label>Last Updated:</label>
              <span>{new Date(selectedCC.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <h4>Update Status</h4>
            <div className={styles.statusButtons}>
              {['initiated', 'assessment', 'approval_pending', 'approved', 'implementation', 'verification', 'completed', 'rejected'].map(status => (
                <button
                  key={status}
                  className={`${styles.statusBtn} ${selectedCC.status === status ? styles.statusBtnActive : ''}`}
                  onClick={() => handleStatusChange(selectedCC, status)}
                  disabled={selectedCC.status === status}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Change Control</h2>
          <p className={styles.subtitle}>Manage changes to processes, systems, and documents</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleCreate}>
          + New Change Control
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search change controls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="initiated">Initiated</option>
          <option value="assessment">Assessment</option>
          <option value="approval_pending">Approval Pending</option>
          <option value="approved">Approved</option>
          <option value="implementation">Implementation</option>
          <option value="verification">Verification</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading change controls...</div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{changeControls.length}</span>
              <span className={styles.statLabel}>Total Changes</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {changeControls.filter((c) => c.status === 'approval_pending').length}
              </span>
              <span className={styles.statLabel}>Pending Approval</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {changeControls.filter((c) => c.status === 'implementation').length}
              </span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {changeControls.filter((c) => c.status === 'completed').length}
              </span>
              <span className={styles.statLabel}>Completed</span>
            </div>
          </div>

          {filteredChangeControls.length === 0 ? (
            <div className={styles.empty}>
              <p>No change controls found</p>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                Create your first change control
              </button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Change #</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requestor</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChangeControls.map((cc) => (
                    <tr key={cc._id}>
                      <td>
                        <button
                          className={styles.linkBtn}
                          onClick={() => handleView(cc)}
                        >
                          {cc.changeNumber}
                        </button>
                      </td>
                      <td className={styles.titleCell}>{cc.title}</td>
                      <td>{cc.changeType}</td>
                      <td>
                        <span className={`${styles.badge} ${getPriorityBadgeClass(cc.priority)}`}>
                          {cc.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(cc.status)}`}>
                          {cc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {cc.requestorId
                          ? `${cc.requestorId.firstName} ${cc.requestorId.lastName}`
                          : 'N/A'}
                      </td>
                      <td>{new Date(cc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleView(cc)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleEdit(cc)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleDelete(cc._id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChangeControlList;
