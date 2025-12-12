import React, { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { apiService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import styles from './TrainingList.module.css';

interface TrainingContent {
  _id: string;
  title: string;
  description?: string;
  contentType: string;
  contentUrl: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  order: number;
  isRequired: boolean;
}

interface Training {
  _id: string;
  trainingNumber: string;
  title: string;
  description: string;
  trainingType: string;
  category: string;
  status: string;
  priority: string;
  scheduledDate: string;
  dueDate: string;
  completionDate?: string;
  duration?: number;
  trainer?: string;
  trainerType?: string;
  targetRoles?: string[];
  assessmentRequired: boolean;
  passingScore?: number;
  certificateEnabled?: boolean;
  certificateTemplate?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    signerName?: string;
    signerTitle?: string;
    customText?: string;
  };
  certificateValidityMonths?: number;
  attendanceCount?: number;
  passedCount?: number;
  averageScore?: number;
  isRecurring: boolean;
  recurrenceInterval?: string;
  createdBy: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

interface Assignment {
  _id: string;
  trainingId: any;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
  };
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  status: string;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  certificateId?: string;
  certificateIssuedAt?: string;
  createdAt: string;
}

interface TrainingListProps {
  readOnly?: boolean;
}

const TrainingList: React.FC<TrainingListProps> = ({ readOnly = false }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [viewingTraining, setViewingTraining] = useState<Training | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'certificate' | 'assign' | 'assignments'>('details');
  const [trainingContent, setTrainingContent] = useState<TrainingContent[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [trainingAssignments, setTrainingAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainingType: 'Initial',
    category: 'GMP',
    priority: 'Medium',
    scheduledDate: '',
    dueDate: '',
    duration: '',
    trainer: '',
    trainerType: 'Internal',
    targetRoles: [] as string[],
    assessmentRequired: false,
    passingScore: '',
    isRecurring: false,
    recurrenceInterval: '',
    certificateEnabled: true,
    certificateValidityMonths: '12',
    certificateTemplate: {
      backgroundColor: '#ffffff',
      textColor: '#1a1a2e',
      borderColor: '#0066cc',
      signerName: '',
      signerTitle: '',
      customText: '',
    },
  });

  const [assignData, setAssignData] = useState({
    selectedRoles: [] as string[],
    selectedUsers: [] as string[],
    dueDate: '',
  });

  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    contentType: 'link',
    contentUrl: '',
    duration: '',
    isRequired: true,
  });

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'qa_manager', label: 'QA Manager' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'technician', label: 'Technician' },
    { value: 'trainee', label: 'Trainee' },
  ];

  useEffect(() => {
    fetchTrainings();
    fetchUsers();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTrainings();
      setTrainings(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchTrainingContent = async (trainingId: string) => {
    try {
      setContentLoading(true);
      const response = await apiService.getTrainingContent(trainingId);
      setTrainingContent(response.data || []);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchTrainingAssignments = async (trainingId: string) => {
    try {
      setAssignmentsLoading(true);
      const response = await apiService.getAllAssignments({ trainingId });
      setTrainingAssignments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleResetAssignment = async (assignmentId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reset the training for ${userName}? This will:\n\n• Reset their progress to the beginning\n• Allow them to retake the training\n• Remove their certificate (if any)\n\nThis action cannot be undone.`)) {
      return;
    }
    try {
      await apiService.resetAssignment(assignmentId);
      alert('Training assignment reset successfully');
      if (viewingTraining) {
        await fetchTrainingAssignments(viewingTraining._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reset assignment');
    }
  };

  const handleIssueCertificate = async (assignmentId: string, userName: string) => {
    if (!confirm(`Issue certificate for ${userName}?`)) return;
    try {
      await apiService.issueCertificateForAssignment(assignmentId);
      alert('Certificate issued successfully');
      if (viewingTraining) {
        await fetchTrainingAssignments(viewingTraining._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to issue certificate');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        passingScore: formData.passingScore ? parseInt(formData.passingScore) : undefined,
        certificateValidityMonths: formData.certificateValidityMonths ? parseInt(formData.certificateValidityMonths) : 12,
        // Don't send empty strings for optional enum fields
        recurrenceInterval: formData.recurrenceInterval || undefined,
        trainer: formData.trainer || undefined,
      };

      // Remove empty strings from certificateTemplate
      if (data.certificateTemplate) {
        Object.keys(data.certificateTemplate).forEach(key => {
          if (data.certificateTemplate[key] === '') {
            delete data.certificateTemplate[key];
          }
        });
      }

      console.log('Submitting training data:', data);

      if (editingTraining) {
        await apiService.updateTraining(editingTraining._id, data);
      } else {
        await apiService.createTraining(data);
      }
      setShowForm(false);
      setEditingTraining(null);
      resetForm();
      fetchTrainings();
    } catch (err: any) {
      console.error('Error saving training:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save training';
      setError(errorMsg);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setFormData({
      title: training.title,
      description: training.description,
      trainingType: training.trainingType,
      category: training.category,
      priority: training.priority,
      scheduledDate: training.scheduledDate.split('T')[0],
      dueDate: training.dueDate.split('T')[0],
      duration: training.duration?.toString() || '',
      trainer: training.trainer || '',
      trainerType: training.trainerType || 'Internal',
      targetRoles: training.targetRoles || [],
      assessmentRequired: training.assessmentRequired,
      passingScore: training.passingScore?.toString() || '',
      isRecurring: training.isRecurring,
      recurrenceInterval: training.recurrenceInterval || '',
      certificateEnabled: training.certificateEnabled !== false,
      certificateValidityMonths: training.certificateValidityMonths?.toString() || '12',
      certificateTemplate: {
        backgroundColor: training.certificateTemplate?.backgroundColor || '#ffffff',
        textColor: training.certificateTemplate?.textColor || '#1a1a2e',
        borderColor: training.certificateTemplate?.borderColor || '#0066cc',
        signerName: training.certificateTemplate?.signerName || '',
        signerTitle: training.certificateTemplate?.signerTitle || '',
        customText: training.certificateTemplate?.customText || '',
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training?')) return;
    try {
      await apiService.deleteTraining(id);
      fetchTrainings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete training');
    }
  };

  const handleStatusChange = async (training: Training, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completionDate = new Date().toISOString();
      }
      await apiService.updateTraining(training._id, updateData);
      fetchTrainings();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleViewTraining = async (training: Training) => {
    setViewingTraining(training);
    setActiveTab('details');
    await fetchTrainingContent(training._id);
    await fetchTrainingAssignments(training._id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingTraining) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('isRequired', 'true');

    try {
      setUploadProgress(10);
      await apiService.uploadTrainingContent(viewingTraining._id, formData);
      setUploadProgress(100);
      await fetchTrainingContent(viewingTraining._id);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload content');
      setUploadProgress(0);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingTraining) return;

    try {
      await apiService.addTrainingContentLink(viewingTraining._id, {
        title: contentForm.title,
        description: contentForm.description,
        contentType: contentForm.contentType,
        contentUrl: contentForm.contentUrl,
        duration: contentForm.duration ? parseInt(contentForm.duration) : undefined,
        isRequired: contentForm.isRequired,
      });
      setContentForm({
        title: '',
        description: '',
        contentType: 'link',
        contentUrl: '',
        duration: '',
        isRequired: true,
      });
      await fetchTrainingContent(viewingTraining._id);
    } catch (err: any) {
      setError(err.message || 'Failed to add content');
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await apiService.deleteTrainingContent(contentId);
      if (viewingTraining) {
        await fetchTrainingContent(viewingTraining._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete content');
    }
  };

  const handleAssignTraining = async () => {
    if (!viewingTraining) return;

    try {
      await apiService.assignTraining(
        viewingTraining._id,
        assignData.selectedUsers.length > 0 ? assignData.selectedUsers : undefined,
        assignData.selectedRoles.length > 0 ? assignData.selectedRoles : undefined,
        assignData.dueDate || undefined
      );
      alert('Training assigned successfully!');
      setAssignData({ selectedRoles: [], selectedUsers: [], dueDate: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to assign training');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      trainingType: 'Initial',
      category: 'GMP',
      priority: 'Medium',
      scheduledDate: '',
      dueDate: '',
      duration: '',
      trainer: '',
      trainerType: 'Internal',
      targetRoles: [],
      assessmentRequired: false,
      passingScore: '',
      isRecurring: false,
      recurrenceInterval: '',
      certificateEnabled: true,
      certificateValidityMonths: '12',
      certificateTemplate: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a2e',
        borderColor: '#0066cc',
        signerName: '',
        signerTitle: '',
        customText: '',
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#95a5a6',
      published: '#9b59b6',
      scheduled: '#3498db',
      in_progress: '#f39c12',
      completed: '#27ae60',
      overdue: '#e74c3c',
      cancelled: '#7f8c8d',
    };
    return colors[status] || '#95a5a6';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: '#27ae60',
      Medium: '#f39c12',
      High: '#e67e22',
      Mandatory: '#e74c3c',
    };
    return colors[priority] || '#95a5a6';
  };

  const getAssignmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: '#3498db',
      in_progress: '#f39c12',
      exam_pending: '#9b59b6',
      completed: '#27ae60',
      failed: '#e74c3c',
      overdue: '#c0392b',
    };
    return colors[status] || '#95a5a6';
  };

  const getContentIcon = (contentType: string) => {
    const icons: Record<string, string> = {
      video: '🎬',
      pdf: '📄',
      ppt: '📊',
      document: '📝',
      link: '🔗',
      scorm: '📦',
    };
    return icons[contentType] || '📁';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const toggleRole = (role: string, list: string[], setList: (roles: string[]) => void) => {
    if (list.includes(role)) {
      setList(list.filter(r => r !== role));
    } else {
      setList([...list, role]);
    }
  };

  if (loading) return <div className={styles.loading}>Loading trainings...</div>;

  return (
    <div className={styles.container}>
      <PageHeader icon={<BookOpen size={24} />} title="Training Management">
        {!readOnly && (
          <button className={styles.primaryBtn} onClick={() => { setShowForm(true); setEditingTraining(null); resetForm(); }}>
            + Create Training
          </button>
        )}
      </PageHeader>

      {error && <div className={styles.error}>{error} <button onClick={() => setError('')}>×</button></div>}

      {/* Create/Edit Training Form Modal */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
            <h2>{editingTraining ? 'Edit Training' : 'Create New Training'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter training title"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Training Type *</label>
                  <select
                    value={formData.trainingType}
                    onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                  >
                    <option value="Initial">Initial</option>
                    <option value="Refresher">Refresher</option>
                    <option value="Annual">Annual</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                    <option value="Certification">Certification</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="SOP">SOP</option>
                    <option value="GMP">GMP</option>
                    <option value="Safety">Safety</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Technical">Technical</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Mandatory">Mandatory</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Scheduled Date *</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Trainer</label>
                  <input
                    type="text"
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                    placeholder="Trainer name"
                  />
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label>Target Roles</label>
                <div className={styles.roleCheckboxes}>
                  {roles.map(role => (
                    <label key={role.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.targetRoles.includes(role.value)}
                        onChange={() => toggleRole(role.value, formData.targetRoles, (r) => setFormData({ ...formData, targetRoles: r }))}
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Enter training description"
                />
              </div>

              <div className={styles.formSection}>
                <h3>Assessment Settings</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.assessmentRequired}
                        onChange={(e) => setFormData({ ...formData, assessmentRequired: e.target.checked })}
                      />
                      Assessment Required
                    </label>
                  </div>
                  {formData.assessmentRequired && (
                    <div className={styles.formGroup}>
                      <label>Passing Score (%)</label>
                      <input
                        type="number"
                        value={formData.passingScore}
                        onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                        min="0"
                        max="100"
                        placeholder="e.g., 70"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formSection}>
                <h3>Certificate Settings</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.certificateEnabled}
                        onChange={(e) => setFormData({ ...formData, certificateEnabled: e.target.checked })}
                      />
                      Issue Certificate on Completion
                    </label>
                  </div>
                  {formData.certificateEnabled && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Certificate Validity (months)</label>
                        <input
                          type="number"
                          value={formData.certificateValidityMonths}
                          onChange={(e) => setFormData({ ...formData, certificateValidityMonths: e.target.value })}
                          min="1"
                          placeholder="12"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Signer Name</label>
                        <input
                          type="text"
                          value={formData.certificateTemplate.signerName}
                          onChange={(e) => setFormData({
                            ...formData,
                            certificateTemplate: { ...formData.certificateTemplate, signerName: e.target.value }
                          })}
                          placeholder="e.g., John Smith"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Signer Title</label>
                        <input
                          type="text"
                          value={formData.certificateTemplate.signerTitle}
                          onChange={(e) => setFormData({
                            ...formData,
                            certificateTemplate: { ...formData.certificateTemplate, signerTitle: e.target.value }
                          })}
                          placeholder="e.g., Training Director"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Border Color</label>
                        <input
                          type="color"
                          value={formData.certificateTemplate.borderColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            certificateTemplate: { ...formData.certificateTemplate, borderColor: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingTraining(null); }}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingTraining ? 'Update Training' : 'Create Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Training Detail Modal */}
      {viewingTraining && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{viewingTraining.title}</h2>
                <span className={styles.badge} style={{ backgroundColor: getStatusColor(viewingTraining.status) }}>
                  {viewingTraining.status.replace('_', ' ')}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setViewingTraining(null)}>×</button>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('content')}
              >
                Content ({trainingContent.length})
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'certificate' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('certificate')}
              >
                Certificate
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'assign' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('assign')}
              >
                Assign Users
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'assignments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('assignments')}
              >
                Assignments ({trainingAssignments.length})
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'details' && (
                <div className={styles.detailGrid}>
                  <div><strong>Training #:</strong> {viewingTraining.trainingNumber}</div>
                  <div><strong>Type:</strong> {viewingTraining.trainingType}</div>
                  <div><strong>Category:</strong> {viewingTraining.category}</div>
                  <div><strong>Priority:</strong> <span style={{ color: getPriorityColor(viewingTraining.priority) }}>{viewingTraining.priority}</span></div>
                  <div><strong>Scheduled:</strong> {new Date(viewingTraining.scheduledDate).toLocaleDateString()}</div>
                  <div><strong>Due Date:</strong> {new Date(viewingTraining.dueDate).toLocaleDateString()}</div>
                  {viewingTraining.duration && <div><strong>Duration:</strong> {viewingTraining.duration} minutes</div>}
                  {viewingTraining.trainer && <div><strong>Trainer:</strong> {viewingTraining.trainer}</div>}
                  <div><strong>Assessment:</strong> {viewingTraining.assessmentRequired ? `Yes (Pass: ${viewingTraining.passingScore}%)` : 'No'}</div>
                  <div><strong>Certificate:</strong> {viewingTraining.certificateEnabled !== false ? 'Yes' : 'No'}</div>
                  {viewingTraining.targetRoles && viewingTraining.targetRoles.length > 0 && (
                    <div className={styles.fullWidth}><strong>Target Roles:</strong> {viewingTraining.targetRoles.map(r => roles.find(role => role.value === r)?.label || r).join(', ')}</div>
                  )}
                  <div className={styles.fullWidth}>
                    <strong>Description:</strong>
                    <p>{viewingTraining.description}</p>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className={styles.contentSection}>
                  <div className={styles.uploadArea}>
                    <h4>Add Training Content</h4>
                    <div className={styles.uploadButtons}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="video/*,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip"
                        style={{ display: 'none' }}
                      />
                      <button
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📤 Upload File (Video, PDF, PPT, etc.)
                      </button>
                    </div>
                    {uploadProgress > 0 && (
                      <div className={styles.progressBar}>
                        <div className={styles.progress} style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}

                    <div className={styles.linkForm}>
                      <h5>Or Add External Link</h5>
                      <form onSubmit={handleAddLink}>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label>Title</label>
                            <input
                              type="text"
                              value={contentForm.title}
                              onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                              required
                              placeholder="Content title"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Type</label>
                            <select
                              value={contentForm.contentType}
                              onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
                            >
                              <option value="link">External Link</option>
                              <option value="video">Video URL</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>URL</label>
                            <input
                              type="url"
                              value={contentForm.contentUrl}
                              onChange={(e) => setContentForm({ ...contentForm, contentUrl: e.target.value })}
                              required
                              placeholder="https://..."
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <button type="submit" className={styles.addBtn}>Add Link</button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className={styles.contentList}>
                    <h4>Training Materials ({trainingContent.length})</h4>
                    {contentLoading ? (
                      <div className={styles.loading}>Loading content...</div>
                    ) : trainingContent.length === 0 ? (
                      <div className={styles.emptyState}>No content added yet. Upload files or add links above.</div>
                    ) : (
                      <div className={styles.contentItems}>
                        {trainingContent.map((content, index) => (
                          <div key={content._id} className={styles.contentItem}>
                            <span className={styles.contentOrder}>{index + 1}</span>
                            <span className={styles.contentIcon}>{getContentIcon(content.contentType)}</span>
                            <div className={styles.contentInfo}>
                              <strong>{content.title}</strong>
                              <span className={styles.contentMeta}>
                                {content.contentType.toUpperCase()}
                                {content.fileSize && ` • ${formatFileSize(content.fileSize)}`}
                                {content.duration && ` • ${content.duration} min`}
                                {content.isRequired && ' • Required'}
                              </span>
                            </div>
                            <div className={styles.contentActions}>
                              {content.contentUrl.startsWith('/uploads') ? (
                                <a
                                  href={apiService.getUploadUrl(content.contentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.viewBtn}
                                >
                                  View
                                </a>
                              ) : (
                                <a href={content.contentUrl} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                                  Open
                                </a>
                              )}
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteContent(content._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'certificate' && (
                <div className={styles.certificateSection}>
                  <h4>Certificate Template Settings</h4>
                  <p>Certificates will be automatically generated when users complete this training.</p>

                  <div className={styles.certificatePreview}>
                    <div
                      className={styles.certPreviewBox}
                      style={{
                        borderColor: viewingTraining.certificateTemplate?.borderColor || '#0066cc',
                        backgroundColor: viewingTraining.certificateTemplate?.backgroundColor || '#ffffff',
                        color: viewingTraining.certificateTemplate?.textColor || '#1a1a2e',
                      }}
                    >
                      <div className={styles.certRibbon} style={{ backgroundColor: viewingTraining.certificateTemplate?.borderColor || '#0066cc' }}>
                        CERTIFICATE OF COMPLETION
                      </div>
                      <h3>ABC Pharmacy</h3>
                      <p>This is to certify that</p>
                      <h2 style={{ color: viewingTraining.certificateTemplate?.borderColor || '#0066cc' }}>[Recipient Name]</h2>
                      <p>has successfully completed</p>
                      <h4>{viewingTraining.title}</h4>
                      <div className={styles.certSignatures}>
                        <div>
                          <div className={styles.sigLine}></div>
                          <p>{viewingTraining.certificateTemplate?.signerName || 'Training Administrator'}</p>
                          <small>{viewingTraining.certificateTemplate?.signerTitle || 'Quality Assurance'}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.certSettings}>
                    <p><strong>Certificate Validity:</strong> {viewingTraining.certificateValidityMonths || 12} months</p>
                    {viewingTraining.certificateTemplate?.customText && (
                      <p><strong>Custom Text:</strong> {viewingTraining.certificateTemplate.customText}</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'assign' && (
                <div className={styles.assignSection}>
                  <h4>Assign Training to Users</h4>

                  <div className={styles.assignForm}>
                    <div className={styles.formGroup}>
                      <label>Assign by Role</label>
                      <div className={styles.roleCheckboxes}>
                        {roles.map(role => (
                          <label key={role.value} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={assignData.selectedRoles.includes(role.value)}
                              onChange={() => toggleRole(role.value, assignData.selectedRoles, (r) => setAssignData({ ...assignData, selectedRoles: r }))}
                            />
                            {role.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Or Select Individual Users</label>
                      <div className={styles.userList}>
                        {users.map(user => (
                          <label key={user._id} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={assignData.selectedUsers.includes(user._id)}
                              onChange={() => {
                                if (assignData.selectedUsers.includes(user._id)) {
                                  setAssignData({ ...assignData, selectedUsers: assignData.selectedUsers.filter(id => id !== user._id) });
                                } else {
                                  setAssignData({ ...assignData, selectedUsers: [...assignData.selectedUsers, user._id] });
                                }
                              }}
                            />
                            {user.firstName} {user.lastName} ({user.role})
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Due Date (Optional)</label>
                      <input
                        type="date"
                        value={assignData.dueDate}
                        onChange={(e) => setAssignData({ ...assignData, dueDate: e.target.value })}
                      />
                    </div>

                    <button
                      className={styles.submitBtn}
                      onClick={handleAssignTraining}
                      disabled={assignData.selectedRoles.length === 0 && assignData.selectedUsers.length === 0}
                    >
                      Assign Training
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className={styles.assignmentsSection}>
                  <h4>User Assignments</h4>
                  <p className={styles.assignmentsInfo}>
                    Manage user training assignments. You can reset a user's progress to allow them to retake the training,
                    or issue certificates for completed trainings that don't have one yet.
                  </p>

                  {assignmentsLoading ? (
                    <div className={styles.loading}>Loading assignments...</div>
                  ) : trainingAssignments.length === 0 ? (
                    <div className={styles.emptyState}>
                      No users have been assigned to this training yet. Use the "Assign Users" tab to assign users.
                    </div>
                  ) : (
                    <div className={styles.assignmentsTable}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Completed</th>
                            <th>Certificate</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trainingAssignments.map((assignment) => (
                            <tr key={assignment._id}>
                              <td>{assignment.userId.firstName} {assignment.userId.lastName}</td>
                              <td>{assignment.userId.email}</td>
                              <td>{assignment.userId.role}</td>
                              <td>
                                <span
                                  className={styles.badge}
                                  style={{ backgroundColor: getAssignmentStatusColor(assignment.status) }}
                                >
                                  {assignment.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                              <td>
                                {assignment.completedAt
                                  ? new Date(assignment.completedAt).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td>
                                {assignment.certificateId ? (
                                  <span className={styles.certificateIssued}>✓ Issued</span>
                                ) : assignment.status === 'completed' ? (
                                  <span className={styles.certificateMissing}>⚠ Missing</span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className={styles.actions}>
                                <button
                                  className={styles.resetBtn}
                                  onClick={() => handleResetAssignment(
                                    assignment._id,
                                    `${assignment.userId.firstName} ${assignment.userId.lastName}`
                                  )}
                                  title="Reset training to allow user to retake"
                                >
                                  Reset
                                </button>
                                {assignment.status === 'completed' && !assignment.certificateId && (
                                  <button
                                    className={styles.issueCertBtn}
                                    onClick={() => handleIssueCertificate(
                                      assignment._id,
                                      `${assignment.userId.firstName} ${assignment.userId.lastName}`
                                    )}
                                    title="Issue certificate for this completed training"
                                  >
                                    Issue Cert
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training List Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Training #</th>
              <th>Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainings.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>No trainings found. Create your first training!</td>
              </tr>
            ) : (
              trainings.map((training) => (
                <tr key={training._id}>
                  <td>{training.trainingNumber}</td>
                  <td>{training.title}</td>
                  <td>{training.trainingType}</td>
                  <td>{training.category}</td>
                  <td>
                    <span className={styles.badge} style={{ backgroundColor: getPriorityColor(training.priority) }}>
                      {training.priority}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badge} style={{ backgroundColor: getStatusColor(training.status) }}>
                      {training.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(training.dueDate).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button className={styles.viewBtn} onClick={() => handleViewTraining(training)}>View</button>
                    {!readOnly && (
                      <>
                        <button className={styles.editBtn} onClick={() => handleEdit(training)}>Edit</button>
                        {training.status === 'draft' && (
                          <button className={styles.statusBtn} onClick={() => handleStatusChange(training, 'published')}>Publish</button>
                        )}
                        <button className={styles.deleteBtn} onClick={() => handleDelete(training._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingList;
