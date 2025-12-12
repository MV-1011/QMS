import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import apiService from '../../services/api';
import { useNavigation } from '../../services/NavigationContext';
import PageHeader from '../../components/PageHeader';
import styles from './MyTrainings.module.css';

interface Assignment {
  _id: string;
  trainingId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    trainingType: string;
    priority: string;
    duration: number;
  };
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  dueDate: string;
  status: string;
  contentProgress: {
    contentId: string;
    completed: boolean;
    timeSpent?: number;
  }[];
  examAttempts: number;
  lastExamScore?: number;
  bestExamScore?: number;
}

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'ppt' | 'document' | 'link';
  contentUrl: string;
  slides?: string[]; // Array of slide image URLs for PPT content
  slideCount?: number; // Number of slides in PPT
  fileName?: string;
  duration?: number;
  order: number;
  isRequired: boolean;
}

// Get the API base URL for file access
const getFileUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5040';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

interface TrainingViewProps {
  assignmentId: string;
  onBack: () => void;
  onRefresh: () => void;
}

// Component to handle PPT processing for existing PPT content without slides
const PptProcessingViewer: React.FC<{
  content: ContentItem;
  fileUrl: string;
}> = ({ content, fileUrl }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<ContentItem | null>(null);

  const handleProcessSlides = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await apiService.processPptSlides(content._id);
      if (response.success && response.data.slides && response.data.slides.length > 0) {
        setProcessedContent(response.data);
      } else {
        setError(response.message || 'Failed to process slides');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process PPT file');
    } finally {
      setProcessing(false);
    }
  };

  // If we now have processed content with slides, show a simple slideshow
  if (processedContent && processedContent.slides && processedContent.slides.length > 0) {
    return (
      <div className={styles.processingSuccess}>
        <div className={styles.successIcon}>✓</div>
        <h3>PPT Processed Successfully!</h3>
        <p>{processedContent.slides.length} slides are now ready.</p>
        <p className={styles.reloadNote}>Please refresh the page to view the slideshow.</p>
        <button onClick={() => window.location.reload()} className={styles.reloadBtn}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={styles.documentWrapper}>
      <div className={styles.documentViewerLocal}>
        <div className={styles.documentIconLarge}>📊</div>
        <h3>{content.fileName || content.title}</h3>
        <p className={styles.documentTypeLabel}>PowerPoint Presentation</p>
        {content.description && (
          <p className={styles.documentDesc}>{content.description}</p>
        )}

        {!processing && !error && (
          <>
            <div className={styles.processingPrompt}>
              <p>This presentation needs to be processed for in-app viewing.</p>
              <button onClick={handleProcessSlides} className={styles.processBtn}>
                Process for Viewing
              </button>
            </div>
            <div className={styles.documentActions}>
              <p className={styles.orText}>Or download to view externally:</p>
              <a
                href={fileUrl}
                download={content.fileName}
                className={styles.downloadBtn}
              >
                Download File
              </a>
            </div>
          </>
        )}

        {processing && (
          <div className={styles.processingStatus}>
            <div className={styles.spinner}></div>
            <p>Processing presentation...</p>
            <p className={styles.processingNote}>This may take a minute for large files.</p>
          </div>
        )}

        {error && (
          <div className={styles.processingError}>
            <p className={styles.errorText}>{error}</p>
            <div className={styles.documentActions}>
              <button onClick={handleProcessSlides} className={styles.retryBtn}>
                Retry
              </button>
              <a
                href={fileUrl}
                download={content.fileName}
                className={styles.downloadBtn}
              >
                Download Instead
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Content viewer component for different file types
const ContentViewer: React.FC<{
  content: ContentItem;
  onViewComplete: () => void;
  isCompleted: boolean;
  canComplete: boolean;
}> = ({ content, onViewComplete, isCompleted, canComplete }) => {
  const [viewStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [minTimeReached, setMinTimeReached] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [allSlidesViewed, setAllSlidesViewed] = useState(false);
  const [viewedSlides, setViewedSlides] = useState<Set<number>>(new Set([0]));
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
  const goToSlide = (index: number) => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canMarkComplete = () => {
    if (isCompleted) return false;
    if (!canComplete) return false;

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

  return (
    <div className={styles.contentViewerContainer}>
      <div className={styles.viewerHeader}>
        <h3>{content.title}</h3>
        {content.description && (
          <p className={styles.contentDescription}>{content.description}</p>
        )}
        <div className={styles.viewerMeta}>
          <span className={styles.contentTypeBadge}>{content.contentType.toUpperCase()}</span>
          {content.duration && <span>Duration: {content.duration} min</span>}
          {content.contentType === 'ppt' && content.slides && content.slides.length > 0 && (
            <span>{content.slides.length} slides</span>
          )}
          {!isCompleted && !(content.contentType === 'ppt' && content.slides && content.slides.length > 0) && (
            <span className={styles.timeTracker}>
              Time spent: {formatTime(timeSpent)}
              {!minTimeReached && content.contentType !== 'video' && (
                <span className={styles.minTimeNote}>
                  {' '}(min: {formatTime(getMinimumTime())})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className={styles.viewerContent}>
        {content.contentType === 'video' && (
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              controls
              controlsList="nodownload"
              className={styles.videoPlayer}
              onEnded={() => setVideoEnded(true)}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.currentTime >= video.duration * 0.9) {
                  setMinTimeReached(true);
                }
              }}
            >
              <source src={fileUrl} type="video/mp4" />
              <source src={fileUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
            {!isCompleted && !videoEnded && (
              <div className={styles.videoOverlay}>
                <p>Watch the video to completion to mark as complete</p>
              </div>
            )}
          </div>
        )}

        {content.contentType === 'pdf' && (
          <div className={styles.pdfWrapper}>
            <iframe
              ref={iframeRef}
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              className={styles.pdfViewer}
              title={content.title}
              onLoad={() => setPdfLoaded(true)}
            />
            {!pdfLoaded && (
              <div className={styles.loadingOverlay}>
                <p>Loading PDF...</p>
              </div>
            )}
          </div>
        )}

        {content.contentType === 'ppt' && content.slides && content.slides.length > 0 ? (
          <div className={styles.slideshowWrapper}>
            <div className={styles.slideContainer}>
              <img
                src={getFileUrl(content.slides[currentSlide])}
                alt={`Slide ${currentSlide + 1}`}
                className={styles.slideImage}
              />
            </div>
            <div className={styles.slideControls}>
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={styles.slideNavBtn}
              >
                ◀ Previous
              </button>
              <div className={styles.slideInfo}>
                <span className={styles.slideCounter}>
                  Slide {currentSlide + 1} of {content.slides.length}
                </span>
                <span className={styles.slidesViewed}>
                  ({viewedSlides.size} of {content.slides.length} viewed)
                </span>
              </div>
              <button
                onClick={nextSlide}
                disabled={currentSlide === content.slides.length - 1}
                className={styles.slideNavBtn}
              >
                Next ▶
              </button>
            </div>
            <div className={styles.slideThumbnails}>
              {content.slides.map((slide, index) => (
                <div
                  key={index}
                  className={`${styles.thumbnail} ${currentSlide === index ? styles.activeThumbnail : ''} ${viewedSlides.has(index) ? styles.viewedThumbnail : ''}`}
                  onClick={() => goToSlide(index)}
                >
                  <img src={getFileUrl(slide)} alt={`Thumbnail ${index + 1}`} />
                  <span className={styles.thumbnailNumber}>{index + 1}</span>
                  {viewedSlides.has(index) && <span className={styles.viewedCheck}>✓</span>}
                </div>
              ))}
            </div>
            {!allSlidesViewed && (
              <div className={styles.slideProgress}>
                <span className={styles.slideProgressText}>
                  View all {content.slides.length} slides to complete this content
                </span>
              </div>
            )}
          </div>
        ) : content.contentType === 'ppt' && (!content.slides || content.slides.length === 0) ? (
          <PptProcessingViewer content={content} fileUrl={fileUrl} />
        ) : content.contentType === 'document' && (
          <div className={styles.documentWrapper}>
            <div className={styles.documentViewerLocal}>
              <div className={styles.documentIconLarge}>📄</div>
              <h3>{content.fileName || content.title}</h3>
              <p className={styles.documentTypeLabel}>Document</p>
              {content.description && (
                <p className={styles.documentDesc}>{content.description}</p>
              )}
              <div className={styles.documentActions}>
                <a
                  href={fileUrl}
                  download={content.fileName}
                  className={styles.downloadBtn}
                >
                  Download File
                </a>
              </div>
              <div className={styles.documentInstructions}>
                <h4>How to view this content:</h4>
                <ol>
                  <li>Click "Download File" above</li>
                  <li>Open the downloaded file with:
                    <ul>
                      <li>Microsoft PowerPoint</li>
                      <li>LibreOffice Impress</li>
                      <li>Google Slides (upload to Google Drive)</li>
                    </ul>
                  </li>
                  <li>Review all slides/pages thoroughly</li>
                  <li>Return here and click "Mark as Completed" when done</li>
                </ol>
              </div>
              <p className={styles.documentNote}>
                <strong>Note:</strong> The timer above tracks your time on this page.
                Keep this page open while reviewing the document to track your viewing time.
              </p>
            </div>
          </div>
        )}

        {content.contentType === 'link' && (
          <div className={styles.linkWrapper}>
            <iframe
              src={content.contentUrl}
              className={styles.linkViewer}
              title={content.title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      <div className={styles.viewerActions}>
        {isCompleted ? (
          <div className={styles.completedStatus}>
            <span className={styles.checkmark}>✓</span>
            Content Completed
          </div>
        ) : canComplete ? (
          <button
            onClick={onViewComplete}
            className={`${styles.completeBtn} ${!canMarkComplete() ? styles.disabled : ''}`}
            disabled={!canMarkComplete()}
          >
            {canMarkComplete()
              ? 'Mark as Completed'
              : content.contentType === 'video'
                ? 'Watch video to completion first'
                : content.contentType === 'ppt' && content.slides && content.slides.length > 0
                  ? `View all ${content.slides.length - viewedSlides.size} remaining slides`
                  : `View for ${formatTime(Math.max(0, getMinimumTime() - timeSpent))} more`
            }
          </button>
        ) : (
          <div className={styles.lockedStatus}>
            <span className={styles.lockIcon}>🔒</span>
            Complete previous content first
          </div>
        )}
      </div>
    </div>
  );
};

const TrainingView: React.FC<TrainingViewProps> = ({ assignmentId, onBack, onRefresh }) => {
  const [assignment, setAssignment] = useState<any>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [showExam, setShowExam] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  const [examAnswers, setExamAnswers] = useState<{ [key: string]: number[] }>({});
  const [examResult, setExamResult] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [contentViewKey, setContentViewKey] = useState(0);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  // Find the first incomplete content to set as active
  useEffect(() => {
    if (assignment && content.length > 0) {
      const firstIncomplete = content.findIndex((item) => {
        const progress = assignment.contentProgress?.find((p: any) => p.contentId === item._id);
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
    } catch (error) {
      console.error('Failed to load assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTraining = async () => {
    try {
      await apiService.startTraining(assignmentId);
      loadAssignment();
    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const handleCompleteContent = async (contentId: string, timeSpent?: number) => {
    try {
      await apiService.completeContent(assignmentId, contentId, timeSpent);
      await loadAssignment();

      // Reset content viewer to track new content
      setContentViewKey(prev => prev + 1);

      // Move to next content or exam
      if (activeContentIndex < content.length - 1) {
        setActiveContentIndex(activeContentIndex + 1);
      }
    } catch (error) {
      console.error('Failed to mark content as complete:', error);
    }
  };

  // Check if content at index can be accessed (must complete all previous content)
  const canAccessContent = (index: number) => {
    if (index === 0) return true;

    // Check all previous content is completed
    for (let i = 0; i < index; i++) {
      const progress = assignment?.contentProgress?.find((p: any) => p.contentId === content[i]._id);
      if (!progress?.completed) {
        return false;
      }
    }
    return true;
  };

  // Handle content item click - only allow if accessible
  const handleContentClick = (index: number) => {
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start exam');
    }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number, isMultiple: boolean) => {
    setExamAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(answerIndex)) {
          return { ...prev, [questionId]: currentAnswers.filter(a => a !== answerIndex) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, answerIndex] };
        }
      } else {
        return { ...prev, [questionId]: [answerIndex] };
      }
    });
  };

  const handleSubmitExam = async () => {
    if (!attemptId || !examData) return;

    const answers = examData.questions.map((q: any) => ({
      questionId: q._id,
      selectedAnswers: examAnswers[q._id] || [],
    }));

    try {
      const response = await apiService.submitExam(attemptId, answers);
      setExamResult(response.data);
      await loadAssignment();
      onRefresh();
    } catch (error) {
      console.error('Failed to submit exam:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading training...</div>;
  }

  if (!assignment) {
    return <div className={styles.error}>Assignment not found</div>;
  }

  const training = assignment.trainingId;
  const allContentCompleted = assignment.contentProgress?.every((p: any) => p.completed);
  const canTakeExam = exam && allContentCompleted && ['exam_pending', 'exam_failed'].includes(assignment.status);

  // Exam View
  if (showExam && examData && !examResult) {
    return (
      <div className={styles.examContainer}>
        <div className={styles.examHeader}>
          <h2>{examData.title}</h2>
          <div className={styles.examInfo}>
            <span>Passing Score: {examData.passingScore}%</span>
            {examData.timeLimit && <span>Time Limit: {examData.timeLimit} min</span>}
            <span>Attempt: {examData.attemptNumber} of {examData.maxAttempts}</span>
          </div>
        </div>
        {examData.instructions && (
          <div className={styles.examInstructions}>{examData.instructions}</div>
        )}
        <div className={styles.questions}>
          {examData.questions.map((q: any, index: number) => (
            <div key={q._id} className={styles.question}>
              <div className={styles.questionText}>
                <span className={styles.questionNumber}>{index + 1}.</span>
                {q.questionText}
                <span className={styles.points}>({q.points} pts)</span>
              </div>
              <div className={styles.options}>
                {q.options.map((option: string, optIndex: number) => (
                  <label key={optIndex} className={styles.option}>
                    <input
                      type={q.questionType === 'multiple_select' ? 'checkbox' : 'radio'}
                      name={`question-${q._id}`}
                      checked={(examAnswers[q._id] || []).includes(optIndex)}
                      onChange={() => handleAnswerChange(q._id, optIndex, q.questionType === 'multiple_select')}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.examActions}>
          <button onClick={() => setShowExam(false)} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSubmitExam} className={styles.submitBtn}>
            Submit Exam
          </button>
        </div>
      </div>
    );
  }

  // Exam Result View
  if (examResult) {
    return (
      <div className={styles.resultContainer}>
        <div className={`${styles.resultHeader} ${examResult.passed ? styles.passed : styles.failed}`}>
          <h2>{examResult.passed ? 'Congratulations!' : 'Not Passed'}</h2>
          <div className={styles.score}>
            <span className={styles.scoreValue}>{examResult.score}%</span>
            <span className={styles.scoreLabel}>Your Score</span>
          </div>
        </div>
        <div className={styles.resultDetails}>
          <p>Points Earned: {examResult.pointsEarned} / {examResult.totalPoints}</p>
          <p>Attempt: {examResult.attemptNumber}</p>
          {examResult.passed && (
            <p className={styles.successMessage}>
              Your certificate has been issued! You can view it in My Certificates.
            </p>
          )}
          {!examResult.passed && assignment.examAttempts < (exam?.maxAttempts || 3) && (
            <p className={styles.retryMessage}>
              You can retry the exam. {(exam?.maxAttempts || 3) - assignment.examAttempts} attempts remaining.
            </p>
          )}
        </div>
        <div className={styles.resultActions}>
          <button onClick={onBack} className={styles.backBtn}>
            Back to My Trainings
          </button>
          {!examResult.passed && assignment.examAttempts < (exam?.maxAttempts || 3) && (
            <button onClick={() => { setExamResult(null); handleStartExam(); }} className={styles.retryBtn}>
              Retry Exam
            </button>
          )}
        </div>
      </div>
    );
  }

  // Training Content View
  return (
    <div className={styles.trainingView}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>&larr; Back</button>
        <div className={styles.trainingInfo}>
          <h2>{training.title}</h2>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${styles[training.priority.toLowerCase()]}`}>
              {training.priority}
            </span>
            <span className={styles.category}>{training.category}</span>
            <span className={styles.status}>{assignment.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {assignment.status === 'assigned' && (
        <div className={styles.startPrompt}>
          <p>{training.description}</p>
          <p><strong>Duration:</strong> {training.duration} minutes</p>
          <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
          <button onClick={handleStartTraining} className={styles.startBtn}>
            Start Training
          </button>
        </div>
      )}

      {assignment.status !== 'assigned' && (
        <div className={styles.contentArea}>
          <div className={styles.sidebar}>
            <h3>Content</h3>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${assignment.contentProgress?.length
                    ? (assignment.contentProgress.filter((p: any) => p.completed).length / assignment.contentProgress.length) * 100
                    : 0}%`
                }}
              />
            </div>
            <p className={styles.progressText}>
              {assignment.contentProgress?.filter((p: any) => p.completed).length || 0} / {content.length} completed
            </p>
            <ul className={styles.contentList}>
              {content.map((item, index) => {
                const progress = assignment.contentProgress?.find((p: any) => p.contentId === item._id);
                const isAccessible = canAccessContent(index);
                return (
                  <li
                    key={item._id}
                    className={`${styles.contentItem} ${activeContentIndex === index ? styles.active : ''} ${progress?.completed ? styles.completed : ''} ${!isAccessible ? styles.locked : ''}`}
                    onClick={() => handleContentClick(index)}
                    title={!isAccessible ? 'Complete previous content first' : item.title}
                  >
                    <span className={styles.contentIcon}>
                      {progress?.completed ? '✓' : !isAccessible ? '🔒' : index + 1}
                    </span>
                    <span className={styles.contentTitle}>{item.title}</span>
                    <span className={styles.contentType}>{item.contentType}</span>
                  </li>
                );
              })}
              {exam && (
                <li
                  className={`${styles.contentItem} ${styles.examItem} ${canTakeExam ? '' : styles.locked}`}
                  onClick={canTakeExam ? handleStartExam : undefined}
                >
                  <span className={styles.contentIcon}>
                    {assignment.status === 'completed' ? '✓' : '📝'}
                  </span>
                  <span className={styles.contentTitle}>Final Exam</span>
                  {!canTakeExam && !allContentCompleted && (
                    <span className={styles.lockMessage}>Complete all content first</span>
                  )}
                </li>
              )}
            </ul>
          </div>

          <div className={styles.mainContent}>
            {content[activeContentIndex] && (
              <ContentViewer
                key={`${content[activeContentIndex]._id}-${contentViewKey}`}
                content={content[activeContentIndex]}
                isCompleted={!!assignment.contentProgress?.find((p: any) => p.contentId === content[activeContentIndex]._id)?.completed}
                canComplete={canAccessContent(activeContentIndex)}
                onViewComplete={() => handleCompleteContent(content[activeContentIndex]._id)}
              />
            )}
            {content.length === 0 && (
              <div className={styles.noContent}>
                <span className={styles.noContentIcon}>📭</span>
                <h3>No content available</h3>
                <p>This training has no content uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {assignment.status === 'completed' && (
        <div className={styles.completedBanner}>
          <span>Training Completed!</span>
          {assignment.bestExamScore && <span>Best Score: {assignment.bestExamScore}%</span>}
        </div>
      )}
    </div>
  );
};

const MyTrainings: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
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
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['assigned', 'in_progress', 'exam_pending', 'exam_failed'].includes(a.status);
    if (filter === 'completed') return a.status === 'completed';
    return a.status === filter;
  });

  const getStatusBadgeClass = (status: string) => {
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
    return (
      <TrainingView
        assignmentId={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
        onRefresh={loadAssignments}
      />
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader icon={<GraduationCap size={24} />} title="My Trainings">
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <div className={styles.loading}>Loading your trainings...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📚</span>
          <h3>No trainings found</h3>
          <p>You don't have any {filter !== 'all' ? filter : ''} trainings assigned.</p>
        </div>
      ) : (
        <div className={styles.trainingList}>
          {filteredAssignments.map(assignment => (
            <div
              key={assignment._id}
              className={styles.trainingCard}
              onClick={() => setSelectedAssignment(assignment._id)}
            >
              <div className={styles.cardHeader}>
                <h3>{assignment.trainingId.title}</h3>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(assignment.status)}`}>
                  {assignment.status.replace('_', ' ')}
                </span>
              </div>
              <p className={styles.description}>{assignment.trainingId.description}</p>
              <div className={styles.cardMeta}>
                <span className={styles.category}>{assignment.trainingId.category}</span>
                <span className={styles.type}>{assignment.trainingId.trainingType}</span>
                <span className={styles.priority}>{assignment.trainingId.priority}</span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.dueDate}>
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
                {assignment.contentProgress && (
                  <span className={styles.progress}>
                    {assignment.contentProgress.filter(p => p.completed).length} / {assignment.contentProgress.length} completed
                  </span>
                )}
                {assignment.bestExamScore !== undefined && (
                  <span className={styles.score}>Best Score: {assignment.bestExamScore}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrainings;
