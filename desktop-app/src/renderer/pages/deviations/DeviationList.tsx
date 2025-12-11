import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './DeviationList.module.css';

interface Deviation {
  _id: string;
  deviationNumber: string;
  title: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Critical';
  category: string;
  status: 'open' | 'investigation' | 'capa_required' | 'capa_in_progress' | 'pending_closure' | 'closed' | 'rejected';
  occurrenceDate: string;
  detectedBy?: {
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  productAffected?: string;
  batchNumber?: string;
  immediateAction?: string;
  rootCause?: string;
  investigation?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  severity: 'Minor' | 'Major' | 'Critical';
  occurrenceDate: string;
  productAffected: string;
  batchNumber: string;
  immediateAction: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  category: 'Environmental',
  severity: 'Minor',
  occurrenceDate: new Date().toISOString().split('T')[0],
  productAffected: '',
  batchNumber: '',
  immediateAction: '',
};

const CATEGORIES = [
  'Environmental',
  'Equipment',
  'Documentation',
  'Labeling',
  'Inventory',
  'Compounding',
  'Dispensing Error',
  'Training',
  'Water System',
  'Facility',
  'Supply Chain',
  'Other',
];

const DeviationList: React.FC = () => {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDev, setSelectedDev] = useState<Deviation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDeviations();
  }, [statusFilter, severityFilter]);

  const loadDeviations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const response = await apiService.getDeviations(params);
      setDeviations(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deviations');
      console.error('Error loading deviations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (dev: Deviation) => {
    setSelectedDev(dev);
  };

  const handleCloseDetails = () => {
    setSelectedDev(null);
  };

  const handleCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (dev: Deviation) => {
    setFormData({
      title: dev.title,
      description: dev.description,
      category: dev.category,
      severity: dev.severity,
      occurrenceDate: dev.occurrenceDate ? dev.occurrenceDate.split('T')[0] : '',
      productAffected: dev.productAffected || '',
      batchNumber: dev.batchNumber || '',
      immediateAction: dev.immediateAction || '',
    });
    setEditingId(dev._id);
    setShowForm(true);
    setSelectedDev(null);
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
        await apiService.updateDeviation(editingId, formData);
      } else {
        await apiService.createDeviation(formData);
      }
      handleCloseForm();
      loadDeviations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save deviation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deviation?')) return;

    try {
      await apiService.deleteDeviation(id);
      loadDeviations();
      if (selectedDev?._id === id) {
        setSelectedDev(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete deviation');
    }
  };

  const handleStatusChange = async (dev: Deviation, newStatus: string) => {
    try {
      await apiService.updateDeviation(dev._id, { status: newStatus });
      loadDeviations();
      if (selectedDev?._id === dev._id) {
        setSelectedDev({ ...selectedDev, status: newStatus as any });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'closed':
        return styles.badgeClosed;
      case 'open':
        return styles.badgeOpen;
      case 'investigation':
        return styles.badgeInvestigation;
      case 'capa_required':
      case 'capa_in_progress':
        return styles.badgeCapa;
      case 'pending_closure':
        return styles.badgePending;
      case 'rejected':
        return styles.badgeRejected;
      default:
        return '';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return styles.severityCritical;
      case 'Major':
        return styles.severityMajor;
      case 'Minor':
        return styles.severityMinor;
      default:
        return '';
    }
  };

  const filteredDeviations = deviations.filter((dev) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        dev.title.toLowerCase().includes(term) ||
        dev.deviationNumber.toLowerCase().includes(term) ||
        dev.category.toLowerCase().includes(term)
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
          <h2>{editingId ? 'Edit Deviation' : 'Report New Deviation'}</h2>
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
              placeholder="Brief description of the deviation"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Provide a detailed description of what happened"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="severity">Severity *</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                required
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="occurrenceDate">Date of Occurrence *</label>
              <input
                type="date"
                id="occurrenceDate"
                name="occurrenceDate"
                value={formData.occurrenceDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="batchNumber">Batch/Lot Number</label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                placeholder="If applicable"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="productAffected">Product(s) Affected</label>
            <input
              type="text"
              id="productAffected"
              name="productAffected"
              value={formData.productAffected}
              onChange={handleInputChange}
              placeholder="List any products affected by this deviation"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="immediateAction">Immediate Action Taken</label>
            <textarea
              id="immediateAction"
              name="immediateAction"
              value={formData.immediateAction}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe any immediate actions taken to address the deviation"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={handleCloseForm}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Report Deviation')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Detail view
  if (selectedDev) {
    return (
      <div className={styles.container}>
        <div className={styles.detailsHeader}>
          <button className={styles.backBtn} onClick={handleCloseDetails}>
            ← Back to List
          </button>
          <h2>{selectedDev.deviationNumber}</h2>
          <div className={styles.detailsActions}>
            <button className={styles.btnSecondary} onClick={() => handleEdit(selectedDev)}>
              Edit
            </button>
            <button className={styles.btnDanger} onClick={() => handleDelete(selectedDev._id)}>
              Delete
            </button>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <div className={styles.detailsSection}>
            <h3>{selectedDev.title}</h3>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${getStatusBadgeClass(selectedDev.status)}`}>
                {selectedDev.status.replace('_', ' ')}
              </span>
              <span className={`${styles.badge} ${getSeverityBadgeClass(selectedDev.severity)}`}>
                {selectedDev.severity}
              </span>
              <span className={styles.categoryBadge}>{selectedDev.category}</span>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h4>Description</h4>
            <p>{selectedDev.description}</p>
          </div>

          {selectedDev.immediateAction && (
            <div className={styles.detailsSection}>
              <h4>Immediate Action Taken</h4>
              <p>{selectedDev.immediateAction}</p>
            </div>
          )}

          {selectedDev.investigation && (
            <div className={styles.detailsSection}>
              <h4>Investigation</h4>
              <p>{selectedDev.investigation}</p>
            </div>
          )}

          {selectedDev.rootCause && (
            <div className={styles.detailsSection}>
              <h4>Root Cause</h4>
              <p>{selectedDev.rootCause}</p>
            </div>
          )}

          <div className={styles.detailsGrid}>
            <div className={styles.detailsItem}>
              <label>Occurrence Date:</label>
              <span>{new Date(selectedDev.occurrenceDate).toLocaleDateString()}</span>
            </div>
            <div className={styles.detailsItem}>
              <label>Detected By:</label>
              <span>
                {selectedDev.detectedBy
                  ? `${selectedDev.detectedBy.firstName} ${selectedDev.detectedBy.lastName}`
                  : 'N/A'}
              </span>
            </div>
            {selectedDev.assignedTo && (
              <div className={styles.detailsItem}>
                <label>Assigned To:</label>
                <span>{`${selectedDev.assignedTo.firstName} ${selectedDev.assignedTo.lastName}`}</span>
              </div>
            )}
            {selectedDev.productAffected && (
              <div className={styles.detailsItem}>
                <label>Product Affected:</label>
                <span>{selectedDev.productAffected}</span>
              </div>
            )}
            {selectedDev.batchNumber && (
              <div className={styles.detailsItem}>
                <label>Batch Number:</label>
                <span>{selectedDev.batchNumber}</span>
              </div>
            )}
            <div className={styles.detailsItem}>
              <label>Created:</label>
              <span>{new Date(selectedDev.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <h4>Update Status</h4>
            <div className={styles.statusButtons}>
              {['open', 'investigation', 'capa_required', 'capa_in_progress', 'pending_closure', 'closed'].map(status => (
                <button
                  key={status}
                  className={`${styles.statusBtn} ${selectedDev.status === status ? styles.statusBtnActive : ''}`}
                  onClick={() => handleStatusChange(selectedDev, status)}
                  disabled={selectedDev.status === status}
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
          <h2>Deviations</h2>
          <p className={styles.subtitle}>Track and investigate quality deviations and non-conformances</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleCreate}>
          + Report Deviation
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search deviations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Severities</option>
          <option value="Minor">Minor</option>
          <option value="Major">Major</option>
          <option value="Critical">Critical</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigation">Investigation</option>
          <option value="capa_required">CAPA Required</option>
          <option value="capa_in_progress">CAPA In Progress</option>
          <option value="pending_closure">Pending Closure</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading deviations...</div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{deviations.length}</span>
              <span className={styles.statLabel}>Total Deviations</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {deviations.filter((d) => d.status === 'open' || d.status === 'investigation').length}
              </span>
              <span className={styles.statLabel}>Under Investigation</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {deviations.filter((d) => d.severity === 'Critical').length}
              </span>
              <span className={styles.statLabel}>Critical</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {deviations.filter((d) => d.status === 'closed').length}
              </span>
              <span className={styles.statLabel}>Closed</span>
            </div>
          </div>

          {filteredDeviations.length === 0 ? (
            <div className={styles.empty}>
              <p>No deviations found</p>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                Report your first deviation
              </button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Deviation #</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Detected By</th>
                    <th>Occurrence Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeviations.map((dev) => (
                    <tr key={dev._id}>
                      <td>
                        <button
                          className={styles.linkBtn}
                          onClick={() => handleView(dev)}
                        >
                          {dev.deviationNumber}
                        </button>
                      </td>
                      <td className={styles.titleCell}>{dev.title}</td>
                      <td>{dev.category}</td>
                      <td>
                        <span className={`${styles.badge} ${getSeverityBadgeClass(dev.severity)}`}>
                          {dev.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(dev.status)}`}>
                          {dev.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {dev.detectedBy
                          ? `${dev.detectedBy.firstName} ${dev.detectedBy.lastName}`
                          : 'N/A'}
                      </td>
                      <td>{new Date(dev.occurrenceDate).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleView(dev)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleEdit(dev)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleDelete(dev._id)}
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

export default DeviationList;
