import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import styles from './DocumentViewer.module.css';

interface DocumentViewerProps {
  documentId: string;
  onClose: () => void;
  onEdit: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  onClose,
  onEdit,
}) => {
  const { user } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDocument(documentId);
      setDocument(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!window.confirm(`Change document status to ${newStatus}?`)) {
      return;
    }

    try {
      const payload: any = { status: newStatus };

      // If approving, add approval metadata
      if (newStatus === 'approved') {
        payload.approvedAt = new Date().toISOString();
      }

      await apiService.updateDocument(documentId, payload);
      loadDocument();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
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

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>Loading document...</div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.error}>{error || 'Document not found'}</div>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2>{document.title}</h2>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                Type: <strong>{document.documentType}</strong>
              </span>
              <span className={styles.metaItem}>
                Version: <strong>{document.version}</strong>
              </span>
              <span className={`${styles.badge} ${getStatusBadgeClass(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Document Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created By:</span>
                <span className={styles.infoValue}>
                  {document.createdBy
                    ? `${document.createdBy.firstName} ${document.createdBy.lastName}`
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created At:</span>
                <span className={styles.infoValue}>
                  {new Date(document.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Updated By:</span>
                <span className={styles.infoValue}>
                  {document.updatedBy
                    ? `${document.updatedBy.firstName} ${document.updatedBy.lastName}`
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Updated:</span>
                <span className={styles.infoValue}>
                  {new Date(document.updatedAt).toLocaleString()}
                </span>
              </div>
              {document.effectiveDate && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Effective Date:</span>
                  <span className={styles.infoValue}>
                    {new Date(document.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {document.reviewDate && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Review Date:</span>
                  <span className={styles.infoValue}>
                    {new Date(document.reviewDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {document.approvedBy && (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Approved By:</span>
                    <span className={styles.infoValue}>
                      {`${document.approvedBy.firstName} ${document.approvedBy.lastName}`}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Approved At:</span>
                    <span className={styles.infoValue}>
                      {new Date(document.approvedAt).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Tags</h3>
              <div className={styles.tags}>
                {document.tags.map((tag: string, index: number) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Content</h3>
            <div className={styles.content}>
              {document.content ? (
                <pre className={styles.contentText}>{document.content}</pre>
              ) : (
                <p className={styles.noContent}>No content available</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {user?.role === 'admin' || user?.role === 'manager' ? (
              <div className={styles.workflowBtns}>
                {document.status === 'draft' && (
                  <button
                    className={styles.btnWorkflow}
                    onClick={() => handleStatusChange('review')}
                  >
                    Send for Review
                  </button>
                )}
                {document.status === 'review' && (
                  <>
                    <button
                      className={styles.btnApprove}
                      onClick={() => handleStatusChange('approved')}
                    >
                      Approve
                    </button>
                    <button
                      className={styles.btnReject}
                      onClick={() => handleStatusChange('draft')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {document.status === 'approved' && (
                  <button
                    className={styles.btnWorkflow}
                    onClick={() => handleStatusChange('archived')}
                  >
                    Archive
                  </button>
                )}
              </div>
            ) : null}
          </div>
          <div className={styles.footerRight}>
            <button className={styles.btnSecondary} onClick={onClose}>
              Close
            </button>
            <button className={styles.btnPrimary} onClick={onEdit}>
              Edit Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
