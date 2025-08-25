import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraView from './components/CameraView';
import ControlDeck from './components/ControlDeck';
import CoPilotView from './components/CoPilotView';
import ReportPreviewSheet from './components/ReportPreviewSheet';
import ActionSheet from './components/ActionSheet';
import FloatingTranscript from './components/FloatingTranscript';
import SettingsPanel from './components/SettingsPanel';
import TemplateStudio from './components/TemplateStudio';
import ConnectionModal from './components/ConnectionModal';
import HistoryGallery from './components/HistoryGallery';
import TopStatusBar from './components/TopStatusBar';
import ModelSelectionSheet from './components/ModelSelectionSheet';
import DocumentHub from './components/DocumentHub';
import ProjectSnapshotModal from './components/ProjectSnapshotModal';
import LoginPage from './components/LoginPage';
import OnboardingGuide from './components/OnboardingGuide';
import BrandedTemplateCreator from './components/BrandedTemplateCreator';
import ReportCustomizationSheet from './components/ReportCustomizationSheet';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { useLocalization } from './hooks/useLocalization';
import { useInterval } from './hooks/useInterval';
import { IconHardHat, IconLoader, IconTriangleAlert, IconMail, IconSheet, IconFileText, IconCamera, IconMessageCircle, IconMic, IconShare, IconLink, IconPause, IconWrench, IconGlobe, IconBookCheck, IconArchive, IconCheckCircle2, IconAlertCircle } from './components/icons';
import { DetectedObject, ActionItem, LogItem, LogStatus, AnalysisResult, IntegrationService, ConnectionStatus, DashboardData, AppMode, CoPilotStatus, AiEngine, AnalysisMessage, User, CalculationStandard, ReportTemplate, ReportablePayload, Language, DownloadStatusMap, SoilLayer, StructuralCalculationPayload, GeotechnicalCalculationPayload, GeotechnicalAnalysisResult, StructuralAnalysisResult, TimelineItem, DocumentPayload, JobSafetyAnalysis, IntelligenceCardType } from './types';
import { supervisor, TaskIntent } from './services/agents/supervisorAgent';
import { generateReportPdf, PrintableContent } from './services/pdfService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import * as authService from './services/authService';
import * as projectService from './services/projectService';
import { localLlmService } from './services/localLlmService';


// @ts-ignore
const getScreenshot = window.getScreenshot as (options: { type: 'app' | 'full' }) => Promise<string | null> | undefined;

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type ContextCaptureState = 'idle' | 'capturing' | 'captured';
type ToastType = 'success' | 'error' | 'warning' | 'info';

const Toast: React.FC<{ message: string; type: ToastType }> = ({ message, type }) => {
    const toastConfig = {
        success: { Icon: IconCheckCircle2, color: 'text-green-400' },
        error: { Icon: IconAlertCircle, color: 'text-red-400' },
        warning: { Icon: IconTriangleAlert, color: 'text-orange-400' },
        info: { Icon: IconMessageCircle, color: 'text-blue-400' },
    };

    const { Icon, color } = toastConfig[type];

    return (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 max-w-sm w-full px-4 z-[100]">
             <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl flex items-center p-3 gap-3 animate-slide-in-down">
                <Icon size={22} className={`${color} flex-shrink-0`} />
                <p className="text-sm font-medium text-zinc-100 leading-tight flex-grow">{message}</p>
            </div>
        </div>
    );
};

const LoadingToast: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 max-w-sm w-full px-4 z-[100]">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/80 rounded-xl shadow-2xl flex items-center p-3 gap-3 animate-slide-in-down">
            <IconLoader size={22} className="animate-spin text-blue-400 flex-shrink-0" />
            <p className="text-sm font-medium text-zinc-100 leading-tight flex-grow">{message}</p>
        </div>
    </div>
);


const initialIntegrationServices: IntegrationService[] = [
    {
        id: 'google-workspace',
        name: 'Google Workspace',
        description: 'Connect your Google account to integrate Gmail, Drive, Docs, and Calendar into your workflow.',
        status: ConnectionStatus.DISCONNECTED,
        subServices: [
            { id: 'gmail', name: 'Gmail', permission: 'Draft and send emails on your behalf (for reports and alerts).' },
            { id: 'google-drive', name: 'Google Drive', permission: 'Access and manage files you select (to use as context for AI answers).' },
            { id: 'google-docs', name: 'Google Docs', permission: 'Create and edit documents (for generating reports).' },
            { id: 'google-calendar', name: 'Google Calendar', permission: 'View and create events (for scheduling tasks and inspections).' },
        ]
    },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Send real-time alerts and progress photos to project groups.', status: ConnectionStatus.DISCONNECTED },
];

const initialWelcomeMessage: AnalysisMessage = {
    id: Date.now(),
    author: 'ai',
    type: 'text',
    text: `Hello! I'm **FLOCORE AI**, your construction intelligence assistant.
*   Ask me a question about your project.
*   Use the camera button to start a visual analysis.
*   Try asking me to "draft a daily site report".

How can I help you today?`,
    isTyping: false,
};

// --- START: REPORT TEMPLATE DEFINITIONS ---
const initialTemplates: ReportTemplate[] = [
    { 
        id: 'standard-blank', 
        name: 'Standard Blank', 
        scope: 'Company', // System templates are 'Company' scope
        isBranded: false,
        description: 'A clean, simple report for any content without branding.', 
    },
    { 
        id: 'specific-issue', 
        name: 'Specific Issue Report', 
        scope: 'Company',
        isBranded: false,
        description: 'Ideal for visual analysis of a single issue, including a summary and detected objects table.', 
    },
    { 
        id: 'daily-summary', 
        name: 'Daily Summary Report', 
        scope: 'Company',
        isBranded: false,
        description: 'A blueprint for daily progress updates, automatically formatted for clarity.', 
    },
    { 
        id: 'safety-audit', 
        name: 'Safety Audit Report', 
        scope: 'Company',
        isBranded: false,
        description: 'A structured format for safety observations and compliance checks.', 
    },
];
// --- END: REPORT TEMPLATE DEFINITIONS ---

const AppContent: React.FC = () => {
    const { t, language, setLanguage } = useLocalization();

    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [user, setUser] = useState<User | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentMode, setCurrentMode] = useState<AppMode>('ANALYSIS');
    const [selectedEngine, setSelectedEngine] = useState<AiEngine>('premium');
    const [isModelSelectionOpen, setIsModelSelectionOpen] = useState(false);
    
    const [initializedEngines, setInitializedEngines] = useState<AiEngine[]>([]);
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatusMap>({
        premium: { status: 'idle', progress: 1, message: 'Available' },
        advanced: { status: 'idle', progress: 0, message: '' },
        compact: { status: 'idle', progress: 0, message: '' },
    });

    const [isLiveAnalysisPaused, setIsLiveAnalysisPaused] = useState(false);
    const [isAiResponding, setIsAiResponding] = useState(false);
    const [liveCaption, setLiveCaption] = useState('');
    const [isCoPilotQueryActive, setIsCoPilotQueryActive] = useState(false);
    const [contextCaptureState, setContextCaptureState] = useState<ContextCaptureState>('idle');
    
    const [coPilotStatus, setCoPilotStatus] = useState<CoPilotStatus>('listening');
    const [coPilotAiResponse, setCoPilotAiResponse] = useState<string | null>(null);

    const [showReportPreview, setShowReportPreview] = useState(false);
    const [pdfPreviewData, setPdfPreviewData] = useState<{ url: string; fileName: string; bytes: Uint8Array; templateName: string } | null>(null);
    const [loadingToast, setLoadingToast] = useState<string | null>(null);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isDocumentHubOpen, setIsDocumentHubOpen] = useState(false);
    const [isProjectSnapshotOpen, setIsProjectSnapshotOpen] = useState(false);
    const [isTemplateStudioOpen, setIsTemplateStudioOpen] = useState(false);
    const [isBrandedTemplateCreatorOpen, setIsBrandedTemplateCreatorOpen] = useState(false);
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [connectingIntegration, setConnectingIntegration] = useState<IntegrationService | null>(null);
    const [itemToEdit, setItemToEdit] = useState<TimelineItem | null>(null);

    const [activeTab, setActiveTab] = useState<'briefing' | 'analysis' | 'log'>('briefing');
    
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [analysisThread, setAnalysisThread] = useState<AnalysisMessage[]>([]);
    const [pendingAnalysisQuery, setPendingAnalysisQuery] = useState('');
    const [analysisTabNotification, setAnalysisTabNotification] = useState(false);
    const [briefingTabNotification, setBriefingTabNotification] = useState(false);
    
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [logItems, setLogItems] = useState<LogItem[]>([]);
    const [integrationServices, setIntegrationServices] = useState<IntegrationService[]>(initialIntegrationServices);
    const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates);
    
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const [unifiedQueryContext, setUnifiedQueryContext] = useState<{
        cameraFrameB64: string | null;
        deviceScreenshotB64: string | null;
    } | null>(null);

    const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);
    const [actionSheetState, setActionSheetState] = useState<{
        isOpen: boolean;
        title: string;
        actions: ActionItem[];
    }>({ isOpen: false, title: '', actions: [] });

    const videoStreamRef = useRef<MediaStream | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const voiceCommandSourceMode = useRef<AppMode>(currentMode);

    const { 
        isListening, 
        startListening: originalStartListening, 
        stopListening, 
        finalTranscript,
        interimTranscript,
        error: speechError, 
        isSupported: isSpeechSupported,
        resetTranscript
    } = useSpeechRecognition(language);

    const startListening = useCallback(() => {
        // Capture the mode at the moment listening begins to prevent race conditions.
        voiceCommandSourceMode.current = currentMode;
        originalStartListening();
    }, [currentMode, originalStartListening]);


    const addLogEntry = useCallback((logData: Omit<LogItem, 'id' | 'timestamp'>) => {
        setLogItems(prev => [{ id: Date.now(), timestamp: new Date(), ...logData }, ...prev].slice(0, 100));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ id: Date.now(), message, type });
    }, []);
    
    const interruptPreviousTask = useCallback(() => {
        // --- CORE INTERRUPTION LOGIC ---
        // Abort any ongoing API calls
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        // Immediately stop any text-to-speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // --- AGGRESSIVE STATE RESET ---
        // Instantly reset all relevant states to 'listening' or idle
        setIsAiResponding(false);
        setIsAnalyzing(false);
        setLiveCaption('');
        setCoPilotStatus('listening');
        setCoPilotAiResponse(null);
        
        // Remove any "thinking" placeholders from the analysis thread
        setAnalysisThread(prev => prev.filter(msg => !msg.isTyping));

    }, []);

    const speak = useCallback((text: string, onBoundary: (e: SpeechSynthesisEvent) => void, onEnd: () => void) => {
        if ('speechSynthesis' in window && text) {
            // Defensively cancel any ongoing speech before starting a new one.
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
            
            utterance.onboundary = onBoundary;
            utterance.onend = onEnd;
            utterance.onerror = (e) => {
                console.error("Speech synthesis error occurred.", e);
                onEnd(); // Ensure the flow completes even on error
            };

            window.speechSynthesis.speak(utterance);
        } else {
             if (text) { // only warn if there's something to speak
                 console.warn('Text-to-speech not supported in this browser.');
                 showToast('Audio responses are not supported on this browser.', 'warning');
             }
             onBoundary({charIndex: text.length} as SpeechSynthesisEvent); // Simulate final boundary
             onEnd();
        }
    }, [showToast, language]);

    // Initial Auth Check and Language Set
    useEffect(() => {
        const checkUserAuth = async () => {
            const currentUser = await authService.checkAuth();
            if (currentUser) {
                setUser(currentUser);
                setLanguage(currentUser.language); // Set the language for the whole app
                setAuthStatus('authenticated');
            } else {
                setAuthStatus('unauthenticated');
            }
        };
        checkUserAuth();
    }, [setLanguage]);

    // Check for already initialized local models on startup
    useEffect(() => {
        const engines: AiEngine[] = [];
        if (localLlmService.isInitialized('compact')) engines.push('compact');
        if (localLlmService.isInitialized('advanced')) engines.push('advanced');
        setInitializedEngines(engines);
    }, []);

    // App Initialization
    useEffect(() => {
        if (authStatus === 'authenticated' && user?.onboardingComplete && !isInitialized) {
            setIsInitialized(true);
            const welcomeMessage = { ...initialWelcomeMessage };
            if (language === 'id') {
                welcomeMessage.text = `Halo! Saya **FLOCORE AI**, asisten kecerdasan konstruksi Anda.
*   Ajukan pertanyaan tentang proyek Anda.
*   Gunakan tombol kamera untuk memulai analisis visual.
*   Coba minta saya untuk "buat laporan harian situs".
                
Bagaimana saya bisa membantu Anda hari ini?`;
            } else {
                 welcomeMessage.text = `Hello! I'm **FLOCORE AI**, your construction intelligence assistant.
*   Ask me a question about your project.
*   Use the camera button to start a visual analysis.
*   Try asking me to "draft a daily site report".

How can I help you today?`;
            }
            setAnalysisThread([welcomeMessage]);
        }
    }, [authStatus, user, isInitialized, language]);
    
    // Dashboard Data Loading
    useEffect(() => {
        if (!isInitialized || !user) return;

        const loadDashboard = async () => {
            try {
                const data = await projectService.getProjectData(user);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to load project data", error);
                showToast("Could not load project data.", 'error');
            }
        };

        loadDashboard();
    }, [isInitialized, user, showToast]);


    const fetchBriefing = useCallback(async (isAutoRefresh = false) => {
        if (!dashboardData || !user) return;
        
        try {
            const { cards } = await supervisor.generateBriefingCards(dashboardData, user);
            const hasNewCritical = cards.some(newCard => {
                if (newCard.type !== IntelligenceCardType.CRITICAL_RISK) return false;
                const oldCards = dashboardData.briefing.cards || [];
                return !oldCards.some(oldCard => oldCard.id === newCard.id);
            });

            setDashboardData(d => {
                if (!d) return null;
                return {
                    ...d,
                    briefing: {
                        cards,
                        isLoading: false,
                        error: null,
                        lastUpdated: new Date(),
                        hasNewCritical: hasNewCritical && activeTab !== 'briefing'
                    }
                };
            });

            if (hasNewCritical && activeTab !== 'briefing') {
                setBriefingTabNotification(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
             if (!isAutoRefresh) {
                setDashboardData(d => {
                    if (!d) return null;
                    return { ...d, briefing: { ...d.briefing, isLoading: false, error: errorMessage } };
                });
            } else {
                 console.error("Auto-refresh for briefing failed silently:", errorMessage);
            }
        }
    }, [dashboardData, user, activeTab]);
    
    useEffect(() => {
        if (dashboardData?.briefing?.isLoading) {
            fetchBriefing(false);
        }
    }, [dashboardData?.briefing?.isLoading, fetchBriefing]);

    useEffect(() => {
        if (!dashboardData?.alerts || !user) return;
        if (!dashboardData.dailyFocus.isLoading && !dashboardData.priorityTasks.isLoading) return;
        
        const fetchOtherAIData = async () => {
            try {
                const focusText = await supervisor.getDailyFocus(dashboardData.alerts, user, selectedEngine);
                setDashboardData(d => d ? { ...d, dailyFocus: { text: focusText, isLoading: false, error: null } } : null);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                setDashboardData(d => d ? { ...d, dailyFocus: { text: null, isLoading: false, error: errorMessage } } : null);
            }
            try {
                const tasks = await supervisor.getPriorityTasks(dashboardData.alerts, user, selectedEngine);
                setDashboardData(d => d ? { ...d, priorityTasks: { tasks, isLoading: false, error: null } } : null);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                setDashboardData(d => d ? { ...d, priorityTasks: { tasks: [], isLoading: false, error: errorMessage } } : null);
            }
        };
        fetchOtherAIData();
    }, [dashboardData?.alerts, selectedEngine, user]);

    useInterval(() => {
        console.log("Auto-refreshing briefing...");
        fetchBriefing(true);
    }, 10 * 60 * 1000);

    const handleRefreshBriefing = useCallback(() => {
        if (dashboardData && !dashboardData.briefing.isLoading) {
            setDashboardData(d => d ? { ...d, briefing: { ...d.briefing, cards: [], isLoading: true, error: null } } : null);
        }
    }, [dashboardData]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    useEffect(() => {
        if (speechError) {
            showToast(`Speech Error: ${speechError}`, 'error');
        } else if (!isSpeechSupported && !toast) { // Show only once
            showToast('Speech recognition is not supported on this browser.', 'warning');
        }
    }, [speechError, isSpeechSupported, showToast, toast]);

    const captureFrame = useCallback((): string | null => {
        // @ts-ignore
        const imageCapture = window.ImageCapture ? new window.ImageCapture(videoStreamRef.current?.getVideoTracks()[0]) : null;

        if (!videoStreamRef.current || !imageCapture) {
            console.warn("Camera not ready for frame capture.");
            return null;
        }

        const video = document.querySelector('video');
        if (!video || video.videoWidth === 0) {
            console.warn("Video element not ready for frame capture.");
            return null;
        };

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             console.error("Could not get canvas context.");
            return null;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        return imageDataUrl;
    }, []);

    const runAnalysisInBackground = useCallback(async (itemId: number, imageB64: string) => {
        addLogEntry({ title: `Starting background analysis for item ${itemId}`, status: LogStatus.IN_PROGRESS, icon: IconCamera, channel: 'system' });
        try {
            const result = await supervisor.getAIAnalysis(imageB64, 'premium', user!);
            
            setTimeline(prev => prev.map(item =>
                item.id === itemId && 'status' in item
                ? { ...item, analysisSummary: result.analysis, detectedObjects: result.objects, status: 'complete' } as TimelineItem
                : item
            ));
            addLogEntry({ title: 'Background analysis successful', status: LogStatus.SUCCESS, icon: IconCamera, channel: 'user', content: result.analysis });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setTimeline(prev => prev.map(item =>
                item.id === itemId && 'status' in item
                ? { ...item, analysisSummary: `Analysis Failed: ${errorMessage}`, detectedObjects: [], status: 'error' } as TimelineItem
                : item
            ));
            addLogEntry({ title: 'Background analysis failed', status: LogStatus.ERROR, icon: IconCamera, channel: 'user', content: errorMessage });
        }
    }, [addLogEntry, user]);

    const performSingleAnalysis = useCallback(() => {
        if (isAiResponding) return; // Prevent capture during other AI operations for clarity
        
        const imageDataUrl = captureFrame();
        if (!imageDataUrl) {
            showToast("Could not capture frame.", 'error');
            return;
        }
        const base64ImageData = imageDataUrl.split(',')[1];
        
        const newId = Date.now();

        const placeholderAnalysis: AnalysisResult = {
            id: newId,
            image: imageDataUrl,
            analysisSummary: 'Processing...',
            detectedObjects: [],
            status: 'processing',
        };
        
        const newTimelineItem: TimelineItem = {
            ...placeholderAnalysis,
            timestamp: new Date(newId),
        };

        setTimeline(prev => [newTimelineItem, ...prev]);
        showToast("Image saved to timeline for analysis.", 'info');

        // Start analysis in the background
        runAnalysisInBackground(newId, base64ImageData);

    }, [isAiResponding, captureFrame, showToast, runAnalysisInBackground]);

    const performUnifiedCoPilotQuery = useCallback(async (prompt: string, context: { cameraFrameB64: string | null; deviceScreenshotB64: string | null; }) => {
        if (!user) return;
        interruptPreviousTask();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setContextCaptureState('idle');
        setIsAiResponding(true);
        setLiveCaption('');
        addLogEntry({ title: "Co-pilot query started", status: LogStatus.IN_PROGRESS, icon: IconShare, channel: 'system', context: prompt });

        try {
            const { cameraFrameB64, deviceScreenshotB64 } = context;
            // Co-pilot is always premium
            const stream = await supervisor.getUnifiedCoPilotResponseStream(prompt, 'premium', cameraFrameB64, deviceScreenshotB64, user, controller.signal);
            
            let fullAnswer = '';
            for await (const chunk of stream) {
                fullAnswer += chunk.text;
                setLiveCaption(fullAnswer);
            }
            
            addLogEntry({ title: "Co-pilot answered your query", status: LogStatus.SUCCESS, icon: IconShare, channel: 'user', context: prompt, content: fullAnswer });

            speak(
                fullAnswer,
                (e: SpeechSynthesisEvent) => {
                    setLiveCaption(fullAnswer.substring(0, e.charIndex));
                },
                () => {
                    setLiveCaption(fullAnswer);
                    setIsAiResponding(false); 
                }
            );

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Co-pilot stream aborted by user.");
                setIsAiResponding(false);
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                addLogEntry({ title: "Co-pilot query failed", status: LogStatus.ERROR, icon: IconShare, channel: 'user', context: prompt, content: errorMessage });
                showToast(errorMessage, 'error');
                setLiveCaption(`Query failed: ${errorMessage}`);
                 setIsAiResponding(false);
            }
        } finally {
            if (abortControllerRef.current === controller) abortControllerRef.current = null;
            setIsCoPilotQueryActive(false);
            setUnifiedQueryContext(null); 
        }
    }, [addLogEntry, speak, interruptPreviousTask, user, showToast]);

    const handleStartCoPilotQuery = async () => {
        if (isAiResponding || isListening) return;

        setContextCaptureState('capturing');

        const cameraFrame = captureFrame();
        const cameraFrameB64 = cameraFrame ? cameraFrame.split(',')[1] : null;

        let deviceScreenshotB64: string | null = null;

        if (typeof getScreenshot === 'function') {
            try {
                const deviceShot = await getScreenshot({ type: 'full' });
                deviceScreenshotB64 = deviceShot ? deviceShot.split(',')[1] : null;
            } catch (e) {
                console.error("Error capturing screenshot via native function", e);
                showToast("Could not capture screen context.", 'warning');
                setContextCaptureState('idle');
                return;
            }
        }
        else if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

                const video = document.createElement('video');
                video.srcObject = stream;
                
                await new Promise(resolve => { video.onloadedmetadata = resolve; });
                video.play();
                
                await new Promise(resolve => {
                    video.requestVideoFrameCallback(() => resolve(null));
                });

                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context not available");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const screenshotDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                deviceScreenshotB64 = screenshotDataUrl.split(',')[1];
                
                stream.getTracks().forEach(track => track.stop());

            } catch (e) {
                console.error("Error capturing screen via getDisplayMedia", e);
                showToast("Screen capture was cancelled or failed.", 'warning');
                setContextCaptureState('idle');
                return;
            }
        }
        else {
            showToast("Screen capture is not supported on this browser.", 'error');
            setContextCaptureState('idle');
            return;
        }

        setUnifiedQueryContext({ cameraFrameB64, deviceScreenshotB64 });
        setContextCaptureState('captured');
        setIsCoPilotQueryActive(true);

        setTimeout(() => {
            setContextCaptureState(currentState => currentState === 'captured' ? 'idle' : currentState);
        }, 3000);
    };


    const handleComplexTask = useCallback(async (command: string, intent: TaskIntent, userMessage: AnalysisMessage) => {
        if (!user || !dashboardData) return;
    
        interruptPreviousTask();
        const controller = new AbortController();
        abortControllerRef.current = controller;
    
        const thinkingMessage: AnalysisMessage = { id: Date.now() + 1, author: 'ai', type: 'text', isTyping: true };
        
        setAnalysisThread(prev => [...prev, thinkingMessage]);

        addLogEntry({ title: 'Processing your request...', status: LogStatus.IN_PROGRESS, icon: IconMessageCircle, channel: 'system', context: command });
        
        setIsAiResponding(true);
        
        const activeEngine = selectedEngine;
    
        try {
            if (intent.type === 'structural') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'structural' } : msg));
                addLogEntry({ title: 'Structural calculation detected', status: LogStatus.IN_PROGRESS, icon: IconWrench, channel: 'system', context: `Using standard: ${user.calculationStandard}` });
                const calculationPayload = await supervisor.getStructuralCalculation(command, user, activeEngine);
    
                const aiMessage: AnalysisMessage = {
                    id: thinkingMessage.id,
                    author: 'ai',
                    type: 'structural',
                    structuralCalculationPayload: calculationPayload,
                    isTyping: false
                };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: 'AI performed structural calculation', status: LogStatus.SUCCESS, icon: IconWrench, channel: 'user', context: command, content: calculationPayload.result.conclusion.summary });
            } else if (intent.type === 'geotechnical') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'geotechnical' } : msg));
                addLogEntry({ title: 'Geotechnical calculation detected', status: LogStatus.IN_PROGRESS, icon: IconGlobe, channel: 'system', context: `Using relevant geotechnical theories.` });
                const calculationPayload = await supervisor.getGeotechnicalCalculation(command, user, activeEngine);
    
                const aiMessage: AnalysisMessage = {
                    id: thinkingMessage.id,
                    author: 'ai',
                    type: 'geotechnical',
                    geotechnicalCalculationPayload: calculationPayload,
                    isTyping: false
                };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: 'AI performed geotechnical calculation', status: LogStatus.SUCCESS, icon: IconGlobe, channel: 'user', context: command, content: calculationPayload.result.conclusion.summary });
            } else if (intent.type === 'document_generation') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'document' } : msg));
                addLogEntry({ title: 'Document generation detected', status: LogStatus.IN_PROGRESS, icon: IconBookCheck, channel: 'system', context: `Role: ${intent.role}, Document: ${intent.documentType}` });
                const documentPayload: DocumentPayload = await supervisor.generateDocument(command, user, dashboardData, activeEngine);
                
                const aiMessage: AnalysisMessage = {
                    id: thinkingMessage.id,
                    author: 'ai',
                    type: 'document',
                    documentPayload: documentPayload,
                    isTyping: false,
                };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: `AI drafted ${documentPayload.task}`, status: LogStatus.SUCCESS, icon: IconBookCheck, channel: 'user', context: command });

            }
            else { 
                const updatedAnalysisThreadForContext = [...analysisThread, userMessage];
                const lastAnalysisMessage = [...analysisThread].reverse().find(m => m.type === 'analysis' && m.analysisResultId);
                const originalAnalysis = timeline.find(item => 'analysisSummary' in item && item.id === lastAnalysisMessage?.analysisResultId) as AnalysisResult | undefined;

                let stream;
                if (originalAnalysis) {
                    const base64ImageData = originalAnalysis.image.split(',')[1];
                    stream = await supervisor.getFollowUpAnswerStream(base64ImageData, originalAnalysis.analysisSummary, command, activeEngine, user, controller.signal, updatedAnalysisThreadForContext);
                } else {
                    stream = await supervisor.getConversationalResponseStream(command, activeEngine, user, controller.signal, updatedAnalysisThreadForContext);
                }
                
                let fullAnswer = '';
                let streamHasData = false;
                for await (const chunk of stream) {
                    streamHasData = true; // Mark that we received at least one chunk
                    fullAnswer += chunk.text;
                    setAnalysisThread(prev => prev.map(msg => 
                        msg.id === thinkingMessage.id 
                        ? { ...msg, text: fullAnswer, isTyping: false }
                        : msg
                    ));
                }

                if (!streamHasData) {
                    setAnalysisThread(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
                }

                addLogEntry({ title: 'AI answered question', status: LogStatus.SUCCESS, icon: IconMessageCircle, channel: 'user', context: command, content: fullAnswer });
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                 console.log("Follow-up stream aborted by user.");
                 setAnalysisThread(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                showToast(errorMessage, 'error');
                addLogEntry({ title: 'AI interaction failed', status: LogStatus.ERROR, icon: IconMessageCircle, channel: 'user', context: command, content: errorMessage });
        
                const errorMessageObj: AnalysisMessage = {
                    id: thinkingMessage.id,
                    author: 'ai',
                    type: 'text',
                    text: `Sorry, I couldn't process that: ${errorMessage}`,
                    isTyping: false
                };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? errorMessageObj : msg));
            }
        } finally {
            setIsAiResponding(false);
            if (abortControllerRef.current === controller) abortControllerRef.current = null;
        }
    }, [analysisThread, timeline, showToast, addLogEntry, selectedEngine, user, dashboardData, interruptPreviousTask]);
    
     const processComplexTaskInBackground = useCallback(async (command: string, intent: Exclude<TaskIntent, { type: 'conversation' }>) => {
        if (!user || !dashboardData) return;

        const userMessage: AnalysisMessage = { id: Date.now(), author: 'user', type: 'text', text: command, isTyping: false };
        const thinkingMessage: AnalysisMessage = { id: Date.now() + 1, author: 'ai', type: 'text', isTyping: true };

        setAnalysisThread(prev => [...prev, userMessage, thinkingMessage]);
        addLogEntry({ title: 'Processing complex task in background...', status: LogStatus.IN_PROGRESS, icon: IconMessageCircle, channel: 'system', context: command });

        const activeEngine = selectedEngine;

        try {
            if (intent.type === 'structural') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'structural' } : msg));
                addLogEntry({ title: 'Structural calculation started', status: LogStatus.IN_PROGRESS, icon: IconWrench, channel: 'system' });
                const calculationPayload = await supervisor.getStructuralCalculation(command, user, activeEngine);
                const aiMessage: AnalysisMessage = { id: thinkingMessage.id, author: 'ai', type: 'structural', structuralCalculationPayload: calculationPayload, isTyping: false };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: 'Structural calculation completed', status: LogStatus.SUCCESS, icon: IconWrench, channel: 'user', context: command });
            } else if (intent.type === 'geotechnical') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'geotechnical' } : msg));
                addLogEntry({ title: 'Geotechnical calculation started', status: LogStatus.IN_PROGRESS, icon: IconGlobe, channel: 'system' });
                const calculationPayload = await supervisor.getGeotechnicalCalculation(command, user, activeEngine);
                const aiMessage: AnalysisMessage = { id: thinkingMessage.id, author: 'ai', type: 'geotechnical', geotechnicalCalculationPayload: calculationPayload, isTyping: false };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: 'Geotechnical calculation completed', status: LogStatus.SUCCESS, icon: IconGlobe, channel: 'user', context: command });
            } else if (intent.type === 'document_generation') {
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? { ...thinkingMessage, type: 'document' } : msg));
                addLogEntry({ title: 'Document generation started', status: LogStatus.IN_PROGRESS, icon: IconBookCheck, channel: 'system' });
                const documentPayload: DocumentPayload = await supervisor.generateDocument(command, user, dashboardData, activeEngine);
                const aiMessage: AnalysisMessage = { id: thinkingMessage.id, author: 'ai', type: 'document', documentPayload: documentPayload, isTyping: false };
                setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? aiMessage : msg));
                addLogEntry({ title: `Drafted ${documentPayload.task}`, status: LogStatus.SUCCESS, icon: IconBookCheck, channel: 'user', context: command });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            showToast(errorMessage, 'error');
            addLogEntry({ title: 'Background task failed', status: LogStatus.ERROR, icon: IconMessageCircle, channel: 'user', context: command, content: errorMessage });
            const errorMessageObj: AnalysisMessage = { id: thinkingMessage.id, author: 'ai', type: 'text', text: `I couldn't complete that task: ${errorMessage}`, isTyping: false };
            setAnalysisThread(prev => prev.map(msg => msg.id === thinkingMessage.id ? errorMessageObj : msg));
        }
    }, [user, dashboardData, addLogEntry, selectedEngine, showToast]);
    
    const handleTextFollowUp = async (text: string) => {
        if (text.trim() && user) {
            const command = text.trim();
            const userMessage: AnalysisMessage = { id: Date.now(), author: 'user', type: 'text', text: command, isTyping: false };
            setAnalysisThread(prev => [...prev, userMessage]);

            const intent = await supervisor.detectTaskIntent(command, analysisThread, user);
            handleComplexTask(command, intent, userMessage);
        }
    };
    
    const generateSoilProfileImage = (layers: SoilLayer[], waterTableDepth: number): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(''); // return empty string on failure
                return;
            }

            const width = 400;
            const height = 300;
            const profileWidth = 150;
            const marginX = 20;
            const marginY = 20;
            const labelAreaWidth = width - profileWidth - marginX * 2;
            
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = '#18181b'; // zinc-950
            ctx.fillRect(0, 0, width, height);

            const totalDepth = Math.max(...layers.map(l => l.depthBottom), waterTableDepth + 1, 5);
            const scaleY = (height - marginY * 2) / totalDepth;

            // Draw layers
            layers.forEach(layer => {
                const yTop = marginY + layer.depthTop * scaleY;
                const yBottom = marginY + layer.depthBottom * scaleY;
                const hash = layer.description.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const gray = 50 + (hash % 50);
                ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                ctx.fillRect(marginX, yTop, profileWidth, yBottom - yTop);
                
                ctx.strokeStyle = '#a1a1aa';
                ctx.lineWidth = 1;
                ctx.strokeRect(marginX, yTop, profileWidth, yBottom - yTop);
                
                // Layer label
                ctx.fillStyle = '#e4e4e7';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(layer.description, marginX + profileWidth + 10, yTop + (yBottom - yTop)/2, labelAreaWidth - 10);
            });

            // Draw depth markers
            ctx.font = '10px monospace';
            ctx.fillStyle = '#a1a1aa';
            ctx.textAlign = 'right';
            for(let i = 0; i <= totalDepth; i++) {
                const y = marginY + i * scaleY;
                ctx.beginPath();
                ctx.moveTo(marginX - 5, y);
                ctx.lineTo(marginX, y);
                ctx.stroke();
                if (i % (Math.ceil(totalDepth/10)) === 0 || i === totalDepth) {
                    ctx.fillText(`${i.toFixed(1)}m`, marginX - 10, y);
                }
            }


            // Draw water table
            const wtY = marginY + waterTableDepth * scaleY;
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(marginX, wtY);
            ctx.lineTo(marginX + profileWidth, wtY);
            ctx.stroke();
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`GWT @ ${waterTableDepth}m`, marginX + profileWidth + 10, wtY - 8);

            resolve(canvas.toDataURL('image/png'));
        });
    };

    const handleGenerateReportPreview = useCallback(async (itemToReport: ReportablePayload, templateId: string) => {
        if (!itemToReport) return;
    
        setIsHistoryOpen(false);
        setLoadingToast('Generating your PDF... Please wait.');
    
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            showToast(`Template not found.`, 'error');
            setLoadingToast(null);
            return;
        }
    
        const fileName = `FLOCORE_${String(template.name).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
        setActiveTab('log');
        addLogEntry({ title: "Generating PDF...", status: LogStatus.IN_PROGRESS, icon: IconFileText, channel: 'system', content: `Using template: ${template.name}` });

        try {
            let printableContent: PrintableContent = { title: '', mainText: '', tableData: null, imageB64: null, calculationPayload: undefined };
            
            // --- Smart Mapper Logic ---
            if ('analysisSummary' in itemToReport) { // Type: AnalysisResult
                const payload = itemToReport as AnalysisResult;
                printableContent = {
                    title: 'AI Analysis Summary',
                    mainText: payload.analysisSummary,
                    tableData: {
                        headers: ["ID", "Detected Label", "Confidence"],
                        rows: payload.detectedObjects.map(obj => [obj.id.toString(), obj.label, `${(obj.confidence * 100).toFixed(1)}%`])
                    },
                    imageB64: payload.image.includes(',') ? payload.image.split(',')[1] : null,
                };
            } else if ('result' in itemToReport && ('governingStandard' in itemToReport.result || 'governingTheory' in itemToReport.result)) {
                // Type: StructuralCalculationPayload or GeotechnicalCalculationPayload
                const payload = itemToReport as StructuralCalculationPayload | GeotechnicalCalculationPayload;
                
                printableContent = {
                    title: 'Calculation Report',
                    mainText: '', // Main text is handled natively by the new pdfService
                    tableData: null,
                    imageB64: null,
                    calculationPayload: payload, // Pass the raw payload
                };
                 
                 const isGeotechnical = 'governingTheory' in payload.result;
                 if (isGeotechnical) {
                    const geoPayload = payload as GeotechnicalCalculationPayload;
                    const soilImageB64 = await generateSoilProfileImage(geoPayload.result.soilProfile.layers, geoPayload.result.soilProfile.waterTableDepth);
                    if (soilImageB64.includes(',')) {
                        printableContent.imageB64 = soilImageB64.split(',')[1];
                    }
                 }

            } else if (itemToReport.result && 'resultType' in itemToReport.result) { // Type: DocumentPayload
                const payload = itemToReport as DocumentPayload;
                 if (payload.result.resultType === 'JOB_SAFETY_ANALYSIS') {
                     const res = payload.result as JobSafetyAnalysis;
                     printableContent = {
                         title: `Job Safety Analysis: ${res.task}`,
                         mainText: '', // Will be rendered as a table
                         tableData: {
                            headers: ["Step", "Potential Hazards", "Control Measures"],
                            rows: res.steps.map(s => [s.step, s.potentialHazards.join('\n'), s.controls.join('\n')])
                         },
                         imageB64: null,
                     };
                 }
            } else {
                throw new Error("Unsupported payload type for reporting.");
            }

            const pdfBytes = await generateReportPdf(printableContent, template);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
    
            setPdfPreviewData({ url, fileName, bytes: pdfBytes, templateName: template.name });
            setShowReportPreview(true);
            addLogEntry({ title: "PDF preview ready", status: LogStatus.SUCCESS, icon: IconFileText, channel: 'user', content: `Template: ${template.name}` });
    
        } catch (error) {
            console.error("Failed to generate PDF for preview:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during PDF generation.";
            showToast("Failed to generate report preview.", 'error');
            addLogEntry({ title: "Failed to generate report preview", status: LogStatus.ERROR, icon: IconFileText, channel: 'user', content: errorMessage });
            setShowReportPreview(false);
        } finally {
            setLoadingToast(null);
        }
    }, [showToast, addLogEntry, templates]);
    
    const handleSaveCalculationToTimeline = useCallback((message: AnalysisMessage) => {
        const payload = message.structuralCalculationPayload || message.geotechnicalCalculationPayload || message.documentPayload;
        if (!payload) return;

        // Avoid duplicates by checking if an item with this message ID is already saved
        if (timeline.some(item => item.id === message.id)) {
            showToast("This item is already saved in your timeline.", 'info');
            return;
        }

        const newTimelineItem: TimelineItem = {
            ...payload,
            id: message.id, // Use the message ID as the unique ID for the timeline item
            timestamp: new Date(),
        };

        // Add to timeline and re-sort
        setTimeline(prev => [...prev, newTimelineItem].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        
        // Update the original message in the thread to reflect its saved state
        setAnalysisThread(prevThread => prevThread.map(msg => 
            msg.id === message.id ? { ...msg, isArchived: true } : msg
        ));

        showToast("Item saved to Project Timeline", 'success');
        addLogEntry({ title: 'Item saved to timeline', status: LogStatus.SUCCESS, icon: IconArchive, channel: 'user', context: payload.task });
    }, [timeline, showToast, addLogEntry]);


    const handleLiveVoiceCommand = useCallback(async (prompt: string) => {
        if (!user) return;
        interruptPreviousTask();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsAiResponding(true);
        setLiveCaption('');
        addLogEntry({ title: "Live query started", status: LogStatus.IN_PROGRESS, icon: IconMic, channel: 'system', context: prompt });
        
        const cameraFrame = captureFrame();
        const cameraFrameB64 = cameraFrame ? cameraFrame.split(',')[1] : null;
    
        try {
            // Live voice commands should be fast, so always use premium.
            const stream = await supervisor.getUnifiedCoPilotResponseStream(prompt, 'premium', cameraFrameB64, null, user, controller.signal);
            
            let fullAnswer = '';
            for await (const chunk of stream) {
                fullAnswer += chunk.text;
                // Live update for streaming text, but boundary will handle word-by-word
            }
            
            addLogEntry({ title: "Live query answered", status: LogStatus.SUCCESS, icon: IconMic, channel: 'user', context: prompt, content: fullAnswer });
    
            if (fullAnswer.trim()) {
                speak(
                    fullAnswer,
                    (e: SpeechSynthesisEvent) => {
                        setLiveCaption(fullAnswer.substring(0, e.charIndex));
                    }, 
                    () => {
                        setLiveCaption(fullAnswer);
                        setIsAiResponding(false); 
                    }
                );
            } else {
                setIsAiResponding(false);
            }
    
        } catch (error) {
             if (error instanceof Error && error.name === 'AbortError') {
                console.log("Live voice stream aborted by user.");
                setIsAiResponding(false);
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                addLogEntry({ title: "Live query failed", status: LogStatus.ERROR, icon: IconMic, channel: 'user', context: prompt, content: errorMessage });
                showToast(errorMessage, 'error');
                setLiveCaption(`Query failed: ${errorMessage}`);
                setIsAiResponding(false);
            }
        }
    }, [addLogEntry, speak, captureFrame, interruptPreviousTask, user, showToast]);

    const handleGenericVoiceCommand = useCallback(async (command: string) => {
        if (!user) return;
        if(currentMode !== 'COPILOT') setActiveTab('log');

        interruptPreviousTask();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsAnalyzing(true);
        if(currentMode === 'COPILOT') setCoPilotStatus('thinking');
        addLogEntry({ title: 'Voice command received', status: LogStatus.IN_PROGRESS, icon: IconMic, channel: 'system', context: command });

        const activeEngine = selectedEngine;

        try {
            setIsAiResponding(true);
            const stream = await supervisor.getConversationalResponseStream(command, activeEngine, user, controller.signal, analysisThread);
            setCoPilotAiResponse('');
            if (currentMode === 'COPILOT') setCoPilotStatus('speaking');
            
            let fullAnswer = '';
            for await (const chunk of stream) {
                if (controller.signal.aborted) {
                    fullAnswer = '';
                    break;
                }
                fullAnswer += chunk.text;
                // Live update for streaming text, but boundary will handle word-by-word
            }

            if (!controller.signal.aborted) {
                const responseText = fullAnswer.trim();
                
                if (currentMode === 'COPILOT') {
                    if (responseText) {
                        addLogEntry({ title: 'AI answered voice command', status: LogStatus.SUCCESS, icon: IconMessageCircle, channel: 'user', context: command, content: responseText });
                        speak(
                            responseText,
                            (e: SpeechSynthesisEvent) => {
                                setCoPilotAiResponse(responseText.substring(0, e.charIndex));
                            },
                            () => {
                                setCoPilotAiResponse(responseText);
                                setCoPilotStatus('displaying');
                            }
                        );
                    } else {
                        const emptyResponseMsg = t('copilot_empty_response');
                        addLogEntry({ title: 'AI gave an empty response', status: LogStatus.WARNING, icon: IconMessageCircle, channel: 'system', context: command, content: emptyResponseMsg });
                        setCoPilotAiResponse(emptyResponseMsg);
                        speak(
                            emptyResponseMsg, 
                            (e: SpeechSynthesisEvent) => setCoPilotAiResponse(emptyResponseMsg.substring(0, e.charIndex)),
                            () => {
                                setCoPilotAiResponse(emptyResponseMsg);
                                setCoPilotStatus('displaying');
                            }
                        );
                    }
                } else {
                     if (responseText) {
                         addLogEntry({ title: 'AI answered voice command', status: LogStatus.SUCCESS, icon: IconMessageCircle, channel: 'user', context: command, content: fullAnswer });
                     } else {
                         addLogEntry({ title: 'AI gave an empty response', status: LogStatus.WARNING, icon: IconMessageCircle, channel: 'system', context: command });
                     }
                }
            }

        } catch (error) {
             if (error instanceof Error && error.name === 'AbortError') {
                console.log("Generic voice stream aborted by user.");
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                if (currentMode === 'COPILOT') {
                    setCoPilotAiResponse(errorMessage);
                    speak(
                        errorMessage,
                        (e: SpeechSynthesisEvent) => setCoPilotAiResponse(errorMessage.substring(0, e.charIndex)), 
                        () => {
                            setCoPilotAiResponse(errorMessage);
                            setCoPilotStatus('displaying');
                        }
                    );
                }
                addLogEntry({ title: 'Assistant failed to respond to voice command', status: LogStatus.ERROR, icon: IconMessageCircle, channel: 'user', context: command, content: errorMessage });
            }
        } finally {
            setIsAiResponding(false);
            setIsAnalyzing(false);
             if (abortControllerRef.current === controller) abortControllerRef.current = null;
        }
    }, [addLogEntry, currentMode, speak, selectedEngine, interruptPreviousTask, user, analysisThread, t]);
    
     const handleAnalysisInterrupt = useCallback(() => {
        interruptPreviousTask();
        setAnalysisThread(prev => prev.filter(msg => !msg.isTyping));
        setIsAiResponding(false);
    }, [interruptPreviousTask]);

    useEffect(() => {
        if (finalTranscript) {
            const command = finalTranscript.trim();
            resetTranscript();

            const processVoiceCommand = async (cmd: string) => {
                if (!user) return;

                // Use the mode captured when listening started, not the potentially changed current mode.
                const sourceMode = voiceCommandSourceMode.current;
                const intent = await supervisor.detectTaskIntent(cmd, analysisThread, user);

                if (intent.type !== 'conversation' && (sourceMode === 'LIVE' || sourceMode === 'COPILOT')) {
                    // --- NON-BLOCKING "HANDOFF WORKFLOW" ---
                    interruptPreviousTask();
                    setIsAiResponding(true); // Block mic only for acknowledgment speech

                    let ackMessage = `Okay, I'll process that. The results will be in your Analysis tab.`;
                    if (intent.type === 'document_generation') {
                        const docType = intent.documentType.replace(/_/g, ' ') || 'document';
                        ackMessage = `Got it. Drafting the ${docType}. You can find it in the Analysis tab.`;
                    } else if (intent.type === 'structural' || intent.type === 'geotechnical') {
                        ackMessage = `Okay, starting the ${intent.type} analysis. I'll put the full results in your Analysis tab.`;
                    }
                    
                    if (sourceMode === 'LIVE') {
                        setLiveCaption(ackMessage);
                    } else if (sourceMode === 'COPILOT') {
                        setCoPilotStatus('speaking');
                        setCoPilotAiResponse(ackMessage);
                    }
                    
                    speak(ackMessage, 
                        (e) => {
                            const partialText = ackMessage.substring(0, e.charIndex);
                            if (sourceMode === 'LIVE') setLiveCaption(partialText);
                            if (sourceMode === 'COPILOT') setCoPilotAiResponse(partialText);
                        }, 
                        () => { // onEnd callback
                            if (sourceMode === 'LIVE') {
                                setLiveCaption(ackMessage);
                                setTimeout(() => setLiveCaption(''), 2000);
                            }
                            if (sourceMode === 'COPILOT') {
                                setCoPilotAiResponse(ackMessage);
                                setCoPilotStatus('displaying');
                            }
                            setIsAiResponding(false); // Unblock the UI for new commands
                        }
                    );
                    
                    setAnalysisTabNotification(true);
                    showToast("Task started in background. Check the Analysis tab for results.", 'info');
                    
                    // Fire and forget the background task.
                    processComplexTaskInBackground(cmd, intent);

                } else if (intent.type !== 'conversation' && sourceMode === 'ANALYSIS') {
                    const userMessage: AnalysisMessage = { id: Date.now(), author: 'user', type: 'text', text: cmd, isTyping: false };
                    setAnalysisThread(prev => [...prev, userMessage]);
                    handleComplexTask(cmd, intent, userMessage);
                } else {
                    // This is a conversational task. Route based on the source mode.
                    if (isCoPilotQueryActive && unifiedQueryContext) {
                        performUnifiedCoPilotQuery(cmd, unifiedQueryContext);
                    } else if (sourceMode === 'COPILOT') {
                        handleGenericVoiceCommand(cmd);
                    } else if (sourceMode === 'LIVE' && !isLiveAnalysisPaused && !isCoPilotQueryActive) {
                        handleLiveVoiceCommand(cmd);
                    } else {
                        // This case is now handled by the new logic below
                    }
                }
            };
            
            const sourceMode = voiceCommandSourceMode.current;
            if (sourceMode === 'ANALYSIS' && activeTab === 'analysis') {
                setPendingAnalysisQuery(command);
            } else if (command) {
                processVoiceCommand(command);
            }
        }
    }, [
        finalTranscript, resetTranscript, user, analysisThread, activeTab,
        isCoPilotQueryActive, unifiedQueryContext, isLiveAnalysisPaused, 
        speak, showToast, processComplexTaskInBackground, handleComplexTask,
        performUnifiedCoPilotQuery, handleGenericVoiceCommand, handleLiveVoiceCommand, interruptPreviousTask
    ]);
    
    useEffect(() => {
        setDetectedObjects([]);
        setIsLiveAnalysisPaused(false);
        setLiveCaption('');
        interruptPreviousTask();
        setIsAiResponding(false);
        setIsCoPilotQueryActive(false);

        if (isListening) {
            stopListening();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMode]);
    
    // Main listening logic for Co-Pilot and Live modes.
    useEffect(() => {
        // If user starts speaking while the AI is responding/speaking, interrupt it.
        // The mic is already listening, so we just need to stop the AI's output.
        if (interimTranscript && isAiResponding) {
             interruptPreviousTask();
        }
        
        const shouldBeListening = 
            isCoPilotQueryActive || 
            (currentMode === 'LIVE' && !isLiveAnalysisPaused) ||
            (currentMode === 'COPILOT' && (coPilotStatus === 'listening' || coPilotStatus === 'displaying'));
        
        // Can listen if the AI isn't currently speaking or thinking up a response.
        const canListen = !isAiResponding;
        
        if (shouldBeListening && canListen && !isListening) {
            startListening();
        } else if ((!shouldBeListening || !canListen) && isListening) {
            stopListening();
        }
    }, [
        currentMode, 
        isListening, 
        isAiResponding, 
        isLiveAnalysisPaused, 
        isCoPilotQueryActive,
        interimTranscript,
        coPilotStatus,
        startListening,
        stopListening,
        interruptPreviousTask,
    ]);


    useEffect(() => {
        const enableTracks = currentMode !== 'COPILOT';
        if(videoStreamRef.current) {
            videoStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = enableTracks;
            });
        }
    }, [currentMode]);

    const handleConnectIntegration = () => {
        if (!connectingIntegration) return;
        
        const id = connectingIntegration.id;
        setTimeout(() => {
            setIntegrationServices(prev => 
                prev.map(s => s.id === id ? {...s, status: ConnectionStatus.CONNECTED} : s)
            );
            addLogEntry({ title: `Connected to ${connectingIntegration.name}`, status: LogStatus.SUCCESS, icon: IconLink, channel: 'user' });
            showToast(`Connected to ${connectingIntegration.name}`, 'success');
            setIsConnectionModalOpen(false);
            setConnectingIntegration(null);
        }, 1500);
    };

    const handleDisconnectIntegration = (serviceId: string) => {
        const service = integrationServices.find(s => s.id === serviceId);
        if (!service) return;

        if (window.confirm(`Are you sure you want to disconnect from ${service.name}? This may disable automated workflows.`)) {
             setTimeout(() => {
                setIntegrationServices(prev => 
                    prev.map(s => s.id === serviceId ? {...s, status: ConnectionStatus.DISCONNECTED} : s)
                );
                addLogEntry({ title: `Disconnected from ${service.name}`, status: LogStatus.SUCCESS, icon: IconLink, channel: 'user' });
                showToast(`Disconnected from ${service.name}`, 'info');
            }, 500);
        }
    };

    const openConnectionModal = (service: IntegrationService) => {
        setConnectingIntegration(service);
        setIsConnectionModalOpen(true);
        setIsSettingsOpen(false);
    };

    const handleLoginSuccess = useCallback((loggedInUser: User) => {
        setUser(loggedInUser);
        setLanguage(loggedInUser.language);
        setAuthStatus('authenticated');
    }, [setLanguage]);

    const handleOnboardingComplete = useCallback((updatedUser: User) => {
        setUser(updatedUser); // This user object now has onboardingComplete: true
    }, []);
    
    const handleLogout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setAuthStatus('unauthenticated');
        // Reset all relevant app state
        setIsInitialized(false);
        setDashboardData(null);
        setTimeline([]);
        setAnalysisThread([]);
        setLogItems([]);
        setCurrentMode('ANALYSIS');
        setActiveTab('briefing');
        setIsSettingsOpen(false);
    }, []);
    
    const handleSettingChange = useCallback(async (key: keyof User, value: any) => {
        if (!user) return;
        try {
            const updatedUser = await authService.updateUserSetting(user, key, value);
            setUser(updatedUser);
            
            if (key === 'language') {
                setLanguage(value as Language);
                showToast(t('settings_language_change_toast', { lang: value === 'id' ? 'Bahasa Indonesia' : 'English' }), 'info');
            } else if (key === 'calculationStandard') {
                showToast(`Calculation standard set to ${value}`, 'info');
            }
        } catch (error) {
            showToast('Failed to update setting.', 'error');
        }
    }, [user, showToast, t, setLanguage]);


    const handleToggleTask = (taskId: string) => {
        setDashboardData(prevData => {
            if (!prevData) return null;
            const newTasks = prevData.priorityTasks.tasks.map(task =>
                task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
            );
            return {
                ...prevData,
                priorityTasks: {
                    ...prevData.priorityTasks,
                    tasks: newTasks
                }
            };
        });
    };

    const handleEngineAction = (engine: AiEngine) => {
        // If the engine is already initialized or is premium, just select it.
        if (engine === 'premium' || initializedEngines.includes(engine)) {
            setSelectedEngine(engine);
            showToast(`Switched to ${engine} model.`, 'info');
            setIsModelSelectionOpen(false);
            return;
        }

        // If it's already downloading, do nothing.
        if (downloadStatus[engine]?.status === 'downloading') {
            return;
        }

        // Otherwise, start the download.
        setDownloadStatus(prev => ({
            ...prev,
            [engine]: { status: 'downloading', progress: 0, message: 'Starting...' }
        }));

        localLlmService.initialize(engine, (report) => {
            setDownloadStatus(prev => ({
                ...prev,
                [engine]: { ...prev[engine], progress: report.progress, message: report.text }
            }));
        }).then(() => {
            setDownloadStatus(prev => ({
                ...prev,
                [engine]: { status: 'idle', progress: 1, message: 'Downloaded' }
            }));
            setInitializedEngines(prev => [...prev, engine]);
            showToast(`${engine.charAt(0).toUpperCase() + engine.slice(1)} engine successfully installed!`, 'success');
        }).catch(err => {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setDownloadStatus(prev => ({
                ...prev,
                [engine]: { status: 'error', progress: 0, message: errorMessage }
            }));
            showToast(`Failed to load ${engine} model: ${errorMessage}`, 'error');
        });
    };
    
    const handleSaveBrandedTemplate = (newTemplate: ReportTemplate) => {
        setTemplates(prev => [...prev, newTemplate]);
        setIsBrandedTemplateCreatorOpen(false);
        setIsTemplateStudioOpen(true);
        showToast(`Template "${newTemplate.name}" created successfully!`, 'success');
    };

    const handleOpenEditor = (item: TimelineItem) => {
        setItemToEdit(item);
    };

    const handleFinalizeEdits = (updatedItem: TimelineItem) => {
        if (!itemToEdit) return;

        // Update the source of truth in the timeline
        setTimeline(prevTimeline => 
            prevTimeline.map(item => 
                (item.id === updatedItem.id)
                    ? updatedItem
                    : item
            )
        );

        // Update the message in the analysis thread if it exists
        setAnalysisThread(prevThread =>
            prevThread.map(msg => {
                if ('analysisSummary' in updatedItem && msg.analysisResultId === updatedItem.id) {
                    return { ...msg, analysisSummary: updatedItem.analysisSummary };
                }
                if (msg.id === updatedItem.id) { // This handles calculations
                     if ('structuralCalculationPayload' in msg && 'result' in updatedItem && 'governingStandard' in updatedItem.result) {
                        return { ...msg, structuralCalculationPayload: updatedItem as unknown as StructuralCalculationPayload };
                     }
                     if ('geotechnicalCalculationPayload' in msg && 'result' in updatedItem && 'governingTheory' in updatedItem.result) {
                        return { ...msg, geotechnicalCalculationPayload: updatedItem as unknown as GeotechnicalCalculationPayload };
                     }
                }
                return msg;
            })
        );

        showToast("Content updated successfully!", 'success');
        setItemToEdit(null); // Close the sheet
    };
    
    if (authStatus === 'loading') {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200 gap-6">
                <IconHardHat size={60} className="text-blue-500" />
                <div className="flex items-center gap-3">
                    <IconLoader className="animate-spin text-zinc-400" />
                    <p className="text-xl font-semibold">Checking Session...</p>
                </div>
            </div>
        );
    }

    if (authStatus === 'unauthenticated' || !user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (!user.onboardingComplete) {
        return <OnboardingGuide user={user} onComplete={handleOnboardingComplete} />;
    }

    if (!isInitialized || !dashboardData) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200 gap-6">
                <IconHardHat size={60} className="text-blue-500" />
                <div className="flex items-center gap-3">
                    <IconLoader className="animate-spin text-zinc-400" />
                    <p className="text-xl font-semibold">Initializing FLOCORE Co-Pilot...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-zinc-950">
            {currentMode === 'COPILOT' ? (
                 <CoPilotView
                    status={coPilotStatus}
                    transcript={interimTranscript}
                    aiResponse={coPilotAiResponse}
                    onEndSession={() => setCurrentMode('ANALYSIS')}
                />
            ) : (
                <>
                    {toast && <Toast message={toast.message} type={toast.type} />}
                    {loadingToast && <LoadingToast message={loadingToast} />}
                    
                    <TopStatusBar
                        onHistory={() => setIsHistoryOpen(true)}
                        historyCount={timeline.length}
                        onToggleSettings={() => setIsSettingsOpen(true)}
                        onToggleDocumentHub={() => setIsDocumentHubOpen(true)}
                        onToggleProjectSnapshot={() => setIsProjectSnapshotOpen(true)}
                        selectedEngine={selectedEngine}
                        onToggleModelSelection={() => setIsModelSelectionOpen(true)}
                    />
                    
                    {currentMode !== 'ANALYSIS' && (
                        <FloatingTranscript
                            currentMode={currentMode}
                            contextCaptureState={contextCaptureState}
                            isListening={isListening}
                            isAiResponding={isAiResponding}
                            interimTranscript={interimTranscript}
                            captionText={liveCaption}
                        />
                    )}
                    
                    {currentMode === 'LIVE' && isLiveAnalysisPaused && (
                      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-white animate-fade-in">
                          <IconPause size={64} className="mb-4" />
                          <h2 className="text-2xl font-bold">Live Session Paused</h2>
                          <p className="text-zinc-300">Press the resume button to continue analysis.</p>
                      </div>
                    )}


                    {cameraError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                            <IconTriangleAlert size={48} className="text-orange-400 mb-4" />
                            <h2 className="text-xl font-bold mb-2">Camera Error</h2>
                            <p className="text-zinc-400">{cameraError}</p>
                        </div>
                    ) : (
                        <CameraView
                            onStreamReady={(stream) => {
                                setIsCameraReady(true);
                                videoStreamRef.current = stream;
                            }}
                            onStreamError={setCameraError}
                            isLiveAnalysisActive={currentMode === 'LIVE'}
                            detectedObjects={detectedObjects}
                        />
                    )}
                
                    {isCameraReady && !cameraError && (
                        <ControlDeck
                            isAnalyzing={isAnalyzing || isAiResponding}
                            currentMode={currentMode}
                            onModeChange={setCurrentMode}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                if (tab === 'analysis') {
                                    setAnalysisTabNotification(false);
                                }
                                if (tab === 'briefing') {
                                    setBriefingTabNotification(false);
                                }
                            }}
                            dashboardData={dashboardData}
                            logItems={logItems}
                            analysisThread={analysisThread}
                            onCapture={performSingleAnalysis}
                            onStartCoPilotQuery={handleStartCoPilotQuery}
                            isLiveAnalysisPaused={isLiveAnalysisPaused}
                            onToggleLivePause={() => setIsLiveAnalysisPaused(prev => !prev)}
                            isListening={isListening}
                            startListening={startListening}
                            stopListening={stopListening}
                            interimTranscript={interimTranscript}
                            onTextSubmit={handleTextFollowUp}
                            onToggleTask={handleToggleTask}
                            pendingAnalysisQuery={pendingAnalysisQuery}
                            onClearPendingQuery={() => setPendingAnalysisQuery('')}
                            onInterrupt={handleAnalysisInterrupt}
                            onSaveCalculation={handleSaveCalculationToTimeline}
                            timeline={timeline}
                            analysisTabNotification={analysisTabNotification}
                            briefingTabNotification={briefingTabNotification}
                            onRefreshBriefing={handleRefreshBriefing}
                        />
                    )}

                    <ProjectSnapshotModal
                        isOpen={isProjectSnapshotOpen}
                        onClose={() => setIsProjectSnapshotOpen(false)}
                    />

                    <HistoryGallery
                        isOpen={isHistoryOpen}
                        onClose={() => setIsHistoryOpen(false)}
                        history={timeline}
                        templates={templates}
                        onGenerateReport={handleGenerateReportPreview}
                        onOpenEditor={handleOpenEditor}
                    />

                    <ReportCustomizationSheet
                        isOpen={!!itemToEdit}
                        onClose={() => setItemToEdit(null)}
                        item={itemToEdit}
                        onFinalize={handleFinalizeEdits}
                        aiEngine={selectedEngine}
                    />

                    <ReportPreviewSheet
                        isOpen={showReportPreview}
                        onClose={() => setShowReportPreview(false)}
                        pdfUrl={pdfPreviewData?.url || null}
                        templateName={pdfPreviewData?.templateName || 'Report'}
                        onConfirmDownload={() => {
                            if (pdfPreviewData) {
                                const link = document.createElement('a');
                                link.href = pdfPreviewData.url;
                                link.download = pdfPreviewData.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                addLogEntry({
                                    title: "Report downloaded successfully",
                                    status: LogStatus.SUCCESS,
                                    icon: IconFileText,
                                    channel: 'user',
                                    content: `File: ${pdfPreviewData.fileName}`
                                });
                            }
                        }}
                    />

                    <ActionSheet {...actionSheetState} onClose={() => setActionSheetState(prev => ({ ...prev, isOpen: false }))} />

                    <ModelSelectionSheet
                        isOpen={isModelSelectionOpen}
                        onClose={() => setIsModelSelectionOpen(false)}
                        selectedEngine={selectedEngine}
                        onEngineAction={handleEngineAction}
                        initializedEngines={initializedEngines}
                        downloadStatus={downloadStatus}
                    />
                    
                    <DocumentHub
                        isOpen={isDocumentHubOpen}
                        onClose={() => setIsDocumentHubOpen(false)}
                        addLogEntry={addLogEntry}
                        showToast={showToast}
                    />
                    
                    <TemplateStudio
                        isOpen={isTemplateStudioOpen}
                        onClose={() => setIsTemplateStudioOpen(false)}
                        templates={templates}
                        onCreateNew={() => {
                            setIsTemplateStudioOpen(false);
                            setIsBrandedTemplateCreatorOpen(true);
                        }}
                    />
                    
                    <BrandedTemplateCreator
                        isOpen={isBrandedTemplateCreatorOpen}
                        onClose={() => {
                            setIsBrandedTemplateCreatorOpen(false);
                            setIsTemplateStudioOpen(true);
                        }}
                        onSave={handleSaveBrandedTemplate}
                    />

                    <SettingsPanel
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        onOpenTemplateStudio={() => {
                            setIsSettingsOpen(false);
                            setIsTemplateStudioOpen(true);
                        }}
                        integrationServices={integrationServices}
                        onConnect={openConnectionModal}
                        onDisconnect={handleDisconnectIntegration}
                        onLogout={handleLogout}
                        user={user}
                        onSettingChange={handleSettingChange}
                    />

                    {connectingIntegration && (
                        <ConnectionModal
                            isOpen={isConnectionModalOpen}
                            onClose={() => setIsConnectionModalOpen(false)}
                            service={connectingIntegration}
                            onConfirmConnect={handleConnectIntegration}
                        />
                    )}
                </>
            )}
        </div>
    );
}

const App: React.FC = () => (
    <LocalizationProvider>
        <AppContent />
    </LocalizationProvider>
);

export default App;