import React from 'react';

export interface DetectedObject {
  id: number;
  label: string; // e.g., "W12x26 Steel Beam"
  confidence: number;
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ActionItem {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export enum AlertUrgency {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum AlertCategory {
    WEATHER = 'WEATHER',
    TEAM = 'TEAM',
    SAFETY = 'SAFETY',
    EQUIPMENT = 'EQUIPMENT',
    LOGISTICS = 'LOGISTICS',
    GENERAL = 'GENERAL'
}

export interface DashboardAlert {
  id: number;
  timestamp: Date;
  icon: React.ElementType;
  title: string;
  message: string;
  urgency: AlertUrgency;
  category: AlertCategory;
}

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  IN_PROGRESS = 'IN_PROGRESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

export interface LogItem {
  id: number;
  timestamp: Date;
  icon: React.ElementType;
  title: string; // High-level summary: "AI Answered Question"
  status: LogStatus;
  channel: 'user' | 'system'; // 'user' for command log, 'system' for verbose trace
  content?: string; // Optional detailed content, like the AI's full answer.
  context?: string; // Optional context, like the user's question.
}

export interface CalculationStep {
    title: string;
    formula: string;
    derivationSteps: string[];
    standardReference: string;
}

export interface Verification {
    checkName: string;
    evaluation: string;
    status: 'OK' | 'FAIL' | 'WARNING';
    standardReference: string;
}

export interface CalculationResult {
    governingStandard: string;
    problemStatement: string;
    assumptions: string[];
    givenData: string[];
    calculationSteps: CalculationStep[];
    verifications: Verification[];
    conclusion: {
        summary: string;
        finalAnswer: { name: string; value: string; unit: string };
    };
    recommendations?: string[];
    warnings?: string[];
}

export interface SoilLayer {
    depthTop: number;
    depthBottom: number;
    description: string;
    unitWeight: number;
    cohesion?: number;
    frictionAngle?: number;
}


// ===================================================================
// START: Advanced Structural Agent Types (Sub-Agent Architecture)
// ===================================================================

// Enums for specific design types
export enum ConcreteSlabType {
    ONE_WAY = 'ONE_WAY',
    TWO_WAY_DDM = 'TWO_WAY_DDM', // Direct Design Method
    FLAT_PLATE_PUNCHING_SHEAR = 'FLAT_PLATE_PUNCHING_SHEAR'
}

export enum SteelConnectionType {
    SHEAR_TAB = 'SHEAR_TAB',
    FLANGE_PLATE_MOMENT = 'FLANGE_PLATE_MOMENT',
    WELDED = 'WELDED',
}

// --- NEW TYPES FOR VISUALIZATION ---

export interface DiagramDataPoint {
    x: number; // position along member in meters
    y: number; // value (shear in kN or moment in kNm)
}

export interface DrawingDimension {
    type: 'horizontal' | 'vertical';
    y?: number; // for horizontal
    x?: number; // for vertical
    start: number;
    end: number;
    label: string;
}

export interface DrawingRebar {
    cx: number;
    cy: number;
    radius: number;
    label?: string;
}

export interface DrawingStirrup {
    shape: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

export interface DrawingSpec {
    viewBox: { width: number; height: number; };
    section: { width: number; height: number; };
    stirrup: DrawingStirrup;
    mainRebar: DrawingRebar[];
    topRebar?: DrawingRebar[];
    dimensions: DrawingDimension[];
    labels: { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }[];
}

export interface PMPoint {
    p: number; // Axial load in kN
    m: number; // Moment in kNm
}

export interface PMInteractionData {
    capacityCurve: PMPoint[];
    demandPoint: PMPoint;
}

// --- END NEW TYPES ---


// Specific result interfaces for each sub-agent
export interface ReinforcedBeamResult extends CalculationResult {
    calculationType: 'REINFORCED_BEAM_DESIGN';
    shearCalculationSteps?: CalculationStep[];
    diagramData?: {
        sfd: DiagramDataPoint[];
        bmd: DiagramDataPoint[];
        length: number;
    };
    drawingSpec?: DrawingSpec;
}
export interface SlenderColumnResult extends CalculationResult {
    calculationType: 'SLENDER_COLUMN_DESIGN';
    pmInteractionData?: PMInteractionData;
    drawingSpec?: DrawingSpec;
}
export interface TwoWaySlabResult extends CalculationResult {
    calculationType: 'TWO_WAY_SLAB_DESIGN';
    slabType: ConcreteSlabType;
    drawingSpec?: DrawingSpec; // Plan view of reinforcement
    punchingShearCheck?: PunchingShearResult; // Nested check result
}
export interface PunchingShearResult extends CalculationResult {
    calculationType: 'PUNCHING_SHEAR_DESIGN';
}
export interface RetainingWallResult extends CalculationResult {
    calculationType: 'RETAINING_WALL_DESIGN';
    diagramData?: {
        pressureDiagram: any; // Define structure for pressure diagrams
    };
    drawingSpec?: DrawingSpec; // Cross section of wall and footing
}
export interface SteelConnectionResult extends CalculationResult {
    calculationType: 'STEEL_CONNECTION_DESIGN';
    connectionType: SteelConnectionType;
    drawingSpec?: DrawingSpec; // Elevation view of connection
}
export interface WeldedConnectionResult extends CalculationResult {
    calculationType: 'WELDED_CONNECTION_DESIGN';
}
export interface ColumnBasePlateResult extends CalculationResult {
    calculationType: 'COLUMN_BASE_PLATE_DESIGN';
}
export interface CompositeBeamResult extends CalculationResult {
    calculationType: 'COMPOSITE_BEAM_DESIGN';
}
export interface SeismicLoadResult extends CalculationResult {
    calculationType: 'SEISMIC_LOAD_ANALYSIS';
}
export interface WindLoadResult extends CalculationResult {
    calculationType: 'WIND_LOAD_ANALYSIS';
}


// A union type to represent any possible structural result
export type StructuralAnalysisResult = 
    | ReinforcedBeamResult
    | SlenderColumnResult
    | TwoWaySlabResult
    | PunchingShearResult
    | RetainingWallResult
    | SteelConnectionResult
    | WeldedConnectionResult
    | ColumnBasePlateResult
    | CompositeBeamResult
    | SeismicLoadResult
    | WindLoadResult;

// A wrapper type to be used in the message thread
export interface StructuralCalculationPayload {
    task: string; // e.g., 'Reinforced Beam Design'
    result: StructuralAnalysisResult;
}

// ===================================================================
// END: Advanced Structural Agent Types
// ===================================================================

// ===================================================================
// START: Advanced Geotechnical Agent Types (Sub-Agent Architecture)
// ===================================================================

export interface GeotechnicalDrawingSpec {
    viewBox: { width: number; height: number };
    footing: { x: number; y: number; width: number; height: number };
    soilLayers: Array<{ depthTop: number; depthBottom: number; description: string }>;
    waterTableDepth?: number;
    pressureBulb?: { cx: number; cy: number; rx: number; ry: number };
    labels: Array<{ x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }>;
    dimensions: Array<{ type: 'horizontal' | 'vertical'; start: [number, number]; end: [number, number]; label: string }>;
}

export interface SlipCircleSpec {
    viewBox: { width: number; height: number };
    slopeProfile: Array<{x: number, y: number}>;
    soilLayers: Array<{ points: Array<{x: number, y: number}>; description: string }>;
    slipCircle: { cx: number; cy: number; radius: number };
    waterTable?: Array<{x: number, y: number}>;
}


export interface BaseGeotechnicalResult {
    governingTheory: string;
    problemStatement: string;
    soilProfile: {
        layers: SoilLayer[];
        waterTableDepth: number;
    };
    assumptions: string[];
    givenData: string[];
    calculationSteps: Array<CalculationStep & { theoryReference: string }>;
    verifications: Verification[];
    conclusion: {
        summary: string;
        finalAnswer: { name: string; value: string; unit: string };
    };
    recommendations?: string[];
}

export interface ShallowFoundationResult extends BaseGeotechnicalResult {
    calculationType: 'SHALLOW_FOUNDATION_BEARING_CAPACITY';
    drawingSpec?: GeotechnicalDrawingSpec;
    settlementCalculation?: FoundationSettlementResult;
}

export interface DeepFoundationResult extends BaseGeotechnicalResult {
    calculationType: 'DEEP_FOUNDATION_AXIAL_CAPACITY';
    drawingSpec?: GeotechnicalDrawingSpec;
}

export interface FoundationSettlementResult extends BaseGeotechnicalResult {
    calculationType: 'FOUNDATION_SETTLEMENT_ANALYSIS';
}

export interface SlopeStabilityResult extends BaseGeotechnicalResult {
    calculationType: 'SLOPE_STABILITY_ANALYSIS';
    slipCircleSpec?: SlipCircleSpec;
}

export type GeotechnicalAnalysisResult =
    | ShallowFoundationResult
    | DeepFoundationResult
    | FoundationSettlementResult
    | SlopeStabilityResult;

export interface GeotechnicalCalculationPayload {
    task: string;
    result: GeotechnicalAnalysisResult;
}

// ===================================================================
// END: Advanced Geotechnical Agent Types
// ===================================================================

// ===================================================================
// START: Field Agent & Reporting Types (OBSOLETE - REMOVED)
// ===================================================================

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PDF' | 'DWG' | 'XLSX' | 'DOCX';
  uploadedAt: Date;
  size: number;
  uploader: string;
}

// ===================================================================
// END: Field Agent & Reporting Types
// ===================================================================

// ===================================================================
// START: DOCUMENT GENERATION AGENT TYPES
// ===================================================================

// --- Site Manager Documents ---
export interface DailySiteReport {
    resultType: 'DAILY_SITE_REPORT';
    reportDate: string;
    weather: string;
    personnel: Array<{ trade: string; count: number }>;
    equipment: Array<{ name: string; hours: number }>;
    workCompleted: string[];
    materialsDelivered: string[];
    delaysOrIssues: string[];
    safetyObservations: string[];
}

export interface SiteDiaryJournalEntry {
    resultType: 'SITE_DIARY_JOURNAL_ENTRY';
    entryDate: string;
    author: string;
    entries: Array<{ time: string; activity: string; notes?: string }>;
}

export interface ProgressReport {
    resultType: 'PROGRESS_REPORT';
    reportingPeriod: string;
    executiveSummary: string;
    progressAgainstSchedule: string;
    costPerformance: string;
    risksAndIssues: string[];
    lookAhead: string;
}

export interface IncidentReport {
    resultType: 'INCIDENT_REPORT';
    standardReference: 'OSHA 301 Format';
    dateOfIncident: string;
    timeOfIncident: string;
    location: string;
    personnelInvolved: string[];
    description: string;
    rootCauseAnalysis: string;
    correctiveActions: string[];
    witnesses: string[];
}

export interface SiteSafetyReport {
    resultType: 'SITE_SAFETY_REPORT';
    reportDate: string;
    inspector: string;
    positiveObservations: string[];
    identifiedHazards: Array<{ hazard: string; riskLevel: 'Low' | 'Medium' | 'High'; recommendedAction: string }>;
}

export interface ToolboxTalkRecord {
    resultType: 'TOOLBOX_TALK_RECORD';
    date: string;
    topic: string;
    presenter: string;
    attendees: string[];
    keyPointsDiscussed: string[];
}

export interface ChecklistItem {
    item: string;
    status: 'Pass' | 'Fail' | 'N/A';
    notes?: string;
}

export interface SiteInspectionChecklist {
    resultType: 'SITE_INSPECTION_CHECKLIST';
    inspectionDate: string;
    inspector: string;
    trade: string;
    area: string;
    items: ChecklistItem[];
}

export interface WeatherConditionReport {
    resultType: 'WEATHER_CONDITION_REPORT';
    reportDate: string;
    temperature: string;
    wind: string;
    precipitation: string;
    impactOnActivities: string;
}

export interface EquipmentUsageLog {
    resultType: 'EQUIPMENT_USAGE_LOG';
    logDate: string;
    logs: Array<{ equipment: string; operator: string; hoursUsed: number; notes?: string }>;
}

export interface MaterialDeliveryRecord {
    resultType: 'MATERIAL_DELIVERY_RECORD';
    deliveryDate: string;
    records: Array<{ material: string; supplier: string; quantity: string; qualityCheckStatus: 'Pass' | 'Fail'; storageLocation: string }>;
}

// ===================================================================
// START: Document Generation Agent - Site Manager (Continued)
// ===================================================================

export interface SiteMeetingMinutes {
    resultType: 'SITE_MEETING_MINUTES';
    meetingDate: string;
    attendees: string[];
    agenda: string[];
    decisionsMade: string[];
    actionItems: Array<{ action: string; responsible: string; deadline: string }>;
}

export interface NonConformanceReport {
    resultType: 'NON_CONFORMANCE_REPORT';
    standardReference: 'ISO 9001 Principles';
    reportDate: string;
    issueDescription: string;
    rootCause: string;
    correctiveActionProposed: string;
    actionTaken: string;
    verificationOfEffectiveness: string;
}

export interface SiteInstructionRecord {
    resultType: 'SITE_INSTRUCTION_RECORD';
    instructionDate: string;
    instructionNumber: string;
    issuedBy: string;
    issuedTo: string;
    instructionDetails: string;
}

export interface TemporaryWorksCertificate {
    resultType: 'TEMPORARY_WORKS_CERTIFICATE';
    certificateDate: string;
    descriptionOfWorks: string;
    designer: string;
    checker: string;
    approvalStatus: 'Approved' | 'Approved with Comments' | 'Rejected';
}


// ===================================================================
// START: DOCUMENT GENERATION AGENT - HSE OFFICER TYPES
// ===================================================================

export interface HealthAndSafetyPlan {
    resultType: 'HEALTH_AND_SAFETY_PLAN';
    standardReference: 'ISO 45001 Principles';
    projectId: string;
    preparedBy: string;
    revision: number;
    sections: Array<{ title: string; content: string }>;
}

export interface RiskAssessment {
    resultType: 'RISK_ASSESSMENT';
    activity: string;
    assessmentDate: string;
    assessor: string;
    risks: Array<{
        hazard: string;
        risk: string;
        likelihood: number; // 1-5
        severity: number; // 1-5
        riskRating: number;
        mitigation: string;
    }>;
}

export interface MethodStatement {
    resultType: 'METHOD_STATEMENT';
    activity: string;
    preparedBy: string;
    date: string;
    steps: Array<{
        stepNumber: number;
        description: string;
        safetyPrecautions: string;
    }>;
}

export interface HseAccidentReport {
    resultType: 'HSE_ACCIDENT_REPORT';
    standardReference: 'OSHA 301 Format';
    dateOfIncident: string;
    timeOfIncident: string;
    location: string;
    personnelInvolved: string[];
    description: string;
    rootCauseAnalysis: string;
    correctiveActions: string[];
    witnesses: string[];
}

export interface SafetyAuditReport {
    resultType: 'SAFETY_AUDIT_REPORT';
    auditDate: string;
    auditor: string;
    scope: string;
    findings: string[];
    nonConformities: string[];
    recommendations: string[];
}

export interface JobSafetyAnalysis {
    resultType: 'JOB_SAFETY_ANALYSIS';
    task: string;
    preparedBy: string;
    date: string;
    steps: Array<{
        step: string;
        potentialHazards: string[];
        controls: string[];
    }>;
}

export interface SafetyInspectionChecklist {
    resultType: 'SAFETY_INSPECTION_CHECKLIST';
    inspectionDate: string;
    inspector: string;
    area: string;
    items: ChecklistItem[];
}

export interface TrainingRecord {
    resultType: 'TRAINING_RECORD';
    courseTitle: string;
    trainer: string;
    date: string;
    attendees: Array<{ name: string; signature: boolean }>;
}

export interface PermitToWork {
    resultType: 'PERMIT_TO_WORK';
    permitNumber: string;
    date: string;
    workDescription: string;
    location: string;
    precautions: string[];
    authorizedBy: string;
}

export interface EnvironmentalMonitoringReport {
    resultType: 'ENVIRONMENTAL_MONITORING_REPORT';
    reportDate: string;
    monitoredBy: string;
    metrics: Array<{
        parameter: 'Air Quality' | 'Noise' | 'Water Quality';
        value: string;
        status: 'Compliant' | 'Action Required';
    }>;
}

export interface WasteManagementRecord {
    resultType: 'WASTE_MANAGEMENT_RECORD';
    date: string;
    records: Array<{
        wasteType: string;
        quantity: string;
        disposalMethod: string;
        contractor: string;
    }>;
}

export interface EmergencyResponsePlan {
    resultType: 'EMERGENCY_RESPONSE_PLAN';
    planVersion: string;
    lastUpdated: string;
    procedures: Array<{
        scenario: string;
        steps: string[];
    }>;
    emergencyContacts: Array<{
        role: string;
        name: string;
        contact: string;
    }>;
}

export interface SafetyPerformanceReport {
    resultType: 'SAFETY_PERFORMANCE_REPORT';
    reportingPeriod: string;
    kpis: Array<{
        metric: string;
        value: string;
        target: string;
        trend: 'Improving' | 'Stable' | 'Declining';
    }>;
    incidentSummary: string;
    leadingIndicators: string[];
}

export interface NonComplianceNotice {
    resultType: 'NON_COMPLIANCE_NOTICE';
    noticeNumber: string;
    date: string;
    issuedTo: string;
    description: string;
    requiredAction: string;
    deadline: string;
}


// ===================================================================
// START: DOCUMENT GENERATION AGENT - QUALITY CONTROL TYPES
// ===================================================================

export interface QualityManagementPlan {
    resultType: 'QUALITY_MANAGEMENT_PLAN';
    standardReference: 'ISO 9001:2015 Principles';
    projectId: string;
    preparedBy: string;
    revision: number;
    sections: Array<{ title: string; content: string }>;
}

export interface InspectionTestPlan {
    resultType: 'INSPECTION_TEST_PLAN';
    planTitle: string;
    trade: string;
    items: Array<{
        activity: string;
        referenceSpec: string;
        inspectionType: 'Visual' | 'Measurement' | 'Test' | 'Surveillance';
        acceptanceCriteria: string;
        interventionPoint: 'Hold' | 'Witness' | 'Surveillance';
        record: string;
    }>;
}

export interface QualityControlChecklist {
    resultType: 'QUALITY_CONTROL_CHECKLIST';
    inspectionDate: string;
    inspector: string;
    trade: string;
    area: string;
    items: ChecklistItem[];
}

export interface InspectionReport {
    resultType: 'INSPECTION_REPORT';
    reportNumber: string;
    inspectionDate: string;
    inspector: string;
    areaInspected: string;
    findings: string[];
    status: 'Approved' | 'Approved as Noted' | 'Rejected';
    photographicEvidencePaths?: string[];
}

export interface TestCertificate {
    resultType: 'TEST_CERTIFICATE';
    certificateNumber: string;
    testDate: string;
    materialOrSystem: string;
    testStandard: string;
    testResults: Array<{
        parameter: string;
        value: string;
        result: 'Pass' | 'Fail';
    }>;
    certifiedBy: string;
}

export interface NonConformanceReportQC {
    resultType: 'NON_CONFORMANCE_REPORT_QC';
    standardReference: 'ISO 9001 Principles';
    ncrNumber: string;
    dateIssued: string;
    description: string;
    specClauseViolated: string;
    rootCauseAnalysis: string;
    correctiveAction: string;
    preventiveAction: string;
    disposition: 'Rework' | 'Use As-Is' | 'Scrap';
}

export interface QualityAuditReport {
    resultType: 'QUALITY_AUDIT_REPORT';
    auditDate: string;
    auditor: string;
    scope: string;
    findings: string[];
    nonConformities: string[];
    recommendations: string[];
}

export interface CorrectiveActionRequest {
    resultType: 'CORRECTIVE_ACTION_REQUEST';
    carNumber: string;
    dateIssued: string;
    issuedTo: string;
    nonConformanceReference: string;
    description: string;
    requiredAction: string;
    deadline: string;
}

export interface QualityPerformanceMetrics {
    resultType: 'QUALITY_PERFORMANCE_METRICS';
    reportingPeriod: string;
    kpis: Array<{
        metric: string;
        value: string;
        target: string;
        trend: 'Improving' | 'Stable' | 'Declining';
    }>;
    summary: string;
}

export interface MaterialCertificationRecord {
    resultType: 'MATERIAL_CERTIFICATION_RECORD';
    recordDate: string;
    material: string;
    supplier: string;
    certificateNumber: string;
    complianceStatus: 'Verified' | 'Pending' | 'Rejected';
}

export interface CommissioningProcedure {
    resultType: 'COMMISSIONING_PROCEDURE';
    systemName: string;
    procedureNumber: string;
    steps: Array<{
        stepNumber: number;
        description: string;
        expectedResult: string;
        record: string;
    }>;
}

export interface HoldPointNotification {
    resultType: 'HOLD_POINT_NOTIFICATION';
    notificationDate: string;
    holdPointReference: string;
    description: string;
    requiredInspectionDate: string;
    issuedBy: string;
}

export interface QualitySurveillanceReport {
    resultType: 'QUALITY_SURVEILLANCE_REPORT';
    reportDate: string;
    surveyor: string;
    area: string;
    observations: string[];
    complianceStatus: 'Compliant' | 'Minor Issues' | 'Major Issues';
}

// ===================================================================
// START: AGENT PAYLOAD & UNION TYPES
// ===================================================================

export type SiteManagerDocumentResult =
    | DailySiteReport
    | SiteDiaryJournalEntry
    | ProgressReport
    | IncidentReport
    | SiteSafetyReport
    | ToolboxTalkRecord
    | SiteInspectionChecklist
    | WeatherConditionReport
    | EquipmentUsageLog
    | MaterialDeliveryRecord
    | SiteMeetingMinutes
    | NonConformanceReport
    | SiteInstructionRecord
    | TemporaryWorksCertificate;

export interface SiteManagerPayload {
    task: string;
    result: SiteManagerDocumentResult;
}

export type HseDocumentResult = 
    | HealthAndSafetyPlan
    | RiskAssessment
    | MethodStatement
    | HseAccidentReport
    | SafetyAuditReport
    | JobSafetyAnalysis
    | SafetyInspectionChecklist
    | TrainingRecord
    | PermitToWork
    | EnvironmentalMonitoringReport
    | WasteManagementRecord
    | EmergencyResponsePlan
    | SafetyPerformanceReport
    | NonComplianceNotice;

export interface HsePayload {
    task: string;
    result: HseDocumentResult;
}

export type QualityDocumentResult = 
    | QualityManagementPlan
    | InspectionTestPlan
    | QualityControlChecklist
    | InspectionReport
    | TestCertificate
    | NonConformanceReportQC
    | QualityAuditReport
    | CorrectiveActionRequest
    | QualityPerformanceMetrics
    | MaterialCertificationRecord
    | CommissioningProcedure
    | HoldPointNotification
    | QualitySurveillanceReport;

export interface QualityPayload {
    task: string;
    result: QualityDocumentResult;
}

export type DocumentGenerationResult = 
    | SiteManagerDocumentResult
    | HseDocumentResult
    | QualityDocumentResult;

export interface DocumentPayload {
    task: string;
    result: DocumentGenerationResult;
}

// ===================================================================
// START: GENERAL APP & UI TYPES
// ===================================================================

export type AiEngine = 'premium' | 'advanced' | 'compact';
export type AppMode = 'ANALYSIS' | 'LIVE' | 'COPILOT';
export type CoPilotStatus = 'listening' | 'thinking' | 'speaking' | 'displaying';
export type Language = 'en' | 'id';
export type CalculationStandard = 'SNI 2847:2019 (Indonesia)' | 'ACI 318-19 (USA)' | 'Eurocode 2 (Europe)' | 'BS 8110 (UK)';

export enum ConnectionStatus {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    NEEDS_ATTENTION = 'NEEDS_ATTENTION',
}

export interface User {
  name: string;
  email: string;
  picture?: string;
  onboardingComplete: boolean;
  calculationStandard: CalculationStandard;
  language: Language;
  suggestionFrequency: number; // 0-100
  proactiveAlerts: {
    weather: boolean;
    safety: boolean;
    schedule: boolean;
    fatigue: boolean;
  };
  learnPatterns: boolean;
}

export interface IntegrationSubService {
  id: string;
  name: string;
  permission: string;
}

export interface IntegrationService {
    id: string;
    name: string;
    description: string;
    status: ConnectionStatus;
    subServices?: IntegrationSubService[];
}

export interface DownloadStatus {
    status: 'idle' | 'downloading' | 'error';
    progress: number;
    message: string;
}

export type DownloadStatusMap = {
    [key in AiEngine]: DownloadStatus;
};

export interface AnalysisResult {
    id: number;
    image: string;
    analysisSummary: string;
    detectedObjects: DetectedObject[];
    status: 'processing' | 'complete' | 'error';
}

export interface AnalysisMessage {
    id: number;
    author: 'user' | 'ai';
    type: 'text' | 'analysis' | 'structural' | 'geotechnical' | 'document';
    text?: string;
    isTyping: boolean;
    image?: string;
    analysisSummary?: string;
    analysisResultId?: number;
    structuralCalculationPayload?: StructuralCalculationPayload;
    geotechnicalCalculationPayload?: GeotechnicalCalculationPayload;
    documentPayload?: DocumentPayload;
    isArchived?: boolean;
}

export type ReportablePayload = AnalysisResult | StructuralCalculationPayload | GeotechnicalCalculationPayload | DocumentPayload;

export type TimelineItem = (AnalysisResult | StructuralCalculationPayload | GeotechnicalCalculationPayload | DocumentPayload) & {
    id: number;
    timestamp: Date;
};

export interface ReportTemplate {
    id: string;
    name: string;
    scope: 'Company' | 'Project' | 'Personal';
    isBranded: boolean;
    description: string;
    headerImage?: string;
    footerImage?: string;
}

export interface EquipmentInfo {
    id: string;
    name: string;
    status: 'Operational' | 'Attention' | 'Offline';
}

export interface PriorityTask {
    id: string;
    title: string;
    deadline: string;
    category: 'Safety' | 'Quality' | 'Schedule' | 'Documentation';
    isCompleted: boolean;
}

export enum IntelligenceCardType {
    CRITICAL_RISK = 'CRITICAL_RISK',
    OPPORTUNITY = 'OPPORTUNITY',
    INFO = 'INFO',
}

export interface IntelligenceCard {
    id: string;
    type: IntelligenceCardType;
    icon: string; // Icon name from a predefined set
    title: string;
    message: string;
    timestamp: string; // "3 mins ago"
    source: string[]; // ["Weather API", "Schedule"]
}


export interface DashboardData {
    user: User;
    weather: {
        condition: string;
        temp: number;
        windSpeed: number;
        forecast: string;
    };
    team: {
        onSite: number;
        total: number;
        trades: Array<{ name: string; count: number }>;
    };
    equipment: EquipmentInfo[];
    progress: {
        completion: number;
        safetyScore: number;
    };
    alerts: DashboardAlert[];
    briefing: {
        cards: IntelligenceCard[];
        isLoading: boolean;
        error: string | null;
        lastUpdated: Date | null;
        hasNewCritical?: boolean;
    };
    dailyFocus: { text: string | null; isLoading: boolean; error: string | null };
    priorityTasks: { tasks: PriorityTask[]; isLoading: boolean; error: string | null };
}

export interface SubscriptionPlan {
    name: string;
    price: string;
    features: string[];
}

// ===================================================================
// START: INTEGRATION TYPES
// ===================================================================

// Integration Query and Response Types
export interface IntegratedQuery {
    id: string;
    query: string;
    userId: string;
    timestamp: Date;
    intent: 'project_status' | 'schedule' | 'communication' | 'document' | 'safety' | 'progress' | 'general';
    platforms: ('whatsapp' | 'google')[];
}

export interface IntegratedResponseData {
    id: string;
    queryId: string;
    sources: {
        whatsapp?: { status: 'success' | 'error'; data?: any; error?: string };
        google?: { status: 'success' | 'error'; data?: any; error?: string };
    };
    aggregatedContent: string;
    suggestedActions: PlatformActionSuggestion[];
    responseTime: number;
    timestamp: Date;
}

export interface PlatformActionSuggestion {
    id: string;
    title: string;
    description: string;
    actionType: 'send_message' | 'create_event' | 'upload_document' | 'send_email' | 'create_sheet';
    platforms: ('whatsapp' | 'google')[];
    parameters: Record<string, any>;
    confirmationRequired: boolean;
    estimatedImpact: 'low' | 'medium' | 'high';
}

// Webhook and Real-time Event Types
export interface WebhookEventBase {
    id: string;
    source: 'whatsapp' | 'google' | 'system';
    type: string;
    timestamp: Date;
    data: any;
    processed: boolean;
}

export interface WhatsAppWebhookEvent extends WebhookEventBase {
    source: 'whatsapp';
    type: 'message_received' | 'message_delivered' | 'message_read' | 'message_failed';
    data: {
        messageId: string;
        from: string;
        to: string;
        content?: string;
        mediaId?: string;
        status?: 'sent' | 'delivered' | 'read' | 'failed';
    };
}

export interface GoogleWebhookEvent extends WebhookEventBase {
    source: 'google';
    type: 'calendar_updated' | 'drive_file_changed' | 'gmail_received' | 'sheet_modified';
    data: {
        resourceId?: string;
        resourceUri?: string;
        eventType?: string;
        channelId?: string;
    };
}

// Integration Health and Status Types
export interface IntegrationHealthStatus {
    platform: 'whatsapp' | 'google' | 'orchestrator' | 'webhooks';
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    details: {
        connectivity: 'ok' | 'slow' | 'failed';
        authentication: 'valid' | 'expired' | 'invalid' | 'missing';
        quotaStatus?: 'normal' | 'approaching_limit' | 'exceeded';
        errors: string[];
        warnings: string[];
    };
}

export interface IntegrationMetrics {
    platform: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    uptime: number;
    lastActivity: Date;
    dailyUsage: Array<{
        date: string;
        requests: number;
        errors: number;
    }>;
}

// Action Execution Types
export interface ActionExecution {
    actionId: string;
    status: 'pending' | 'confirmed' | 'executing' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    userId: string;
    platformResults: Array<{
        platform: 'whatsapp' | 'google';
        success: boolean;
        data?: any;
        error?: string;
        executionTime: number;
    }>;
    rollbackAvailable: boolean;
    auditTrail: Array<{
        timestamp: Date;
        action: string;
        details: any;
    }>;
}

// ===================================================================
// END: INTEGRATION TYPES
// ===================================================================

// ===================================================================
// START: MODEL DOWNLOAD & HUGGING FACE TYPES
// ===================================================================

// HuggingFace MCP function types
export interface mcp__hugging_face__model_search {
    (params: {
        query?: string;
        author?: string;
        library?: string;
        limit?: number;
        sort?: 'trendingScore' | 'downloads' | 'likes' | 'createdAt' | 'lastModified';
        task?: string;
    }): Promise<any[]>;
}

export interface mcp__hugging_face__model_details {
    (params: { model_id: string }): Promise<any>;
}

// Local model download state
export interface ModelDownloadState {
    isDownloading: boolean;
    downloadQueue: string[];
    progress: Record<string, number>;
    errors: Record<string, string>;
}

// Model store modal state
export interface ModelStoreState {
    isOpen: boolean;
    selectedCategory?: string;
    searchQuery: string;
    loading: boolean;
}

// ===================================================================
// END: MODEL DOWNLOAD & HUGGING FACE TYPES  
// ===================================================================