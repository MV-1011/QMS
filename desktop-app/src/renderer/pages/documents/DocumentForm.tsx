import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './DocumentForm.module.css';

interface DocumentFormProps {
  document: any | null;
  onClose: (refresh?: boolean) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ document, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'SOP',
    content: '',
    version: '1.0',
    status: 'draft',
    effectiveDate: '',
    reviewDate: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        documentType: document.documentType || 'SOP',
        content: document.content || '',
        version: document.version || '1.0',
        status: document.status || 'draft',
        effectiveDate: document.effectiveDate
          ? new Date(document.effectiveDate).toISOString().split('T')[0]
          : '',
        reviewDate: document.reviewDate
          ? new Date(document.reviewDate).toISOString().split('T')[0]
          : '',
        tags: document.tags?.join(', ') || '',
      });
    }
  }, [document]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        documentType: formData.documentType,
        content: formData.content,
        version: formData.version,
        status: formData.status,
        effectiveDate: formData.effectiveDate || undefined,
        reviewDate: formData.reviewDate || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t)
          : [],
      };

      if (document?._id) {
        await apiService.updateDocument(document._id, payload);
      } else {
        await apiService.createDocument(payload);
      }

      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{document ? 'Edit Document' : 'Create New Document'}</h2>
          <button className={styles.closeBtn} onClick={() => onClose()}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={styles.input}
                required
                placeholder="e.g., SOP for Equipment Cleaning"
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="documentType" className={styles.label}>
                Document Type <span className={styles.required}>*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="SOP">SOP</option>
                <option value="Policy">Policy</option>
                <option value="Form">Form</option>
                <option value="Protocol">Protocol</option>
                <option value="Record">Record</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="version" className={styles.label}>
                Version <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className={styles.input}
                required
                placeholder="e.g., 1.0, 2.1"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>
                Status <span className={styles.required}>*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="effectiveDate" className={styles.label}>
                Effective Date
              </label>
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reviewDate" className={styles.label}>
                Review Date
              </label>
              <input
                type="date"
                id="reviewDate"
                name="reviewDate"
                value={formData.reviewDate}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tags" className={styles.label}>
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., cleaning, equipment, pharmacy (comma-separated)"
            />
            <small className={styles.hint}>Separate tags with commas</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="content" className={styles.label}>
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={styles.textarea}
              rows={10}
              placeholder="Enter document content here..."
            />
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => onClose()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : document ? 'Update Document' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm;
