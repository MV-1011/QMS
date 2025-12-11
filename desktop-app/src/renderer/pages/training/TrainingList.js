import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import styles from './TrainingList.module.css';
const TrainingList = () => {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTraining, setEditingTraining] = useState(null);
    const [viewingTraining, setViewingTraining] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [trainingContent, setTrainingContent] = useState([]);
    const [contentLoading, setContentLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [users, setUsers] = useState([]);
    const [trainingAssignments, setTrainingAssignments] = useState([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const fileInputRef = useRef(null);
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
    const [assignData, setAssignData] = useState({
        selectedRoles: [],
        selectedUsers: [],
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
        }
        catch (err) {
            setError(err.message || 'Failed to fetch trainings');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchUsers = async () => {
        try {
            const response = await apiService.getUsers();
            setUsers(response.data || []);
        }
        catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };
    const fetchTrainingContent = async (trainingId) => {
        try {
            setContentLoading(true);
            const response = await apiService.getTrainingContent(trainingId);
            setTrainingContent(response.data || []);
        }
        catch (err) {
            console.error('Failed to fetch content:', err);
        }
        finally {
            setContentLoading(false);
        }
    };
    const fetchTrainingAssignments = async (trainingId) => {
        try {
            setAssignmentsLoading(true);
            const response = await apiService.getAllAssignments({ trainingId });
            setTrainingAssignments(response.data || []);
        }
        catch (err) {
            console.error('Failed to fetch assignments:', err);
        }
        finally {
            setAssignmentsLoading(false);
        }
    };
    const handleResetAssignment = async (assignmentId, userName) => {
        if (!confirm(`Are you sure you want to reset the training for ${userName}? This will:\n\n• Reset their progress to the beginning\n• Allow them to retake the training\n• Remove their certificate (if any)\n\nThis action cannot be undone.`)) {
            return;
        }
        try {
            await apiService.resetAssignment(assignmentId);
            alert('Training assignment reset successfully');
            if (viewingTraining) {
                await fetchTrainingAssignments(viewingTraining._id);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to reset assignment');
        }
    };
    const handleIssueCertificate = async (assignmentId, userName) => {
        if (!confirm(`Issue certificate for ${userName}?`))
            return;
        try {
            await apiService.issueCertificateForAssignment(assignmentId);
            alert('Certificate issued successfully');
            if (viewingTraining) {
                await fetchTrainingAssignments(viewingTraining._id);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to issue certificate');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
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
            }
            else {
                await apiService.createTraining(data);
            }
            setShowForm(false);
            setEditingTraining(null);
            resetForm();
            fetchTrainings();
        }
        catch (err) {
            console.error('Error saving training:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save training';
            setError(errorMsg);
        }
    };
    const handleEdit = (training) => {
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
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this training?'))
            return;
        try {
            await apiService.deleteTraining(id);
            fetchTrainings();
        }
        catch (err) {
            setError(err.message || 'Failed to delete training');
        }
    };
    const handleStatusChange = async (training, newStatus) => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'completed') {
                updateData.completionDate = new Date().toISOString();
            }
            await apiService.updateTraining(training._id, updateData);
            fetchTrainings();
        }
        catch (err) {
            setError(err.message || 'Failed to update status');
        }
    };
    const handleViewTraining = async (training) => {
        setViewingTraining(training);
        setActiveTab('details');
        await fetchTrainingContent(training._id);
        await fetchTrainingAssignments(training._id);
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !viewingTraining)
            return;
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
        }
        catch (err) {
            setError(err.message || 'Failed to upload content');
            setUploadProgress(0);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleAddLink = async (e) => {
        e.preventDefault();
        if (!viewingTraining)
            return;
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
        }
        catch (err) {
            setError(err.message || 'Failed to add content');
        }
    };
    const handleDeleteContent = async (contentId) => {
        if (!confirm('Are you sure you want to delete this content?'))
            return;
        try {
            await apiService.deleteTrainingContent(contentId);
            if (viewingTraining) {
                await fetchTrainingContent(viewingTraining._id);
            }
        }
        catch (err) {
            setError(err.message || 'Failed to delete content');
        }
    };
    const handleAssignTraining = async () => {
        if (!viewingTraining)
            return;
        try {
            await apiService.assignTraining(viewingTraining._id, assignData.selectedUsers.length > 0 ? assignData.selectedUsers : undefined, assignData.selectedRoles.length > 0 ? assignData.selectedRoles : undefined, assignData.dueDate || undefined);
            alert('Training assigned successfully!');
            setAssignData({ selectedRoles: [], selectedUsers: [], dueDate: '' });
        }
        catch (err) {
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
    const getStatusColor = (status) => {
        const colors = {
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
    const getPriorityColor = (priority) => {
        const colors = {
            Low: '#27ae60',
            Medium: '#f39c12',
            High: '#e67e22',
            Mandatory: '#e74c3c',
        };
        return colors[priority] || '#95a5a6';
    };
    const getAssignmentStatusColor = (status) => {
        const colors = {
            assigned: '#3498db',
            in_progress: '#f39c12',
            exam_pending: '#9b59b6',
            completed: '#27ae60',
            failed: '#e74c3c',
            overdue: '#c0392b',
        };
        return colors[status] || '#95a5a6';
    };
    const getContentIcon = (contentType) => {
        const icons = {
            video: '🎬',
            pdf: '📄',
            ppt: '📊',
            document: '📝',
            link: '🔗',
            scorm: '📦',
        };
        return icons[contentType] || '📁';
    };
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        const mb = bytes / (1024 * 1024);
        return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
    };
    const toggleRole = (role, list, setList) => {
        if (list.includes(role)) {
            setList(list.filter(r => r !== role));
        }
        else {
            setList([...list, role]);
        }
    };
    if (loading)
        return _jsx("div", { className: styles.loading, children: "Loading trainings..." });
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsx("h1", { children: "Training Management" }), _jsx("button", { className: styles.primaryBtn, onClick: () => { setShowForm(true); setEditingTraining(null); resetForm(); }, children: "+ Create Training" })] }), error && _jsxs("div", { className: styles.error, children: [error, " ", _jsx("button", { onClick: () => setError(''), children: "\u00D7" })] }), showForm && (_jsx("div", { className: styles.modal, children: _jsxs("div", { className: styles.modalContent, style: { maxWidth: '800px' }, children: [_jsx("h2", { children: editingTraining ? 'Edit Training' : 'Create New Training' }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: styles.formGrid, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, placeholder: "Enter training title" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Training Type *" }), _jsxs("select", { value: formData.trainingType, onChange: (e) => setFormData({ ...formData, trainingType: e.target.value }), children: [_jsx("option", { value: "Initial", children: "Initial" }), _jsx("option", { value: "Refresher", children: "Refresher" }), _jsx("option", { value: "Annual", children: "Annual" }), _jsx("option", { value: "Ad-hoc", children: "Ad-hoc" }), _jsx("option", { value: "Certification", children: "Certification" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Category *" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), children: [_jsx("option", { value: "SOP", children: "SOP" }), _jsx("option", { value: "GMP", children: "GMP" }), _jsx("option", { value: "Safety", children: "Safety" }), _jsx("option", { value: "Compliance", children: "Compliance" }), _jsx("option", { value: "Technical", children: "Technical" }), _jsx("option", { value: "Soft Skills", children: "Soft Skills" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Priority *" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Mandatory", children: "Mandatory" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Scheduled Date *" }), _jsx("input", { type: "date", value: formData.scheduledDate, onChange: (e) => setFormData({ ...formData, scheduledDate: e.target.value }), required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Due Date *" }), _jsx("input", { type: "date", value: formData.dueDate, onChange: (e) => setFormData({ ...formData, dueDate: e.target.value }), required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Duration (minutes)" }), _jsx("input", { type: "number", value: formData.duration, onChange: (e) => setFormData({ ...formData, duration: e.target.value }), placeholder: "e.g., 60" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Trainer" }), _jsx("input", { type: "text", value: formData.trainer, onChange: (e) => setFormData({ ...formData, trainer: e.target.value }), placeholder: "Trainer name" })] })] }), _jsxs("div", { className: styles.formGroupFull, children: [_jsx("label", { children: "Target Roles" }), _jsx("div", { className: styles.roleCheckboxes, children: roles.map(role => (_jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: formData.targetRoles.includes(role.value), onChange: () => toggleRole(role.value, formData.targetRoles, (r) => setFormData({ ...formData, targetRoles: r })) }), role.label] }, role.value))) })] }), _jsxs("div", { className: styles.formGroupFull, children: [_jsx("label", { children: "Description *" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), required: true, rows: 3, placeholder: "Enter training description" })] }), _jsxs("div", { className: styles.formSection, children: [_jsx("h3", { children: "Assessment Settings" }), _jsxs("div", { className: styles.formGrid, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: formData.assessmentRequired, onChange: (e) => setFormData({ ...formData, assessmentRequired: e.target.checked }) }), "Assessment Required"] }) }), formData.assessmentRequired && (_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Passing Score (%)" }), _jsx("input", { type: "number", value: formData.passingScore, onChange: (e) => setFormData({ ...formData, passingScore: e.target.value }), min: "0", max: "100", placeholder: "e.g., 70" })] }))] })] }), _jsxs("div", { className: styles.formSection, children: [_jsx("h3", { children: "Certificate Settings" }), _jsxs("div", { className: styles.formGrid, children: [_jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: formData.certificateEnabled, onChange: (e) => setFormData({ ...formData, certificateEnabled: e.target.checked }) }), "Issue Certificate on Completion"] }) }), formData.certificateEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Certificate Validity (months)" }), _jsx("input", { type: "number", value: formData.certificateValidityMonths, onChange: (e) => setFormData({ ...formData, certificateValidityMonths: e.target.value }), min: "1", placeholder: "12" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Signer Name" }), _jsx("input", { type: "text", value: formData.certificateTemplate.signerName, onChange: (e) => setFormData({
                                                                        ...formData,
                                                                        certificateTemplate: { ...formData.certificateTemplate, signerName: e.target.value }
                                                                    }), placeholder: "e.g., John Smith" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Signer Title" }), _jsx("input", { type: "text", value: formData.certificateTemplate.signerTitle, onChange: (e) => setFormData({
                                                                        ...formData,
                                                                        certificateTemplate: { ...formData.certificateTemplate, signerTitle: e.target.value }
                                                                    }), placeholder: "e.g., Training Director" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Border Color" }), _jsx("input", { type: "color", value: formData.certificateTemplate.borderColor, onChange: (e) => setFormData({
                                                                        ...formData,
                                                                        certificateTemplate: { ...formData.certificateTemplate, borderColor: e.target.value }
                                                                    }) })] })] }))] })] }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", className: styles.cancelBtn, onClick: () => { setShowForm(false); setEditingTraining(null); }, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.submitBtn, children: editingTraining ? 'Update Training' : 'Create Training' })] })] })] }) })), viewingTraining && (_jsx("div", { className: styles.modal, children: _jsxs("div", { className: styles.modalContent, style: { maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }, children: [_jsxs("div", { className: styles.modalHeader, children: [_jsxs("div", { children: [_jsx("h2", { children: viewingTraining.title }), _jsx("span", { className: styles.badge, style: { backgroundColor: getStatusColor(viewingTraining.status) }, children: viewingTraining.status.replace('_', ' ') })] }), _jsx("button", { className: styles.closeBtn, onClick: () => setViewingTraining(null), children: "\u00D7" })] }), _jsxs("div", { className: styles.tabs, children: [_jsx("button", { className: `${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`, onClick: () => setActiveTab('details'), children: "Details" }), _jsxs("button", { className: `${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`, onClick: () => setActiveTab('content'), children: ["Content (", trainingContent.length, ")"] }), _jsx("button", { className: `${styles.tab} ${activeTab === 'certificate' ? styles.activeTab : ''}`, onClick: () => setActiveTab('certificate'), children: "Certificate" }), _jsx("button", { className: `${styles.tab} ${activeTab === 'assign' ? styles.activeTab : ''}`, onClick: () => setActiveTab('assign'), children: "Assign Users" }), _jsxs("button", { className: `${styles.tab} ${activeTab === 'assignments' ? styles.activeTab : ''}`, onClick: () => setActiveTab('assignments'), children: ["Assignments (", trainingAssignments.length, ")"] })] }), _jsxs("div", { className: styles.tabContent, children: [activeTab === 'details' && (_jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { children: [_jsx("strong", { children: "Training #:" }), " ", viewingTraining.trainingNumber] }), _jsxs("div", { children: [_jsx("strong", { children: "Type:" }), " ", viewingTraining.trainingType] }), _jsxs("div", { children: [_jsx("strong", { children: "Category:" }), " ", viewingTraining.category] }), _jsxs("div", { children: [_jsx("strong", { children: "Priority:" }), " ", _jsx("span", { style: { color: getPriorityColor(viewingTraining.priority) }, children: viewingTraining.priority })] }), _jsxs("div", { children: [_jsx("strong", { children: "Scheduled:" }), " ", new Date(viewingTraining.scheduledDate).toLocaleDateString()] }), _jsxs("div", { children: [_jsx("strong", { children: "Due Date:" }), " ", new Date(viewingTraining.dueDate).toLocaleDateString()] }), viewingTraining.duration && _jsxs("div", { children: [_jsx("strong", { children: "Duration:" }), " ", viewingTraining.duration, " minutes"] }), viewingTraining.trainer && _jsxs("div", { children: [_jsx("strong", { children: "Trainer:" }), " ", viewingTraining.trainer] }), _jsxs("div", { children: [_jsx("strong", { children: "Assessment:" }), " ", viewingTraining.assessmentRequired ? `Yes (Pass: ${viewingTraining.passingScore}%)` : 'No'] }), _jsxs("div", { children: [_jsx("strong", { children: "Certificate:" }), " ", viewingTraining.certificateEnabled !== false ? 'Yes' : 'No'] }), viewingTraining.targetRoles && viewingTraining.targetRoles.length > 0 && (_jsxs("div", { className: styles.fullWidth, children: [_jsx("strong", { children: "Target Roles:" }), " ", viewingTraining.targetRoles.map(r => roles.find(role => role.value === r)?.label || r).join(', ')] })), _jsxs("div", { className: styles.fullWidth, children: [_jsx("strong", { children: "Description:" }), _jsx("p", { children: viewingTraining.description })] })] })), activeTab === 'content' && (_jsxs("div", { className: styles.contentSection, children: [_jsxs("div", { className: styles.uploadArea, children: [_jsx("h4", { children: "Add Training Content" }), _jsxs("div", { className: styles.uploadButtons, children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, accept: "video/*,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip", style: { display: 'none' } }), _jsx("button", { className: styles.uploadBtn, onClick: () => fileInputRef.current?.click(), children: "\uD83D\uDCE4 Upload File (Video, PDF, PPT, etc.)" })] }), uploadProgress > 0 && (_jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progress, style: { width: `${uploadProgress}%` } }) })), _jsxs("div", { className: styles.linkForm, children: [_jsx("h5", { children: "Or Add External Link" }), _jsx("form", { onSubmit: handleAddLink, children: _jsxs("div", { className: styles.formGrid, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Title" }), _jsx("input", { type: "text", value: contentForm.title, onChange: (e) => setContentForm({ ...contentForm, title: e.target.value }), required: true, placeholder: "Content title" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Type" }), _jsxs("select", { value: contentForm.contentType, onChange: (e) => setContentForm({ ...contentForm, contentType: e.target.value }), children: [_jsx("option", { value: "link", children: "External Link" }), _jsx("option", { value: "video", children: "Video URL" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "URL" }), _jsx("input", { type: "url", value: contentForm.contentUrl, onChange: (e) => setContentForm({ ...contentForm, contentUrl: e.target.value }), required: true, placeholder: "https://..." })] }), _jsx("div", { className: styles.formGroup, children: _jsx("button", { type: "submit", className: styles.addBtn, children: "Add Link" }) })] }) })] })] }), _jsxs("div", { className: styles.contentList, children: [_jsxs("h4", { children: ["Training Materials (", trainingContent.length, ")"] }), contentLoading ? (_jsx("div", { className: styles.loading, children: "Loading content..." })) : trainingContent.length === 0 ? (_jsx("div", { className: styles.emptyState, children: "No content added yet. Upload files or add links above." })) : (_jsx("div", { className: styles.contentItems, children: trainingContent.map((content, index) => (_jsxs("div", { className: styles.contentItem, children: [_jsx("span", { className: styles.contentOrder, children: index + 1 }), _jsx("span", { className: styles.contentIcon, children: getContentIcon(content.contentType) }), _jsxs("div", { className: styles.contentInfo, children: [_jsx("strong", { children: content.title }), _jsxs("span", { className: styles.contentMeta, children: [content.contentType.toUpperCase(), content.fileSize && ` • ${formatFileSize(content.fileSize)}`, content.duration && ` • ${content.duration} min`, content.isRequired && ' • Required'] })] }), _jsxs("div", { className: styles.contentActions, children: [content.contentUrl.startsWith('/uploads') ? (_jsx("a", { href: apiService.getUploadUrl(content.contentUrl), target: "_blank", rel: "noopener noreferrer", className: styles.viewBtn, children: "View" })) : (_jsx("a", { href: content.contentUrl, target: "_blank", rel: "noopener noreferrer", className: styles.viewBtn, children: "Open" })), _jsx("button", { className: styles.deleteBtn, onClick: () => handleDeleteContent(content._id), children: "Delete" })] })] }, content._id))) }))] })] })), activeTab === 'certificate' && (_jsxs("div", { className: styles.certificateSection, children: [_jsx("h4", { children: "Certificate Template Settings" }), _jsx("p", { children: "Certificates will be automatically generated when users complete this training." }), _jsx("div", { className: styles.certificatePreview, children: _jsxs("div", { className: styles.certPreviewBox, style: {
                                                    borderColor: viewingTraining.certificateTemplate?.borderColor || '#0066cc',
                                                    backgroundColor: viewingTraining.certificateTemplate?.backgroundColor || '#ffffff',
                                                    color: viewingTraining.certificateTemplate?.textColor || '#1a1a2e',
                                                }, children: [_jsx("div", { className: styles.certRibbon, style: { backgroundColor: viewingTraining.certificateTemplate?.borderColor || '#0066cc' }, children: "CERTIFICATE OF COMPLETION" }), _jsx("h3", { children: "ABC Pharmacy" }), _jsx("p", { children: "This is to certify that" }), _jsx("h2", { style: { color: viewingTraining.certificateTemplate?.borderColor || '#0066cc' }, children: "[Recipient Name]" }), _jsx("p", { children: "has successfully completed" }), _jsx("h4", { children: viewingTraining.title }), _jsx("div", { className: styles.certSignatures, children: _jsxs("div", { children: [_jsx("div", { className: styles.sigLine }), _jsx("p", { children: viewingTraining.certificateTemplate?.signerName || 'Training Administrator' }), _jsx("small", { children: viewingTraining.certificateTemplate?.signerTitle || 'Quality Assurance' })] }) })] }) }), _jsxs("div", { className: styles.certSettings, children: [_jsxs("p", { children: [_jsx("strong", { children: "Certificate Validity:" }), " ", viewingTraining.certificateValidityMonths || 12, " months"] }), viewingTraining.certificateTemplate?.customText && (_jsxs("p", { children: [_jsx("strong", { children: "Custom Text:" }), " ", viewingTraining.certificateTemplate.customText] }))] })] })), activeTab === 'assign' && (_jsxs("div", { className: styles.assignSection, children: [_jsx("h4", { children: "Assign Training to Users" }), _jsxs("div", { className: styles.assignForm, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Assign by Role" }), _jsx("div", { className: styles.roleCheckboxes, children: roles.map(role => (_jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: assignData.selectedRoles.includes(role.value), onChange: () => toggleRole(role.value, assignData.selectedRoles, (r) => setAssignData({ ...assignData, selectedRoles: r })) }), role.label] }, role.value))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Or Select Individual Users" }), _jsx("div", { className: styles.userList, children: users.map(user => (_jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", checked: assignData.selectedUsers.includes(user._id), onChange: () => {
                                                                            if (assignData.selectedUsers.includes(user._id)) {
                                                                                setAssignData({ ...assignData, selectedUsers: assignData.selectedUsers.filter(id => id !== user._id) });
                                                                            }
                                                                            else {
                                                                                setAssignData({ ...assignData, selectedUsers: [...assignData.selectedUsers, user._id] });
                                                                            }
                                                                        } }), user.firstName, " ", user.lastName, " (", user.role, ")"] }, user._id))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { children: "Due Date (Optional)" }), _jsx("input", { type: "date", value: assignData.dueDate, onChange: (e) => setAssignData({ ...assignData, dueDate: e.target.value }) })] }), _jsx("button", { className: styles.submitBtn, onClick: handleAssignTraining, disabled: assignData.selectedRoles.length === 0 && assignData.selectedUsers.length === 0, children: "Assign Training" })] })] })), activeTab === 'assignments' && (_jsxs("div", { className: styles.assignmentsSection, children: [_jsx("h4", { children: "User Assignments" }), _jsx("p", { className: styles.assignmentsInfo, children: "Manage user training assignments. You can reset a user's progress to allow them to retake the training, or issue certificates for completed trainings that don't have one yet." }), assignmentsLoading ? (_jsx("div", { className: styles.loading, children: "Loading assignments..." })) : trainingAssignments.length === 0 ? (_jsx("div", { className: styles.emptyState, children: "No users have been assigned to this training yet. Use the \"Assign Users\" tab to assign users." })) : (_jsx("div", { className: styles.assignmentsTable, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "User" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Due Date" }), _jsx("th", { children: "Completed" }), _jsx("th", { children: "Certificate" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: trainingAssignments.map((assignment) => (_jsxs("tr", { children: [_jsxs("td", { children: [assignment.userId.firstName, " ", assignment.userId.lastName] }), _jsx("td", { children: assignment.userId.email }), _jsx("td", { children: assignment.userId.role }), _jsx("td", { children: _jsx("span", { className: styles.badge, style: { backgroundColor: getAssignmentStatusColor(assignment.status) }, children: assignment.status.replace('_', ' ') }) }), _jsx("td", { children: new Date(assignment.dueDate).toLocaleDateString() }), _jsx("td", { children: assignment.completedAt
                                                                        ? new Date(assignment.completedAt).toLocaleDateString()
                                                                        : '-' }), _jsx("td", { children: assignment.certificateId ? (_jsx("span", { className: styles.certificateIssued, children: "\u2713 Issued" })) : assignment.status === 'completed' ? (_jsx("span", { className: styles.certificateMissing, children: "\u26A0 Missing" })) : ('-') }), _jsxs("td", { className: styles.actions, children: [_jsx("button", { className: styles.resetBtn, onClick: () => handleResetAssignment(assignment._id, `${assignment.userId.firstName} ${assignment.userId.lastName}`), title: "Reset training to allow user to retake", children: "Reset" }), assignment.status === 'completed' && !assignment.certificateId && (_jsx("button", { className: styles.issueCertBtn, onClick: () => handleIssueCertificate(assignment._id, `${assignment.userId.firstName} ${assignment.userId.lastName}`), title: "Issue certificate for this completed training", children: "Issue Cert" }))] })] }, assignment._id))) })] }) }))] }))] })] }) })), _jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Training #" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Due Date" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: trainings.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: styles.noData, children: "No trainings found. Create your first training!" }) })) : (trainings.map((training) => (_jsxs("tr", { children: [_jsx("td", { children: training.trainingNumber }), _jsx("td", { children: training.title }), _jsx("td", { children: training.trainingType }), _jsx("td", { children: training.category }), _jsx("td", { children: _jsx("span", { className: styles.badge, style: { backgroundColor: getPriorityColor(training.priority) }, children: training.priority }) }), _jsx("td", { children: _jsx("span", { className: styles.badge, style: { backgroundColor: getStatusColor(training.status) }, children: training.status.replace('_', ' ') }) }), _jsx("td", { children: new Date(training.dueDate).toLocaleDateString() }), _jsxs("td", { className: styles.actions, children: [_jsx("button", { className: styles.viewBtn, onClick: () => handleViewTraining(training), children: "Manage" }), _jsx("button", { className: styles.editBtn, onClick: () => handleEdit(training), children: "Edit" }), training.status === 'draft' && (_jsx("button", { className: styles.statusBtn, onClick: () => handleStatusChange(training, 'published'), children: "Publish" })), _jsx("button", { className: styles.deleteBtn, onClick: () => handleDelete(training._id), children: "Delete" })] })] }, training._id)))) })] }) })] }));
};
export default TrainingList;
