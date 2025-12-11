import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './ChangeControlList.module.css';
const initialFormData = {
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
const ChangeControlList = () => {
    const [changeControls, setChangeControls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCC, setSelectedCC] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
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
            const params = {};
            if (statusFilter)
                params.status = statusFilter;
            if (priorityFilter)
                params.priority = priorityFilter;
            const response = await apiService.getChangeControls(params);
            setChangeControls(response.data || []);
            setError('');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load change controls');
            console.error('Error loading change controls:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleView = (cc) => {
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
    const handleEdit = (cc) => {
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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (editingId) {
                await apiService.updateChangeControl(editingId, formData);
            }
            else {
                await apiService.createChangeControl(formData);
            }
            handleCloseForm();
            loadChangeControls();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save change control');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this change control?'))
            return;
        try {
            await apiService.deleteChangeControl(id);
            loadChangeControls();
            if (selectedCC?._id === id) {
                setSelectedCC(null);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete change control');
        }
    };
    const handleStatusChange = async (cc, newStatus) => {
        try {
            await apiService.updateChangeControl(cc._id, { status: newStatus });
            loadChangeControls();
            if (selectedCC?._id === cc._id) {
                setSelectedCC({ ...selectedCC, status: newStatus });
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };
    const getStatusBadgeClass = (status) => {
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
    const getPriorityBadgeClass = (priority) => {
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
            return (cc.title.toLowerCase().includes(term) ||
                cc.changeNumber.toLowerCase().includes(term) ||
                cc.changeType.toLowerCase().includes(term));
        }
        return true;
    });
    // Form view
    if (showForm) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailsHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseForm, children: "\u2190 Back to List" }), _jsx("h2", { children: editingId ? 'Edit Change Control' : 'New Change Control' })] }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "title", children: "Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleInputChange, required: true, placeholder: "Enter change control title" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "description", children: "Description *" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, required: true, rows: 4, placeholder: "Describe the change in detail" })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "changeType", children: "Change Type *" }), _jsx("select", { id: "changeType", name: "changeType", value: formData.changeType, onChange: handleInputChange, required: true, children: CHANGE_TYPES.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "priority", children: "Priority *" }), _jsxs("select", { id: "priority", name: "priority", value: formData.priority, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "riskLevel", children: "Risk Level" }), _jsxs("select", { id: "riskLevel", name: "riskLevel", value: formData.riskLevel, onChange: handleInputChange, children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "implementationDate", children: "Target Implementation Date" }), _jsx("input", { type: "date", id: "implementationDate", name: "implementationDate", value: formData.implementationDate, onChange: handleInputChange })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "impactAssessment", children: "Impact Assessment" }), _jsx("textarea", { id: "impactAssessment", name: "impactAssessment", value: formData.impactAssessment, onChange: handleInputChange, rows: 3, placeholder: "Describe the potential impact of this change" })] }), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", className: styles.btnSecondary, onClick: handleCloseForm, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.btnPrimary, disabled: submitting, children: submitting ? 'Saving...' : (editingId ? 'Update' : 'Create') })] })] })] }));
    }
    // Detail view
    if (selectedCC) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailsHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseDetails, children: "\u2190 Back to List" }), _jsx("h2", { children: selectedCC.changeNumber }), _jsxs("div", { className: styles.detailsActions, children: [_jsx("button", { className: styles.btnSecondary, onClick: () => handleEdit(selectedCC), children: "Edit" }), _jsx("button", { className: styles.btnDanger, onClick: () => handleDelete(selectedCC._id), children: "Delete" })] })] }), _jsxs("div", { className: styles.detailsCard, children: [_jsxs("div", { className: styles.detailsSection, children: [_jsx("h3", { children: selectedCC.title }), _jsxs("div", { className: styles.badges, children: [_jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(selectedCC.status)}`, children: selectedCC.status.replace('_', ' ') }), _jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(selectedCC.priority)}`, children: selectedCC.priority })] })] }), _jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Description" }), _jsx("p", { children: selectedCC.description })] }), selectedCC.impactAssessment && (_jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Impact Assessment" }), _jsx("p", { children: selectedCC.impactAssessment })] })), _jsxs("div", { className: styles.detailsGrid, children: [_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Change Type:" }), _jsx("span", { children: selectedCC.changeType })] }), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Risk Level:" }), _jsx("span", { children: selectedCC.riskLevel || 'Not assessed' })] }), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Requestor:" }), _jsx("span", { children: selectedCC.requestorId
                                                ? `${selectedCC.requestorId.firstName} ${selectedCC.requestorId.lastName}`
                                                : 'N/A' })] }), selectedCC.implementationDate && (_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Implementation Date:" }), _jsx("span", { children: new Date(selectedCC.implementationDate).toLocaleDateString() })] })), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Created:" }), _jsx("span", { children: new Date(selectedCC.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Last Updated:" }), _jsx("span", { children: new Date(selectedCC.updatedAt).toLocaleDateString() })] })] }), _jsxs("div", { className: styles.statusSection, children: [_jsx("h4", { children: "Update Status" }), _jsx("div", { className: styles.statusButtons, children: ['initiated', 'assessment', 'approval_pending', 'approved', 'implementation', 'verification', 'completed', 'rejected'].map(status => (_jsx("button", { className: `${styles.statusBtn} ${selectedCC.status === status ? styles.statusBtnActive : ''}`, onClick: () => handleStatusChange(selectedCC, status), disabled: selectedCC.status === status, children: status.replace('_', ' ') }, status))) })] })] })] }));
    }
    // List view
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.headerLeft, children: [_jsx("h2", { children: "Change Control" }), _jsx("p", { className: styles.subtitle, children: "Manage changes to processes, systems, and documents" })] }), _jsx("button", { className: styles.btnPrimary, onClick: handleCreate, children: "+ New Change Control" })] }), _jsxs("div", { className: styles.filters, children: [_jsx("div", { className: styles.searchBox, children: _jsx("input", { type: "text", placeholder: "Search change controls...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }) }), _jsxs("select", { value: priorityFilter, onChange: (e) => setPriorityFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Priorities" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "initiated", children: "Initiated" }), _jsx("option", { value: "assessment", children: "Assessment" }), _jsx("option", { value: "approval_pending", children: "Approval Pending" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "implementation", children: "Implementation" }), _jsx("option", { value: "verification", children: "Verification" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "rejected", children: "Rejected" })] })] }), error && _jsx("div", { className: styles.error, children: error }), loading ? (_jsx("div", { className: styles.loading, children: "Loading change controls..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: changeControls.length }), _jsx("span", { className: styles.statLabel, children: "Total Changes" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: changeControls.filter((c) => c.status === 'approval_pending').length }), _jsx("span", { className: styles.statLabel, children: "Pending Approval" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: changeControls.filter((c) => c.status === 'implementation').length }), _jsx("span", { className: styles.statLabel, children: "In Progress" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: changeControls.filter((c) => c.status === 'completed').length }), _jsx("span", { className: styles.statLabel, children: "Completed" })] })] }), filteredChangeControls.length === 0 ? (_jsxs("div", { className: styles.empty, children: [_jsx("p", { children: "No change controls found" }), _jsx("button", { className: styles.btnPrimary, onClick: handleCreate, children: "Create your first change control" })] })) : (_jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Change #" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Requestor" }), _jsx("th", { children: "Created" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredChangeControls.map((cc) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("button", { className: styles.linkBtn, onClick: () => handleView(cc), children: cc.changeNumber }) }), _jsx("td", { className: styles.titleCell, children: cc.title }), _jsx("td", { children: cc.changeType }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(cc.priority)}`, children: cc.priority }) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(cc.status)}`, children: cc.status.replace('_', ' ') }) }), _jsx("td", { children: cc.requestorId
                                                    ? `${cc.requestorId.firstName} ${cc.requestorId.lastName}`
                                                    : 'N/A' }), _jsx("td", { children: new Date(cc.createdAt).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { className: styles.actions, children: [_jsx("button", { className: styles.btnAction, onClick: () => handleView(cc), title: "View", children: "\uD83D\uDC41\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleEdit(cc), title: "Edit", children: "\u270F\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleDelete(cc._id), title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] }) })] }, cc._id))) })] }) }))] }))] }));
};
export default ChangeControlList;
