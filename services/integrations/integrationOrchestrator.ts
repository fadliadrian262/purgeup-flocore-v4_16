import { whatsappService } from './whatsappService';
import { googleWorkspaceService } from './googleWorkspaceService';
import { geminiService } from '../geminiService';
import { ConnectionStatus } from '../../types';

// Query Intent Recognition
export interface QueryIntent {
  type: 'project_status' | 'schedule' | 'communication' | 'document' | 'safety' | 'progress' | 'general';
  entities: {
    projectId?: string;
    dateRange?: { start: string; end: string };
    documentType?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    recipients?: string[];
    action?: string;
  };
  confidence: number;
  originalQuery: string;
}

// Integrated Response Structure
export interface IntegratedResponse {
  id: string;
  query: string;
  timestamp: Date;
  sources: {
    whatsapp?: {
      status: 'success' | 'error' | 'partial';
      data?: any;
      error?: string;
    };
    google?: {
      status: 'success' | 'error' | 'partial';
      data?: any;
      error?: string;
    };
  };
  aggregatedData: {
    summary: string;
    details: Array<{
      source: 'whatsapp' | 'google' | 'system';
      type: string;
      content: any;
      timestamp?: string;
    }>;
    conflicts?: Array<{
      description: string;
      sources: string[];
      resolution?: string;
    }>;
  };
  suggestedActions: PlatformAction[];
  responseTime: number;
}

// Cross-Platform Action Definition
export interface PlatformAction {
  id: string;
  title: string;
  description: string;
  platforms: ('whatsapp' | 'google')[];
  actionType: 'send_message' | 'create_event' | 'upload_document' | 'send_email' | 'create_sheet' | 'send_report';
  parameters: Record<string, any>;
  confirmationRequired: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
}

// Action Execution Result
export interface ExecutionResult {
  actionId: string;
  status: 'success' | 'partial' | 'failed';
  results: Array<{
    platform: 'whatsapp' | 'google';
    success: boolean;
    data?: any;
    error?: string;
  }>;
  executionTime: number;
  rollbackAvailable: boolean;
}

// Cached Data Interface
interface CachedData {
  query: string;
  response: IntegratedResponse;
  expiresAt: number;
}

class IntegrationOrchestrator {
  private cache = new Map<string, CachedData>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private executedActions = new Map<string, ExecutionResult>();

  constructor() {
    console.log('🎯 Integration Orchestrator initialized');
  }

  // Main entry point for conversational queries
  async processConversationalQuery(query: string, userId: string): Promise<IntegratedResponse> {
    const startTime = Date.now();
    console.log(`🔍 Processing conversational query: "${query}"`);

    // Check cache first
    const cacheKey = this.generateCacheKey(query, userId);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      console.log('⚡ Returning cached response');
      return cached;
    }

    try {
      // 1. Parse intent using Gemini AI
      const intent = await this.parseQueryIntent(query);
      console.log(`🧠 Detected intent: ${intent.type} (confidence: ${intent.confidence})`);

      // 2. Gather data from platforms in parallel
      const [whatsappData, googleData] = await Promise.allSettled([
        this.gatherWhatsAppData(intent),
        this.gatherGoogleData(intent)
      ]);

      // 3. Aggregate and process data
      const aggregatedData = await this.aggregateData(
        whatsappData.status === 'fulfilled' ? whatsappData.value : null,
        googleData.status === 'fulfilled' ? googleData.value : null,
        intent
      );

      // 4. Generate suggested actions
      const suggestedActions = await this.generateSuggestedActions(intent, aggregatedData);

      // 5. Create integrated response
      const response: IntegratedResponse = {
        id: this.generateResponseId(),
        query,
        timestamp: new Date(),
        sources: {
          whatsapp: whatsappData.status === 'fulfilled' ? 
            { status: 'success', data: whatsappData.value } : 
            { status: 'error', error: whatsappData.reason?.message },
          google: googleData.status === 'fulfilled' ? 
            { status: 'success', data: googleData.value } : 
            { status: 'error', error: googleData.reason?.message }
        },
        aggregatedData,
        suggestedActions,
        responseTime: Date.now() - startTime
      };

      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      console.log(`✅ Query processed in ${response.responseTime}ms`);
      return response;

    } catch (error) {
      console.error('❌ Error processing conversational query:', error);
      
      // Return error response
      return {
        id: this.generateResponseId(),
        query,
        timestamp: new Date(),
        sources: {},
        aggregatedData: {
          summary: 'I encountered an error while processing your request. Some integrations may be unavailable.',
          details: [{
            source: 'system',
            type: 'error',
            content: { message: error instanceof Error ? error.message : 'Unknown error' }
          }]
        },
        suggestedActions: [],
        responseTime: Date.now() - startTime
      };
    }
  }

  // Parse natural language query into structured intent
  private async parseQueryIntent(query: string): Promise<QueryIntent> {
    if (!geminiService.isReady()) {
      // Fallback to basic keyword matching
      return this.parseIntentFallback(query);
    }

    const prompt = `
    Analyze this construction project query and extract the intent and entities:
    
    Query: "${query}"
    
    Respond with JSON containing:
    {
      "type": "project_status|schedule|communication|document|safety|progress|general",
      "entities": {
        "projectId": "string or null",
        "dateRange": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} or null,
        "documentType": "report|calculation|drawing|inspection|photo|compliance" or null,
        "urgency": "low|medium|high|critical" or null,
        "recipients": ["phone numbers or emails"] or null,
        "action": "create|send|update|retrieve|delete" or null
      },
      "confidence": 0.0-1.0
    }
    
    Focus on construction industry context. Be precise with entity extraction.
    `;

    try {
      const response = await geminiService.generateContent(prompt);
      const parsed = JSON.parse(response);
      
      return {
        ...parsed,
        originalQuery: query
      };
    } catch (error) {
      console.warn('Failed to parse intent with Gemini, using fallback');
      return this.parseIntentFallback(query);
    }
  }

  // Fallback intent parsing using keywords
  private parseIntentFallback(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    let type: QueryIntent['type'] = 'general';
    let confidence = 0.6;
    
    if (lowerQuery.includes('schedule') || lowerQuery.includes('timeline') || lowerQuery.includes('calendar')) {
      type = 'schedule';
      confidence = 0.8;
    } else if (lowerQuery.includes('safety') || lowerQuery.includes('incident') || lowerQuery.includes('hazard')) {
      type = 'safety';
      confidence = 0.8;
    } else if (lowerQuery.includes('progress') || lowerQuery.includes('status') || lowerQuery.includes('completion')) {
      type = 'project_status';
      confidence = 0.7;
    } else if (lowerQuery.includes('document') || lowerQuery.includes('report') || lowerQuery.includes('file')) {
      type = 'document';
      confidence = 0.7;
    } else if (lowerQuery.includes('message') || lowerQuery.includes('send') || lowerQuery.includes('notify')) {
      type = 'communication';
      confidence = 0.7;
    }

    return {
      type,
      entities: {},
      confidence,
      originalQuery: query
    };
  }

  // Gather data from WhatsApp based on intent
  private async gatherWhatsAppData(intent: QueryIntent): Promise<any> {
    if (whatsappService.getConnectionStatus() !== ConnectionStatus.CONNECTED) {
      throw new Error('WhatsApp service not connected');
    }

    // Mock data gathering - in real implementation, this would query WhatsApp API
    // for message history, group discussions, media files, etc.
    console.log('📱 Gathering WhatsApp data...');
    
    const mockData = {
      recentMessages: [
        {
          from: '+1234567890',
          content: 'Site inspection completed. Foundation looks good.',
          timestamp: new Date().toISOString(),
          type: 'text'
        }
      ],
      groupActivity: {
        totalMessages: 15,
        lastActivity: new Date().toISOString(),
        activeUsers: 8
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      platform: 'whatsapp',
      data: mockData,
      timestamp: new Date().toISOString()
    };
  }

  // Gather data from Google Workspace based on intent
  private async gatherGoogleData(intent: QueryIntent): Promise<any> {
    if (googleWorkspaceService.getConnectionStatus() !== ConnectionStatus.CONNECTED) {
      throw new Error('Google Workspace service not connected');
    }

    console.log('📊 Gathering Google Workspace data...');
    
    // Mock data gathering - in real implementation, this would query Google APIs
    const mockData = {
      calendarEvents: [
        {
          title: 'Foundation Inspection',
          start: new Date().toISOString(),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          attendees: ['inspector@project.com', 'manager@project.com']
        }
      ],
      driveFiles: [
        {
          name: 'Daily Progress Report - 2025-08-24.pdf',
          modifiedTime: new Date().toISOString(),
          size: '2.5MB'
        }
      ],
      emailActivity: {
        unreadCount: 3,
        lastEmail: new Date().toISOString()
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      platform: 'google',
      data: mockData,
      timestamp: new Date().toISOString()
    };
  }

  // Aggregate data from multiple platforms
  private async aggregateData(whatsappData: any, googleData: any, intent: QueryIntent): Promise<any> {
    console.log('🔗 Aggregating data from platforms...');

    const details: any[] = [];
    let summary = '';

    // Process WhatsApp data
    if (whatsappData?.data) {
      details.push({
        source: 'whatsapp',
        type: 'messages',
        content: whatsappData.data.recentMessages,
        timestamp: whatsappData.timestamp
      });

      details.push({
        source: 'whatsapp',
        type: 'activity',
        content: whatsappData.data.groupActivity,
        timestamp: whatsappData.timestamp
      });
    }

    // Process Google data
    if (googleData?.data) {
      details.push({
        source: 'google',
        type: 'calendar',
        content: googleData.data.calendarEvents,
        timestamp: googleData.timestamp
      });

      details.push({
        source: 'google',
        type: 'documents',
        content: googleData.data.driveFiles,
        timestamp: googleData.timestamp
      });
    }

    // Generate intelligent summary based on intent
    if (intent.type === 'project_status') {
      summary = `Based on recent communications and scheduled activities, the project shows active progress. ` +
                `${whatsappData?.data?.groupActivity?.totalMessages || 0} recent team messages and ` +
                `${googleData?.data?.calendarEvents?.length || 0} upcoming scheduled events.`;
    } else if (intent.type === 'schedule') {
      summary = `Found ${googleData?.data?.calendarEvents?.length || 0} upcoming events in your calendar. ` +
                `Team is actively communicating with ${whatsappData?.data?.groupActivity?.totalMessages || 0} recent messages.`;
    } else {
      summary = `Integrated data from WhatsApp communications and Google Workspace activities. ` +
                `${details.length} data sources processed successfully.`;
    }

    return {
      summary,
      details,
      conflicts: [] // TODO: Implement conflict detection
    };
  }

  // Generate suggested actions based on data and intent
  private async generateSuggestedActions(intent: QueryIntent, aggregatedData: any): Promise<PlatformAction[]> {
    const actions: PlatformAction[] = [];

    // Generate context-aware actions
    if (intent.type === 'communication') {
      actions.push({
        id: this.generateActionId(),
        title: 'Send Progress Update to Team',
        description: 'Send a WhatsApp message with current project status to all team members',
        platforms: ['whatsapp'],
        actionType: 'send_message',
        parameters: {
          recipients: ['team_group'],
          messageType: 'progress_update',
          template: 'daily_progress'
        },
        confirmationRequired: true,
        estimatedImpact: 'medium'
      });
    }

    if (intent.type === 'schedule') {
      actions.push({
        id: this.generateActionId(),
        title: 'Create Calendar Event',
        description: 'Schedule a new project milestone or meeting in Google Calendar',
        platforms: ['google'],
        actionType: 'create_event',
        parameters: {
          calendarId: 'primary',
          eventType: 'project_milestone'
        },
        confirmationRequired: true,
        estimatedImpact: 'medium'
      });
    }

    if (intent.type === 'document') {
      actions.push({
        id: this.generateActionId(),
        title: 'Generate Project Report',
        description: 'Create and upload a comprehensive project report to Google Drive',
        platforms: ['google'],
        actionType: 'upload_document',
        parameters: {
          documentType: 'project_report',
          includeData: ['progress', 'safety', 'communications']
        },
        confirmationRequired: false,
        estimatedImpact: 'low'
      });
    }

    return actions;
  }

  // Execute confirmed action across platforms
  async executeConfirmedAction(actionId: string, userId: string): Promise<ExecutionResult> {
    console.log(`⚡ Executing action: ${actionId}`);
    const startTime = Date.now();

    // This would contain the actual action from suggestedActions
    // For now, we'll mock the execution
    const mockResults: ExecutionResult = {
      actionId,
      status: 'success',
      results: [
        {
          platform: 'whatsapp',
          success: true,
          data: { messageId: 'wamid.123456789' }
        },
        {
          platform: 'google',
          success: true,
          data: { eventId: 'event_123456789' }
        }
      ],
      executionTime: Date.now() - startTime,
      rollbackAvailable: true
    };

    // Store execution result for audit trail
    this.executedActions.set(actionId, mockResults);
    
    console.log(`✅ Action executed successfully in ${mockResults.executionTime}ms`);
    return mockResults;
  }

  // Get integration health status
  getIntegrationStatus(): {
    whatsapp: ConnectionStatus;
    google: ConnectionStatus;
    orchestrator: 'healthy' | 'degraded' | 'unavailable';
  } {
    const whatsappStatus = whatsappService.getConnectionStatus();
    const googleStatus = googleWorkspaceService.getConnectionStatus();
    
    let orchestratorStatus: 'healthy' | 'degraded' | 'unavailable' = 'healthy';
    
    if (whatsappStatus === ConnectionStatus.DISCONNECTED && googleStatus === ConnectionStatus.DISCONNECTED) {
      orchestratorStatus = 'unavailable';
    } else if (whatsappStatus !== ConnectionStatus.CONNECTED || googleStatus !== ConnectionStatus.CONNECTED) {
      orchestratorStatus = 'degraded';
    }

    return {
      whatsapp: whatsappStatus,
      google: googleStatus,
      orchestrator: orchestratorStatus
    };
  }

  // Cache management
  private generateCacheKey(query: string, userId: string): string {
    const hash = btoa(query + userId).replace(/[/+=]/g, '');
    return hash.substring(0, 16);
  }

  private getCachedResponse(key: string): IntegratedResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.response;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private cacheResponse(key: string, response: IntegratedResponse): void {
    this.cache.set(key, {
      query: response.query,
      response,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Utility methods
  private generateResponseId(): string {
    return 'resp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private generateActionId(): string {
    return 'action_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Get execution history for audit
  getExecutionHistory(): ExecutionResult[] {
    return Array.from(this.executedActions.values()).sort((a, b) => b.executionTime - a.executionTime);
  }
}

// Export singleton instance
export const integrationOrchestrator = new IntegrationOrchestrator();
export default integrationOrchestrator;