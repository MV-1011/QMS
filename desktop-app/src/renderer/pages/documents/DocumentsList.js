import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import DocumentForm from './DocumentForm';
import DocumentViewer from './DocumentViewer';
import styles from './DocumentsList.module.css';
const DocumentsList = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
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
            const params = {};
            if (statusFilter)
                params.status = statusFilter;
            if (typeFilter)
                params.type = typeFilter;
            const response = await apiService.getDocuments(params);
            setDocuments(response.data || []);
            setError('');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load documents');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = () => {
        setSelectedDocument(null);
        setShowForm(true);
    };
    const handleEdit = (doc) => {
        setSelectedDocument(doc);
        setShowForm(true);
    };
    const handleView = (doc) => {
        setSelectedDocument(doc);
        setShowViewer(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }
        try {
            await apiService.deleteDocument(id);
            loadDocuments();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Failed to delete document');
        }
    };
    const handleFormClose = (refresh) => {
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
    const filteredDocuments = documents.filter((doc) => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (doc.title.toLowerCase().includes(term) ||
                doc.documentType.toLowerCase().includes(term) ||
                doc.version.toLowerCase().includes(term));
        }
        return true;
    });
    if (showForm) {
        return (_jsx(DocumentForm, { document: selectedDocument, onClose: handleFormClose }));
    }
    if (showViewer && selectedDocument) {
        return (_jsx(DocumentViewer, { documentId: selectedDocument._id, onClose: handleViewerClose, onEdit: () => {
                setShowViewer(false);
                setShowForm(true);
            } }));
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.headerLeft, children: [_jsx("h2", { children: "Document Control" }), _jsx("p", { className: styles.subtitle, children: "Manage SOPs, policies, forms, and protocols" })] }), _jsx("button", { className: styles.btnPrimary, onClick: handleCreate, children: "+ New Document" })] }), _jsxs("div", { className: styles.filters, children: [_jsx("div", { className: styles.searchBox, children: _jsx("input", { type: "text", placeholder: "Search documents...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }) }), _jsxs("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Types" }), _jsx("option", { value: "SOP", children: "SOP" }), _jsx("option", { value: "Policy", children: "Policy" }), _jsx("option", { value: "Form", children: "Form" }), _jsx("option", { value: "Protocol", children: "Protocol" }), _jsx("option", { value: "Record", children: "Record" }), _jsx("option", { value: "Other", children: "Other" })] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "review", children: "Under Review" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), error && _jsx("div", { className: styles.error, children: error }), loading ? (_jsx("div", { className: styles.loading, children: "Loading documents..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: documents.length }), _jsx("span", { className: styles.statLabel, children: "Total Documents" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: documents.filter((d) => d.status === 'approved').length }), _jsx("span", { className: styles.statLabel, children: "Approved" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: documents.filter((d) => d.status === 'review').length }), _jsx("span", { className: styles.statLabel, children: "Under Review" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: documents.filter((d) => d.status === 'draft').length }), _jsx("span", { className: styles.statLabel, children: "Drafts" })] })] }), filteredDocuments.length === 0 ? (_jsxs("div", { className: styles.empty, children: [_jsx("p", { children: "No documents found" }), _jsx("button", { className: styles.btnSecondary, onClick: handleCreate, children: "Create your first document" })] })) : (_jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Title" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Version" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Created By" }), _jsx("th", { children: "Last Updated" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredDocuments.map((doc) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("button", { className: styles.linkBtn, onClick: () => handleView(doc), children: doc.title }) }), _jsx("td", { children: doc.documentType }), _jsx("td", { children: doc.version }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(doc.status)}`, children: doc.status }) }), _jsx("td", { children: doc.createdBy
                                                    ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}`
                                                    : 'N/A' }), _jsx("td", { children: new Date(doc.updatedAt).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { className: styles.actions, children: [_jsx("button", { className: styles.btnAction, onClick: () => handleView(doc), title: "View", children: "\uD83D\uDC41\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleEdit(doc), title: "Edit", children: "\u270F\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleDelete(doc._id), title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] }) })] }, doc._id))) })] }) }))] }))] }));
};
export default DocumentsList;
