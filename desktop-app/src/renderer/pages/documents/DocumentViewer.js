import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import styles from './DocumentViewer.module.css';
const DocumentViewer = ({ documentId, onClose, onEdit, }) => {
    const { user } = useAuth();
    const [document, setDocument] = useState(null);
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load document');
        }
        finally {
            setLoading(false);
        }
    };
    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Change document status to ${newStatus}?`)) {
            return;
        }
        try {
            const payload = { status: newStatus };
            // If approving, add approval metadata
            if (newStatus === 'approved') {
                payload.approvedAt = new Date().toISOString();
            }
            await apiService.updateDocument(documentId, payload);
            loadDocument();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };
    const getStatusBadgeClass = (status) => {
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
        return (_jsx("div", { className: styles.overlay, children: _jsx("div", { className: styles.modal, children: _jsx("div", { className: styles.loading, children: "Loading document..." }) }) }));
    }
    if (error || !document) {
        return (_jsx("div", { className: styles.overlay, children: _jsxs("div", { className: styles.modal, children: [_jsx("div", { className: styles.error, children: error || 'Document not found' }), _jsx("button", { className: styles.btnSecondary, onClick: onClose, children: "Close" })] }) }));
    }
    return (_jsx("div", { className: styles.overlay, children: _jsxs("div", { className: styles.modal, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.headerLeft, children: [_jsx("h2", { children: document.title }), _jsxs("div", { className: styles.meta, children: [_jsxs("span", { className: styles.metaItem, children: ["Type: ", _jsx("strong", { children: document.documentType })] }), _jsxs("span", { className: styles.metaItem, children: ["Version: ", _jsx("strong", { children: document.version })] }), _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(document.status)}`, children: document.status })] })] }), _jsx("button", { className: styles.closeBtn, onClick: onClose, children: "\u2715" })] }), _jsxs("div", { className: styles.body, children: [_jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Document Information" }), _jsxs("div", { className: styles.infoGrid, children: [_jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Created By:" }), _jsx("span", { className: styles.infoValue, children: document.createdBy
                                                        ? `${document.createdBy.firstName} ${document.createdBy.lastName}`
                                                        : 'N/A' })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Created At:" }), _jsx("span", { className: styles.infoValue, children: new Date(document.createdAt).toLocaleString() })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Last Updated By:" }), _jsx("span", { className: styles.infoValue, children: document.updatedBy
                                                        ? `${document.updatedBy.firstName} ${document.updatedBy.lastName}`
                                                        : 'N/A' })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Last Updated:" }), _jsx("span", { className: styles.infoValue, children: new Date(document.updatedAt).toLocaleString() })] }), document.effectiveDate && (_jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Effective Date:" }), _jsx("span", { className: styles.infoValue, children: new Date(document.effectiveDate).toLocaleDateString() })] })), document.reviewDate && (_jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Review Date:" }), _jsx("span", { className: styles.infoValue, children: new Date(document.reviewDate).toLocaleDateString() })] })), document.approvedBy && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Approved By:" }), _jsx("span", { className: styles.infoValue, children: `${document.approvedBy.firstName} ${document.approvedBy.lastName}` })] }), _jsxs("div", { className: styles.infoItem, children: [_jsx("span", { className: styles.infoLabel, children: "Approved At:" }), _jsx("span", { className: styles.infoValue, children: new Date(document.approvedAt).toLocaleString() })] })] }))] })] }), document.tags && document.tags.length > 0 && (_jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Tags" }), _jsx("div", { className: styles.tags, children: document.tags.map((tag, index) => (_jsx("span", { className: styles.tag, children: tag }, index))) })] })), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "Content" }), _jsx("div", { className: styles.content, children: document.content ? (_jsx("pre", { className: styles.contentText, children: document.content })) : (_jsx("p", { className: styles.noContent, children: "No content available" })) })] })] }), _jsxs("div", { className: styles.footer, children: [_jsx("div", { className: styles.footerLeft, children: user?.role === 'admin' || user?.role === 'manager' ? (_jsxs("div", { className: styles.workflowBtns, children: [document.status === 'draft' && (_jsx("button", { className: styles.btnWorkflow, onClick: () => handleStatusChange('review'), children: "Send for Review" })), document.status === 'review' && (_jsxs(_Fragment, { children: [_jsx("button", { className: styles.btnApprove, onClick: () => handleStatusChange('approved'), children: "Approve" }), _jsx("button", { className: styles.btnReject, onClick: () => handleStatusChange('draft'), children: "Reject" })] })), document.status === 'approved' && (_jsx("button", { className: styles.btnWorkflow, onClick: () => handleStatusChange('archived'), children: "Archive" }))] })) : null }), _jsxs("div", { className: styles.footerRight, children: [_jsx("button", { className: styles.btnSecondary, onClick: onClose, children: "Close" }), _jsx("button", { className: styles.btnPrimary, onClick: onEdit, children: "Edit Document" })] })] })] }) }));
};
export default DocumentViewer;
