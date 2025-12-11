import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './DocumentForm.module.css';
const DocumentForm = ({ document, onClose }) => {
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
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
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
            }
            else {
                await apiService.createDocument(payload);
            }
            onClose(true);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save document');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: styles.overlay, children: _jsxs("div", { className: styles.modal, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { children: document ? 'Edit Document' : 'Create New Document' }), _jsx("button", { className: styles.closeBtn, onClick: () => onClose(), children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [error && _jsx("div", { className: styles.error, children: error }), _jsx("div", { className: styles.row, children: _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { htmlFor: "title", className: styles.label, children: ["Title ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleChange, className: styles.input, required: true, placeholder: "e.g., SOP for Equipment Cleaning" })] }) }), _jsxs("div", { className: styles.row, children: [_jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { htmlFor: "documentType", className: styles.label, children: ["Document Type ", _jsx("span", { className: styles.required, children: "*" })] }), _jsxs("select", { id: "documentType", name: "documentType", value: formData.documentType, onChange: handleChange, className: styles.select, required: true, children: [_jsx("option", { value: "SOP", children: "SOP" }), _jsx("option", { value: "Policy", children: "Policy" }), _jsx("option", { value: "Form", children: "Form" }), _jsx("option", { value: "Protocol", children: "Protocol" }), _jsx("option", { value: "Record", children: "Record" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { htmlFor: "version", className: styles.label, children: ["Version ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", id: "version", name: "version", value: formData.version, onChange: handleChange, className: styles.input, required: true, placeholder: "e.g., 1.0, 2.1" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { htmlFor: "status", className: styles.label, children: ["Status ", _jsx("span", { className: styles.required, children: "*" })] }), _jsxs("select", { id: "status", name: "status", value: formData.status, onChange: handleChange, className: styles.select, required: true, children: [_jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "review", children: "Under Review" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "archived", children: "Archived" })] })] })] }), _jsxs("div", { className: styles.row, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "effectiveDate", className: styles.label, children: "Effective Date" }), _jsx("input", { type: "date", id: "effectiveDate", name: "effectiveDate", value: formData.effectiveDate, onChange: handleChange, className: styles.input })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "reviewDate", className: styles.label, children: "Review Date" }), _jsx("input", { type: "date", id: "reviewDate", name: "reviewDate", value: formData.reviewDate, onChange: handleChange, className: styles.input })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "tags", className: styles.label, children: "Tags" }), _jsx("input", { type: "text", id: "tags", name: "tags", value: formData.tags, onChange: handleChange, className: styles.input, placeholder: "e.g., cleaning, equipment, pharmacy (comma-separated)" }), _jsx("small", { className: styles.hint, children: "Separate tags with commas" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "content", className: styles.label, children: "Content" }), _jsx("textarea", { id: "content", name: "content", value: formData.content, onChange: handleChange, className: styles.textarea, rows: 10, placeholder: "Enter document content here..." })] }), _jsxs("div", { className: styles.footer, children: [_jsx("button", { type: "button", className: styles.btnCancel, onClick: () => onClose(), disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.btnSubmit, disabled: loading, children: loading ? 'Saving...' : document ? 'Update Document' : 'Create Document' })] })] })] }) }));
};
export default DocumentForm;
