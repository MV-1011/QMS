import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import { useNavigation } from '../../services/NavigationContext';
import styles from './MyTrainings.module.css';
// Get the API base URL for file access
const getFileUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5040';
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
// Component to handle PPT processing for existing PPT content without slides
const PptProcessingViewer = ({ content, fileUrl }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [processedContent, setProcessedContent] = useState(null);
    const handleProcessSlides = async () => {
        setProcessing(true);
        setError(null);
        try {
            const response = await apiService.processPptSlides(content._id);
            if (response.success && response.data.slides && response.data.slides.length > 0) {
                setProcessedContent(response.data);
            }
            else {
                setError(response.message || 'Failed to process slides');
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to process PPT file');
        }
        finally {
            setProcessing(false);
        }
    };
    // If we now have processed content with slides, show a simple slideshow
    if (processedContent && processedContent.slides && processedContent.slides.length > 0) {
        return (_jsxs("div", { className: styles.processingSuccess, children: [_jsx("div", { className: styles.successIcon, children: "\u2713" }), _jsx("h3", { children: "PPT Processed Successfully!" }), _jsxs("p", { children: [processedContent.slides.length, " slides are now ready."] }), _jsx("p", { className: styles.reloadNote, children: "Please refresh the page to view the slideshow." }), _jsx("button", { onClick: () => window.location.reload(), className: styles.reloadBtn, children: "Reload Page" })] }));
    }
    return (_jsx("div", { className: styles.documentWrapper, children: _jsxs("div", { className: styles.documentViewerLocal, children: [_jsx("div", { className: styles.documentIconLarge, children: "\uD83D\uDCCA" }), _jsx("h3", { children: content.fileName || content.title }), _jsx("p", { className: styles.documentTypeLabel, children: "PowerPoint Presentation" }), content.description && (_jsx("p", { className: styles.documentDesc, children: content.description })), !processing && !error && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.processingPrompt, children: [_jsx("p", { children: "This presentation needs to be processed for in-app viewing." }), _jsx("button", { onClick: handleProcessSlides, className: styles.processBtn, children: "Process for Viewing" })] }), _jsxs("div", { className: styles.documentActions, children: [_jsx("p", { className: styles.orText, children: "Or download to view externally:" }), _jsx("a", { href: fileUrl, download: content.fileName, className: styles.downloadBtn, children: "Download File" })] })] })), processing && (_jsxs("div", { className: styles.processingStatus, children: [_jsx("div", { className: styles.spinner }), _jsx("p", { children: "Processing presentation..." }), _jsx("p", { className: styles.processingNote, children: "This may take a minute for large files." })] })), error && (_jsxs("div", { className: styles.processingError, children: [_jsx("p", { className: styles.errorText, children: error }), _jsxs("div", { className: styles.documentActions, children: [_jsx("button", { onClick: handleProcessSlides, className: styles.retryBtn, children: "Retry" }), _jsx("a", { href: fileUrl, download: content.fileName, className: styles.downloadBtn, children: "Download Instead" })] })] }))] }) }));
};
// Content viewer component for different file types
const ContentViewer = ({ content, onViewComplete, isCompleted, canComplete }) => {
    const [viewStartTime] = useState(Date.now());
    const [timeSpent, setTimeSpent] = useState(0);
    const [minTimeReached, setMinTimeReached] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [allSlidesViewed, setAllSlidesViewed] = useState(false);
    const [viewedSlides, setViewedSlides] = useState(new Set([0]));
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    // Minimum time requirements in seconds based on content type
    const getMinimumTime = () => {
        if (content.contentType === 'video') {
            return (content.duration || 1) * 60; // duration is in minutes
        }
        // For PPT with slides - 10 seconds per slide minimum
        if (content.contentType === 'ppt' && content.slides && content.slides.length > 0) {
            return content.slides.length * 10;
        }
        // For documents/PDFs - minimum 30 seconds per assumed page, or at least 60 seconds
        return Math.max(60, 30);
    };
    // Handle slide navigation
    const goToSlide = (index) => {
        if (content.slides && index >= 0 && index < content.slides.length) {
            setCurrentSlide(index);
            setViewedSlides(prev => new Set([...prev, index]));
        }
    };
    const nextSlide = () => {
        if (content.slides && currentSlide < content.slides.length - 1) {
            goToSlide(currentSlide + 1);
        }
    };
    const prevSlide = () => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    };
    // Check if all slides have been viewed
    useEffect(() => {
        if (content.slides && content.slides.length > 0) {
            if (viewedSlides.size >= content.slides.length) {
                setAllSlidesViewed(true);
            }
        }
    }, [viewedSlides, content.slides]);
    // Track time spent viewing content
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - viewStartTime) / 1000);
            setTimeSpent(elapsed);
            const minTime = getMinimumTime();
            if (elapsed >= minTime && !minTimeReached) {
                setMinTimeReached(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [viewStartTime, minTimeReached]);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const canMarkComplete = () => {
        if (isCompleted)
            return false;
        if (!canComplete)
            return false;
        // For videos, must watch at least 90% or video must have ended
        if (content.contentType === 'video') {
            return videoEnded || minTimeReached;
        }
        // For PPT with slides, just need to view all slides (no time requirement)
        if (content.contentType === 'ppt' && content.slides && content.slides.length > 0) {
            return allSlidesViewed;
        }
        // For documents, must spend minimum time
        return minTimeReached;
    };
    const fileUrl = getFileUrl(content.contentUrl);
    return (_jsxs("div", { className: styles.contentViewerContainer, children: [_jsxs("div", { className: styles.viewerHeader, children: [_jsx("h3", { children: content.title }), content.description && (_jsx("p", { className: styles.contentDescription, children: content.description })), _jsxs("div", { className: styles.viewerMeta, children: [_jsx("span", { className: styles.contentTypeBadge, children: content.contentType.toUpperCase() }), content.duration && _jsxs("span", { children: ["Duration: ", content.duration, " min"] }), content.contentType === 'ppt' && content.slides && content.slides.length > 0 && (_jsxs("span", { children: [content.slides.length, " slides"] })), !isCompleted && !(content.contentType === 'ppt' && content.slides && content.slides.length > 0) && (_jsxs("span", { className: styles.timeTracker, children: ["Time spent: ", formatTime(timeSpent), !minTimeReached && content.contentType !== 'video' && (_jsxs("span", { className: styles.minTimeNote, children: [' ', "(min: ", formatTime(getMinimumTime()), ")"] }))] }))] })] }), _jsxs("div", { className: styles.viewerContent, children: [content.contentType === 'video' && (_jsxs("div", { className: styles.videoWrapper, children: [_jsxs("video", { ref: videoRef, controls: true, controlsList: "nodownload", className: styles.videoPlayer, onEnded: () => setVideoEnded(true), onTimeUpdate: (e) => {
                                    const video = e.currentTarget;
                                    if (video.currentTime >= video.duration * 0.9) {
                                        setMinTimeReached(true);
                                    }
                                }, children: [_jsx("source", { src: fileUrl, type: "video/mp4" }), _jsx("source", { src: fileUrl, type: "video/webm" }), "Your browser does not support the video tag."] }), !isCompleted && !videoEnded && (_jsx("div", { className: styles.videoOverlay, children: _jsx("p", { children: "Watch the video to completion to mark as complete" }) }))] })), content.contentType === 'pdf' && (_jsxs("div", { className: styles.pdfWrapper, children: [_jsx("iframe", { ref: iframeRef, src: `${fileUrl}#toolbar=0&navpanes=0`, className: styles.pdfViewer, title: content.title, onLoad: () => setPdfLoaded(true) }), !pdfLoaded && (_jsx("div", { className: styles.loadingOverlay, children: _jsx("p", { children: "Loading PDF..." }) }))] })), content.contentType === 'ppt' && content.slides && content.slides.length > 0 ? (_jsxs("div", { className: styles.slideshowWrapper, children: [_jsx("div", { className: styles.slideContainer, children: _jsx("img", { src: getFileUrl(content.slides[currentSlide]), alt: `Slide ${currentSlide + 1}`, className: styles.slideImage }) }), _jsxs("div", { className: styles.slideControls, children: [_jsx("button", { onClick: prevSlide, disabled: currentSlide === 0, className: styles.slideNavBtn, children: "\u25C0 Previous" }), _jsxs("div", { className: styles.slideInfo, children: [_jsxs("span", { className: styles.slideCounter, children: ["Slide ", currentSlide + 1, " of ", content.slides.length] }), _jsxs("span", { className: styles.slidesViewed, children: ["(", viewedSlides.size, " of ", content.slides.length, " viewed)"] })] }), _jsx("button", { onClick: nextSlide, disabled: currentSlide === content.slides.length - 1, className: styles.slideNavBtn, children: "Next \u25B6" })] }), _jsx("div", { className: styles.slideThumbnails, children: content.slides.map((slide, index) => (_jsxs("div", { className: `${styles.thumbnail} ${currentSlide === index ? styles.activeThumbnail : ''} ${viewedSlides.has(index) ? styles.viewedThumbnail : ''}`, onClick: () => goToSlide(index), children: [_jsx("img", { src: getFileUrl(slide), alt: `Thumbnail ${index + 1}` }), _jsx("span", { className: styles.thumbnailNumber, children: index + 1 }), viewedSlides.has(index) && _jsx("span", { className: styles.viewedCheck, children: "\u2713" })] }, index))) }), !allSlidesViewed && (_jsx("div", { className: styles.slideProgress, children: _jsxs("span", { className: styles.slideProgressText, children: ["View all ", content.slides.length, " slides to complete this content"] }) }))] })) : content.contentType === 'ppt' && (!content.slides || content.slides.length === 0) ? (_jsx(PptProcessingViewer, { content: content, fileUrl: fileUrl })) : content.contentType === 'document' && (_jsx("div", { className: styles.documentWrapper, children: _jsxs("div", { className: styles.documentViewerLocal, children: [_jsx("div", { className: styles.documentIconLarge, children: "\uD83D\uDCC4" }), _jsx("h3", { children: content.fileName || content.title }), _jsx("p", { className: styles.documentTypeLabel, children: "Document" }), content.description && (_jsx("p", { className: styles.documentDesc, children: content.description })), _jsx("div", { className: styles.documentActions, children: _jsx("a", { href: fileUrl, download: content.fileName, className: styles.downloadBtn, children: "Download File" }) }), _jsxs("div", { className: styles.documentInstructions, children: [_jsx("h4", { children: "How to view this content:" }), _jsxs("ol", { children: [_jsx("li", { children: "Click \"Download File\" above" }), _jsxs("li", { children: ["Open the downloaded file with:", _jsxs("ul", { children: [_jsx("li", { children: "Microsoft PowerPoint" }), _jsx("li", { children: "LibreOffice Impress" }), _jsx("li", { children: "Google Slides (upload to Google Drive)" })] })] }), _jsx("li", { children: "Review all slides/pages thoroughly" }), _jsx("li", { children: "Return here and click \"Mark as Completed\" when done" })] })] }), _jsxs("p", { className: styles.documentNote, children: [_jsx("strong", { children: "Note:" }), " The timer above tracks your time on this page. Keep this page open while reviewing the document to track your viewing time."] })] }) })), content.contentType === 'link' && (_jsx("div", { className: styles.linkWrapper, children: _jsx("iframe", { src: content.contentUrl, className: styles.linkViewer, title: content.title, sandbox: "allow-scripts allow-same-origin" }) }))] }), _jsx("div", { className: styles.viewerActions, children: isCompleted ? (_jsxs("div", { className: styles.completedStatus, children: [_jsx("span", { className: styles.checkmark, children: "\u2713" }), "Content Completed"] })) : canComplete ? (_jsx("button", { onClick: onViewComplete, className: `${styles.completeBtn} ${!canMarkComplete() ? styles.disabled : ''}`, disabled: !canMarkComplete(), children: canMarkComplete()
                        ? 'Mark as Completed'
                        : content.contentType === 'video'
                            ? 'Watch video to completion first'
                            : content.contentType === 'ppt' && content.slides && content.slides.length > 0
                                ? `View all ${content.slides.length - viewedSlides.size} remaining slides`
                                : `View for ${formatTime(Math.max(0, getMinimumTime() - timeSpent))} more` })) : (_jsxs("div", { className: styles.lockedStatus, children: [_jsx("span", { className: styles.lockIcon, children: "\uD83D\uDD12" }), "Complete previous content first"] })) })] }));
};
const TrainingView = ({ assignmentId, onBack, onRefresh }) => {
    const [assignment, setAssignment] = useState(null);
    const [content, setContent] = useState([]);
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeContentIndex, setActiveContentIndex] = useState(0);
    const [showExam, setShowExam] = useState(false);
    const [examData, setExamData] = useState(null);
    const [examAnswers, setExamAnswers] = useState({});
    const [examResult, setExamResult] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [contentViewKey, setContentViewKey] = useState(0);
    useEffect(() => {
        loadAssignment();
    }, [assignmentId]);
    // Find the first incomplete content to set as active
    useEffect(() => {
        if (assignment && content.length > 0) {
            const firstIncomplete = content.findIndex((item) => {
                const progress = assignment.contentProgress?.find((p) => p.contentId === item._id);
                return !progress?.completed;
            });
            if (firstIncomplete >= 0) {
                setActiveContentIndex(firstIncomplete);
            }
        }
    }, [assignment, content]);
    const loadAssignment = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAssignmentDetails(assignmentId);
            setAssignment(response.data.assignment);
            setContent(response.data.content || []);
            setExam(response.data.exam);
        }
        catch (error) {
            console.error('Failed to load assignment:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleStartTraining = async () => {
        try {
            await apiService.startTraining(assignmentId);
            loadAssignment();
        }
        catch (error) {
            console.error('Failed to start training:', error);
        }
    };
    const handleCompleteContent = async (contentId, timeSpent) => {
        try {
            await apiService.completeContent(assignmentId, contentId, timeSpent);
            await loadAssignment();
            // Reset content viewer to track new content
            setContentViewKey(prev => prev + 1);
            // Move to next content or exam
            if (activeContentIndex < content.length - 1) {
                setActiveContentIndex(activeContentIndex + 1);
            }
        }
        catch (error) {
            console.error('Failed to mark content as complete:', error);
        }
    };
    // Check if content at index can be accessed (must complete all previous content)
    const canAccessContent = (index) => {
        if (index === 0)
            return true;
        // Check all previous content is completed
        for (let i = 0; i < index; i++) {
            const progress = assignment?.contentProgress?.find((p) => p.contentId === content[i]._id);
            if (!progress?.completed) {
                return false;
            }
        }
        return true;
    };
    // Handle content item click - only allow if accessible
    const handleContentClick = (index) => {
        if (canAccessContent(index)) {
            setActiveContentIndex(index);
            setContentViewKey(prev => prev + 1);
        }
    };
    const handleStartExam = async () => {
        try {
            const examResponse = await apiService.getExamForTaking(assignmentId);
            setExamData(examResponse.data);
            const attemptResponse = await apiService.startExamAttempt(assignmentId);
            setAttemptId(attemptResponse.data._id);
            setShowExam(true);
            setExamAnswers({});
            setExamResult(null);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to start exam');
        }
    };
    const handleAnswerChange = (questionId, answerIndex, isMultiple) => {
        setExamAnswers(prev => {
            if (isMultiple) {
                const currentAnswers = prev[questionId] || [];
                if (currentAnswers.includes(answerIndex)) {
                    return { ...prev, [questionId]: currentAnswers.filter(a => a !== answerIndex) };
                }
                else {
                    return { ...prev, [questionId]: [...currentAnswers, answerIndex] };
                }
            }
            else {
                return { ...prev, [questionId]: [answerIndex] };
            }
        });
    };
    const handleSubmitExam = async () => {
        if (!attemptId || !examData)
            return;
        const answers = examData.questions.map((q) => ({
            questionId: q._id,
            selectedAnswers: examAnswers[q._id] || [],
        }));
        try {
            const response = await apiService.submitExam(attemptId, answers);
            setExamResult(response.data);
            await loadAssignment();
            onRefresh();
        }
        catch (error) {
            console.error('Failed to submit exam:', error);
        }
    };
    if (loading) {
        return _jsx("div", { className: styles.loading, children: "Loading training..." });
    }
    if (!assignment) {
        return _jsx("div", { className: styles.error, children: "Assignment not found" });
    }
    const training = assignment.trainingId;
    const allContentCompleted = assignment.contentProgress?.every((p) => p.completed);
    const canTakeExam = exam && allContentCompleted && ['exam_pending', 'exam_failed'].includes(assignment.status);
    // Exam View
    if (showExam && examData && !examResult) {
        return (_jsxs("div", { className: styles.examContainer, children: [_jsxs("div", { className: styles.examHeader, children: [_jsx("h2", { children: examData.title }), _jsxs("div", { className: styles.examInfo, children: [_jsxs("span", { children: ["Passing Score: ", examData.passingScore, "%"] }), examData.timeLimit && _jsxs("span", { children: ["Time Limit: ", examData.timeLimit, " min"] }), _jsxs("span", { children: ["Attempt: ", examData.attemptNumber, " of ", examData.maxAttempts] })] })] }), examData.instructions && (_jsx("div", { className: styles.examInstructions, children: examData.instructions })), _jsx("div", { className: styles.questions, children: examData.questions.map((q, index) => (_jsxs("div", { className: styles.question, children: [_jsxs("div", { className: styles.questionText, children: [_jsxs("span", { className: styles.questionNumber, children: [index + 1, "."] }), q.questionText, _jsxs("span", { className: styles.points, children: ["(", q.points, " pts)"] })] }), _jsx("div", { className: styles.options, children: q.options.map((option, optIndex) => (_jsxs("label", { className: styles.option, children: [_jsx("input", { type: q.questionType === 'multiple_select' ? 'checkbox' : 'radio', name: `question-${q._id}`, checked: (examAnswers[q._id] || []).includes(optIndex), onChange: () => handleAnswerChange(q._id, optIndex, q.questionType === 'multiple_select') }), _jsx("span", { children: option })] }, optIndex))) })] }, q._id))) }), _jsxs("div", { className: styles.examActions, children: [_jsx("button", { onClick: () => setShowExam(false), className: styles.cancelBtn, children: "Cancel" }), _jsx("button", { onClick: handleSubmitExam, className: styles.submitBtn, children: "Submit Exam" })] })] }));
    }
    // Exam Result View
    if (examResult) {
        return (_jsxs("div", { className: styles.resultContainer, children: [_jsxs("div", { className: `${styles.resultHeader} ${examResult.passed ? styles.passed : styles.failed}`, children: [_jsx("h2", { children: examResult.passed ? 'Congratulations!' : 'Not Passed' }), _jsxs("div", { className: styles.score, children: [_jsxs("span", { className: styles.scoreValue, children: [examResult.score, "%"] }), _jsx("span", { className: styles.scoreLabel, children: "Your Score" })] })] }), _jsxs("div", { className: styles.resultDetails, children: [_jsxs("p", { children: ["Points Earned: ", examResult.pointsEarned, " / ", examResult.totalPoints] }), _jsxs("p", { children: ["Attempt: ", examResult.attemptNumber] }), examResult.passed && (_jsx("p", { className: styles.successMessage, children: "Your certificate has been issued! You can view it in My Certificates." })), !examResult.passed && assignment.examAttempts < (exam?.maxAttempts || 3) && (_jsxs("p", { className: styles.retryMessage, children: ["You can retry the exam. ", (exam?.maxAttempts || 3) - assignment.examAttempts, " attempts remaining."] }))] }), _jsxs("div", { className: styles.resultActions, children: [_jsx("button", { onClick: onBack, className: styles.backBtn, children: "Back to My Trainings" }), !examResult.passed && assignment.examAttempts < (exam?.maxAttempts || 3) && (_jsx("button", { onClick: () => { setExamResult(null); handleStartExam(); }, className: styles.retryBtn, children: "Retry Exam" }))] })] }));
    }
    // Training Content View
    return (_jsxs("div", { className: styles.trainingView, children: [_jsxs("div", { className: styles.header, children: [_jsx("button", { onClick: onBack, className: styles.backBtn, children: "\u2190 Back" }), _jsxs("div", { className: styles.trainingInfo, children: [_jsx("h2", { children: training.title }), _jsxs("div", { className: styles.meta, children: [_jsx("span", { className: `${styles.badge} ${styles[training.priority.toLowerCase()]}`, children: training.priority }), _jsx("span", { className: styles.category, children: training.category }), _jsx("span", { className: styles.status, children: assignment.status.replace('_', ' ') })] })] })] }), assignment.status === 'assigned' && (_jsxs("div", { className: styles.startPrompt, children: [_jsx("p", { children: training.description }), _jsxs("p", { children: [_jsx("strong", { children: "Duration:" }), " ", training.duration, " minutes"] }), _jsxs("p", { children: [_jsx("strong", { children: "Due Date:" }), " ", new Date(assignment.dueDate).toLocaleDateString()] }), _jsx("button", { onClick: handleStartTraining, className: styles.startBtn, children: "Start Training" })] })), assignment.status !== 'assigned' && (_jsxs("div", { className: styles.contentArea, children: [_jsxs("div", { className: styles.sidebar, children: [_jsx("h3", { children: "Content" }), _jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: {
                                        width: `${assignment.contentProgress?.length
                                            ? (assignment.contentProgress.filter((p) => p.completed).length / assignment.contentProgress.length) * 100
                                            : 0}%`
                                    } }) }), _jsxs("p", { className: styles.progressText, children: [assignment.contentProgress?.filter((p) => p.completed).length || 0, " / ", content.length, " completed"] }), _jsxs("ul", { className: styles.contentList, children: [content.map((item, index) => {
                                        const progress = assignment.contentProgress?.find((p) => p.contentId === item._id);
                                        const isAccessible = canAccessContent(index);
                                        return (_jsxs("li", { className: `${styles.contentItem} ${activeContentIndex === index ? styles.active : ''} ${progress?.completed ? styles.completed : ''} ${!isAccessible ? styles.locked : ''}`, onClick: () => handleContentClick(index), title: !isAccessible ? 'Complete previous content first' : item.title, children: [_jsx("span", { className: styles.contentIcon, children: progress?.completed ? '✓' : !isAccessible ? '🔒' : index + 1 }), _jsx("span", { className: styles.contentTitle, children: item.title }), _jsx("span", { className: styles.contentType, children: item.contentType })] }, item._id));
                                    }), exam && (_jsxs("li", { className: `${styles.contentItem} ${styles.examItem} ${canTakeExam ? '' : styles.locked}`, onClick: canTakeExam ? handleStartExam : undefined, children: [_jsx("span", { className: styles.contentIcon, children: assignment.status === 'completed' ? '✓' : '📝' }), _jsx("span", { className: styles.contentTitle, children: "Final Exam" }), !canTakeExam && !allContentCompleted && (_jsx("span", { className: styles.lockMessage, children: "Complete all content first" }))] }))] })] }), _jsxs("div", { className: styles.mainContent, children: [content[activeContentIndex] && (_jsx(ContentViewer, { content: content[activeContentIndex], isCompleted: !!assignment.contentProgress?.find((p) => p.contentId === content[activeContentIndex]._id)?.completed, canComplete: canAccessContent(activeContentIndex), onViewComplete: () => handleCompleteContent(content[activeContentIndex]._id) }, `${content[activeContentIndex]._id}-${contentViewKey}`)), content.length === 0 && (_jsxs("div", { className: styles.noContent, children: [_jsx("span", { className: styles.noContentIcon, children: "\uD83D\uDCED" }), _jsx("h3", { children: "No content available" }), _jsx("p", { children: "This training has no content uploaded yet." })] }))] })] })), assignment.status === 'completed' && (_jsxs("div", { className: styles.completedBanner, children: [_jsx("span", { children: "Training Completed!" }), assignment.bestExamScore && _jsxs("span", { children: ["Best Score: ", assignment.bestExamScore, "%"] })] }))] }));
};
const MyTrainings = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const { navigationParams, clearParams } = useNavigation();
    useEffect(() => {
        loadAssignments();
    }, []);
    // Auto-open assignment if navigated with assignmentId param
    useEffect(() => {
        if (navigationParams.assignmentId && !selectedAssignment) {
            setSelectedAssignment(navigationParams.assignmentId);
            clearParams(); // Clear params after using them
        }
    }, [navigationParams.assignmentId, selectedAssignment, clearParams]);
    const loadAssignments = async () => {
        try {
            setLoading(true);
            const response = await apiService.getMyAssignments();
            setAssignments(response.data);
        }
        catch (error) {
            console.error('Failed to load assignments:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredAssignments = assignments.filter(a => {
        if (filter === 'all')
            return true;
        if (filter === 'pending')
            return ['assigned', 'in_progress', 'exam_pending', 'exam_failed'].includes(a.status);
        if (filter === 'completed')
            return a.status === 'completed';
        return a.status === filter;
    });
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'completed': return styles.statusCompleted;
            case 'in_progress': return styles.statusInProgress;
            case 'exam_pending': return styles.statusExamPending;
            case 'exam_failed': return styles.statusExamFailed;
            case 'overdue': return styles.statusOverdue;
            default: return styles.statusAssigned;
        }
    };
    if (selectedAssignment) {
        return (_jsx(TrainingView, { assignmentId: selectedAssignment, onBack: () => setSelectedAssignment(null), onRefresh: loadAssignments }));
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsx("h1", { children: "My Trainings" }), _jsxs("div", { className: styles.filters, children: [_jsx("button", { className: `${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`, onClick: () => setFilter('all'), children: "All" }), _jsx("button", { className: `${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`, onClick: () => setFilter('pending'), children: "Pending" }), _jsx("button", { className: `${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`, onClick: () => setFilter('completed'), children: "Completed" })] })] }), loading ? (_jsx("div", { className: styles.loading, children: "Loading your trainings..." })) : filteredAssignments.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("span", { className: styles.emptyIcon, children: "\uD83D\uDCDA" }), _jsx("h3", { children: "No trainings found" }), _jsxs("p", { children: ["You don't have any ", filter !== 'all' ? filter : '', " trainings assigned."] })] })) : (_jsx("div", { className: styles.trainingList, children: filteredAssignments.map(assignment => (_jsxs("div", { className: styles.trainingCard, onClick: () => setSelectedAssignment(assignment._id), children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("h3", { children: assignment.trainingId.title }), _jsx("span", { className: `${styles.statusBadge} ${getStatusBadgeClass(assignment.status)}`, children: assignment.status.replace('_', ' ') })] }), _jsx("p", { className: styles.description, children: assignment.trainingId.description }), _jsxs("div", { className: styles.cardMeta, children: [_jsx("span", { className: styles.category, children: assignment.trainingId.category }), _jsx("span", { className: styles.type, children: assignment.trainingId.trainingType }), _jsx("span", { className: styles.priority, children: assignment.trainingId.priority })] }), _jsxs("div", { className: styles.cardFooter, children: [_jsxs("span", { className: styles.dueDate, children: ["Due: ", new Date(assignment.dueDate).toLocaleDateString()] }), assignment.contentProgress && (_jsxs("span", { className: styles.progress, children: [assignment.contentProgress.filter(p => p.completed).length, " / ", assignment.contentProgress.length, " completed"] })), assignment.bestExamScore !== undefined && (_jsxs("span", { className: styles.score, children: ["Best Score: ", assignment.bestExamScore, "%"] }))] })] }, assignment._id))) }))] }));
};
export default MyTrainings;
