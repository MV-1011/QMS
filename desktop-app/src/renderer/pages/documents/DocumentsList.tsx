import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import DocumentForm from './DocumentForm';
import DocumentViewer from './DocumentViewer';
import styles from './DocumentsList.module.css';

interface Document {
  _id: string;
  title: string;
  documentType: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const DocumentsList: React.FC = () => {
  useAuth(); // Auth context for access control
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await apiService.getDocuments(params);
      setDocuments(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setShowForm(true);
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setShowForm(true);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewer(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiService.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setSelectedDocument(null);
    if (refresh) {
      loadDocuments();
    }
  };

  const handleViewerClose = () => {
    setShowViewer(false);
    setSelectedDocument(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.badgeApproved;
      case 'review':
        return styles.badgeReview;
      case 'draft':
        return styles.badgeDraft;
      case 'archived':
        return styles.badgeArchived;
      default:
        return '';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        doc.title.toLowerCase().includes(term) ||
        doc.documentType.toLowerCase().includes(term) ||
        doc.version.toLowerCase().includes(term)
      );
    }
    return true;
  });

  if (showForm) {
    return (
      <DocumentForm
        document={selectedDocument}
        onClose={handleFormClose}
      />
    );
  }

  if (showViewer && selectedDocument) {
    return (
      <DocumentViewer
        documentId={selectedDocument._id}
        onClose={handleViewerClose}
        onEdit={() => {
          setShowViewer(false);
          setShowForm(true);
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Document Control</h2>
          <p className={styles.subtitle}>Manage SOPs, policies, forms, and protocols</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleCreate}>
          + New Document
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="SOP">SOP</option>
          <option value="Policy">Policy</option>
          <option value="Form">Form</option>
          <option value="Protocol">Protocol</option>
          <option value="Record">Record</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading documents...</div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{documents.length}</span>
              <span className={styles.statLabel}>Total Documents</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {documents.filter((d) => d.status === 'approved').length}
              </span>
              <span className={styles.statLabel}>Approved</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {documents.filter((d) => d.status === 'review').length}
              </span>
              <span className={styles.statLabel}>Under Review</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {documents.filter((d) => d.status === 'draft').length}
              </span>
              <span className={styles.statLabel}>Drafts</span>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className={styles.empty}>
              <p>No documents found</p>
              <button className={styles.btnSecondary} onClick={handleCreate}>
                Create your first document
              </button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <button
                          className={styles.linkBtn}
                          onClick={() => handleView(doc)}
                        >
                          {doc.title}
                        </button>
                      </td>
                      <td>{doc.documentType}</td>
                      <td>{doc.version}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        {doc.createdBy
                          ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}`
                          : 'N/A'}
                      </td>
                      <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleView(doc)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleEdit(doc)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleDelete(doc._id)}
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

export default DocumentsList;
