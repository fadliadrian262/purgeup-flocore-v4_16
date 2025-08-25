import { whatsappService } from './whatsappService';
import { googleWorkspaceService } from './googleWorkspaceService';
import { integrationOrchestrator } from './integrationOrchestrator';

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  source: 'whatsapp' | 'google' | 'system';
  type: string;
  timestamp: Date;
  data: any;
  processed: boolean;
  retryCount?: number;
}

// WhatsApp Webhook Events
interface WhatsAppWebhookEvent extends WebhookEvent {
  source: 'whatsapp';
  type: 'message_received' | 'message_delivered' | 'message_read' | 'message_failed';
  data: {
    messageId: string;
    from: string;
    to: string;
    content?: string;
    mediaId?: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
  };
}

// Google Webhook Events (Push Notifications)
interface GoogleWebhookEvent extends WebhookEvent {
  source: 'google';
  type: 'calendar_updated' | 'drive_file_changed' | 'gmail_received' | 'sheet_modified';
  data: {
    resourceId?: string;
    resourceUri?: string;
    eventType?: string;
    eventId?: string;
    channelId?: string;
    channelToken?: string;
  };
}

// Real-time Event Handler Interface
interface EventHandler {
  eventType: string;
  handler: (event: WebhookEvent) => Promise<void>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Webhook Subscription Management
interface WebhookSubscription {
  id: string;
  platform: 'whatsapp' | 'google';
  resourceType: string;
  callbackUrl: string;
  isActive: boolean;
  expiresAt?: Date;
  lastActivity?: Date;
}

class WebhookManager {
  private eventQueue: WebhookEvent[] = [];
  private eventHandlers: Map<string, EventHandler> = new Map();
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private isProcessing = false;
  private maxRetries = 3;
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEventHandlers();
    this.startEventProcessor();
    console.log('🔄 Webhook Manager initialized');
  }

  // Initialize default event handlers
  private initializeEventHandlers(): void {
    // WhatsApp Message Handlers
    this.registerHandler({
      eventType: 'whatsapp.message_received',
      handler: this.handleWhatsAppMessageReceived.bind(this),
      priority: 'high'
    });

    this.registerHandler({
      eventType: 'whatsapp.message_delivered',
      handler: this.handleWhatsAppMessageDelivered.bind(this),
      priority: 'medium'
    });

    // Google Workspace Handlers
    this.registerHandler({
      eventType: 'google.calendar_updated',
      handler: this.handleGoogleCalendarUpdated.bind(this),
      priority: 'medium'
    });

    this.registerHandler({
      eventType: 'google.drive_file_changed',
      handler: this.handleGoogleDriveFileChanged.bind(this),
      priority: 'medium'
    });

    console.log('📋 Event handlers registered');
  }

  // Register new event handler
  public registerHandler(handler: EventHandler): void {
    this.eventHandlers.set(handler.eventType, handler);
    console.log(`✅ Handler registered: ${handler.eventType}`);
  }

  // Process incoming WhatsApp webhook
  public async processWhatsAppWebhook(payload: any): Promise<{ status: 'success' | 'error'; message: string }> {
    try {
      console.log('📱 Processing WhatsApp webhook payload');

      // Verify webhook signature (security)
      const signature = payload.headers?.['x-hub-signature-256'];
      if (signature) {
        // TODO: Implement signature verification
        // const isValid = whatsappService.verifyWebhookSignature(payload.body, signature);
        // if (!isValid) {
        //   return { status: 'error', message: 'Invalid webhook signature' };
        // }
      }

      // Process webhook verification
      if (payload.hub?.mode === 'subscribe') {
        const challenge = whatsappService.verifyWebhook(
          payload.hub.mode,
          payload.hub.verify_token,
          payload.hub.challenge
        );
        if (challenge) {
          return { status: 'success', message: challenge };
        } else {
          return { status: 'error', message: 'Webhook verification failed' };
        }
      }

      // Process actual webhook events
      if (payload.object === 'whatsapp_business_account' && payload.entry) {
        for (const entry of payload.entry) {
          for (const change of entry.changes || []) {
            await this.processWhatsAppChange(change);
          }
        }
      }

      return { status: 'success', message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('❌ Error processing WhatsApp webhook:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Process individual WhatsApp change event
  private async processWhatsAppChange(change: any): Promise<void> {
    const { value, field } = change;

    if (field === 'messages' && value.messages) {
      for (const message of value.messages) {
        const event: WhatsAppWebhookEvent = {
          id: this.generateEventId(),
          source: 'whatsapp',
          type: 'message_received',
          timestamp: new Date(),
          processed: false,
          data: {
            messageId: message.id,
            from: message.from,
            to: value.metadata?.phone_number_id || '',
            content: message.text?.body || message.image?.caption || '',
            mediaId: message.image?.id || message.document?.id,
            timestamp: message.timestamp
          }
        };
        
        this.queueEvent(event);
      }
    }

    if (field === 'messages' && value.statuses) {
      for (const status of value.statuses) {
        const event: WhatsAppWebhookEvent = {
          id: this.generateEventId(),
          source: 'whatsapp',
          type: 'message_delivered',
          timestamp: new Date(),
          processed: false,
          data: {
            messageId: status.id,
            from: '',
            to: status.recipient_id,
            status: status.status as any,
            timestamp: status.timestamp
          }
        };
        
        this.queueEvent(event);
      }
    }
  }

  // Process Google Workspace webhook (Push Notifications)
  public async processGoogleWebhook(payload: any): Promise<{ status: 'success' | 'error'; message: string }> {
    try {
      console.log('📊 Processing Google Workspace webhook payload');

      // Extract push notification data
      const channelId = payload.headers?.['x-goog-channel-id'];
      const resourceId = payload.headers?.['x-goog-resource-id'];
      const resourceUri = payload.headers?.['x-goog-resource-uri'];
      const eventType = payload.headers?.['x-goog-resource-state'];

      if (!channelId || !resourceId) {
        return { status: 'error', message: 'Missing required headers' };
      }

      // Determine event type based on resource URI
      let webhookType = 'google.resource_updated';
      if (resourceUri?.includes('/calendar/')) {
        webhookType = 'google.calendar_updated';
      } else if (resourceUri?.includes('/drive/')) {
        webhookType = 'google.drive_file_changed';
      } else if (resourceUri?.includes('/gmail/')) {
        webhookType = 'google.gmail_received';
      }

      const event: GoogleWebhookEvent = {
        id: this.generateEventId(),
        source: 'google',
        type: webhookType.split('.')[1] as any,
        timestamp: new Date(),
        processed: false,
        data: {
          resourceId,
          resourceUri,
          eventType,
          channelId,
          channelToken: payload.headers?.['x-goog-channel-token']
        }
      };

      this.queueEvent(event);
      return { status: 'success', message: 'Google webhook processed successfully' };
    } catch (error) {
      console.error('❌ Error processing Google webhook:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Queue event for processing
  private queueEvent(event: WebhookEvent): void {
    // Insert based on priority (critical events first)
    const handler = this.eventHandlers.get(`${event.source}.${event.type}`);
    const priority = handler?.priority || 'low';
    
    if (priority === 'critical') {
      this.eventQueue.unshift(event);
    } else if (priority === 'high') {
      const criticalCount = this.eventQueue.filter(e => {
        const h = this.eventHandlers.get(`${e.source}.${e.type}`);
        return h?.priority === 'critical';
      }).length;
      this.eventQueue.splice(criticalCount, 0, event);
    } else {
      this.eventQueue.push(event);
    }

    console.log(`📬 Event queued: ${event.source}.${event.type} (${priority} priority)`);
  }

  // Start event processor (runs continuously)
  private startEventProcessor(): void {
    this.processInterval = setInterval(async () => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, 1000); // Process every second
  }

  // Process queued events
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.eventQueue.length} queued events`);

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      try {
        await this.processEvent(event);
        event.processed = true;
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
        
        // Retry logic
        event.retryCount = (event.retryCount || 0) + 1;
        if (event.retryCount < this.maxRetries) {
          console.log(`🔄 Retrying event ${event.id} (attempt ${event.retryCount + 1})`);
          this.eventQueue.push(event); // Re-queue for retry
        } else {
          console.error(`❌ Max retries exceeded for event ${event.id}`);
        }
      }
    }

    this.isProcessing = false;
  }

  // Process individual event
  private async processEvent(event: WebhookEvent): Promise<void> {
    const handlerKey = `${event.source}.${event.type}`;
    const handler = this.eventHandlers.get(handlerKey);

    if (handler) {
      await handler.handler(event);
    } else {
      console.warn(`⚠️ No handler found for event type: ${handlerKey}`);
    }
  }

  // Event Handlers

  private async handleWhatsAppMessageReceived(event: WhatsAppWebhookEvent): Promise<void> {
    console.log(`📱 New WhatsApp message from ${event.data.from}: ${event.data.content?.substring(0, 50)}...`);
    
    // Check if this is a project-related message
    const isProjectMessage = await this.classifyProjectMessage(event.data.content || '');
    
    if (isProjectMessage) {
      // Trigger intelligent processing
      // This could update project status, extract action items, etc.
      console.log('🏗️ Project-related message detected, triggering intelligent processing');
      
      // Example: Auto-acknowledge safety reports
      if (event.data.content?.toLowerCase().includes('safety') || event.data.content?.toLowerCase().includes('incident')) {
        await whatsappService.sendTextMessage(
          event.data.from,
          '✅ Safety report received and logged. Our team will review this immediately. Thank you for reporting.'
        );
      }
    }
  }

  private async handleWhatsAppMessageDelivered(event: WhatsAppWebhookEvent): Promise<void> {
    console.log(`📱 WhatsApp message delivered: ${event.data.messageId} (${event.data.status})`);
    // Update delivery status in database/logs
  }

  private async handleGoogleCalendarUpdated(event: GoogleWebhookEvent): Promise<void> {
    console.log(`📅 Google Calendar updated: ${event.data.resourceId}`);
    
    // Fetch updated calendar data and sync with project timeline
    // This could trigger notifications to WhatsApp groups about schedule changes
    
    // Example: Notify team about new milestone
    const newEvents = []; // Would fetch from Google Calendar API
    if (newEvents.length > 0) {
      // Send WhatsApp notification to project team
      console.log('📅 Sending calendar update notifications to WhatsApp groups');
    }
  }

  private async handleGoogleDriveFileChanged(event: GoogleWebhookEvent): Promise<void> {
    console.log(`📄 Google Drive file changed: ${event.data.resourceId}`);
    
    // Check if it's a project document that should trigger notifications
    // Example: New inspection report uploaded
    console.log('📄 Processing document change notifications');
  }

  // Helper method to classify if message is project-related
  private async classifyProjectMessage(content: string): Promise<boolean> {
    if (!content) return false;
    
    const projectKeywords = [
      'site', 'construction', 'progress', 'inspection', 'safety', 'incident',
      'foundation', 'concrete', 'steel', 'delivery', 'schedule', 'deadline',
      'quality', 'compliance', 'report', 'issue', 'problem', 'delay'
    ];

    const lowerContent = content.toLowerCase();
    return projectKeywords.some(keyword => lowerContent.includes(keyword));
  }

  // Webhook Subscription Management

  public async subscribeToWhatsAppWebhooks(callbackUrl: string): Promise<void> {
    try {
      await whatsappService.setupWebhooks(callbackUrl);
      
      const subscription: WebhookSubscription = {
        id: this.generateSubscriptionId(),
        platform: 'whatsapp',
        resourceType: 'messages',
        callbackUrl,
        isActive: true,
        lastActivity: new Date()
      };
      
      this.subscriptions.set(subscription.id, subscription);
      console.log('✅ WhatsApp webhook subscription created');
    } catch (error) {
      console.error('❌ Failed to subscribe to WhatsApp webhooks:', error);
      throw error;
    }
  }

  public async subscribeToGoogleWebhooks(resourceType: 'calendar' | 'drive' | 'gmail', callbackUrl: string): Promise<void> {
    try {
      // Note: Google Push Notifications require separate setup for each service
      console.log(`📊 Setting up Google ${resourceType} webhook subscription`);
      
      const subscription: WebhookSubscription = {
        id: this.generateSubscriptionId(),
        platform: 'google',
        resourceType,
        callbackUrl,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivity: new Date()
      };
      
      this.subscriptions.set(subscription.id, subscription);
      console.log(`✅ Google ${resourceType} webhook subscription created`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to Google ${resourceType} webhooks:`, error);
      throw error;
    }
  }

  // Get webhook status for dashboard
  public getWebhookStatus(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    recentEvents: number;
    queueLength: number;
    lastProcessed?: Date;
  } {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    
    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      recentEvents: 0, // Would track recent event count
      queueLength: this.eventQueue.length,
    };
  }

  // Utility methods
  private generateEventId(): string {
    return 'event_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private generateSubscriptionId(): string {
    return 'sub_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Cleanup
  public destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    console.log('🔄 Webhook Manager destroyed');
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
export default webhookManager;