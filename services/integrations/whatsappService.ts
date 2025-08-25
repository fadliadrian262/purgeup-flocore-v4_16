import { ConnectionStatus } from '../../types';

// WhatsApp Business API Configuration
export interface WhatsAppConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  webhookUrl?: string;
}

// WhatsApp API Response Types
interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'template';
  timestamp: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Construction Project Context for WhatsApp Integration
export interface ProjectCommunication {
  projectId: string;
  messageType: 'daily_report' | 'safety_alert' | 'progress_update' | 'inspection_photo' | 'general';
  content: string;
  mediaUrls?: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[]; // Phone numbers
}

// Real WhatsApp Business API Endpoints (2025)
const WHATSAPP_ENDPOINTS = {
  messages: (phoneNumberId: string) => `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
  media: (phoneNumberId: string) => `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
  uploadMedia: 'https://graph.facebook.com/v18.0/media',
  webhooks: (businessAccountId: string) => `https://graph.facebook.com/v18.0/${businessAccountId}/subscribed_apps`,
  templates: (businessAccountId: string) => `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
};

class WhatsAppService {
  private config: WhatsAppConfig;
  private isInitialized = false;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): WhatsAppConfig {
    // Load from environment variables (following existing pattern from geminiService)
    const config: WhatsAppConfig = {
      appId: process.env.WHATSAPP_APP_ID || '',
      appSecret: process.env.WHATSAPP_APP_SECRET || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
    };

    this.isInitialized = this.validateConfiguration(config);
    
    if (this.isInitialized) {
      console.log('✅ WhatsApp Business API service initialized successfully');
    } else {
      console.warn('⚠️ WhatsApp Business API service not properly configured');
    }

    return config;
  }

  private validateConfiguration(config: WhatsAppConfig): boolean {
    const required = ['appId', 'appSecret', 'accessToken', 'phoneNumberId', 'businessAccountId', 'webhookVerifyToken'];
    const missing = required.filter(key => !config[key as keyof WhatsAppConfig]);
    
    if (missing.length > 0) {
      console.warn(`🔴 Missing WhatsApp configuration: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  public getConnectionStatus(): ConnectionStatus {
    if (!this.isInitialized) {
      return ConnectionStatus.NEEDS_ATTENTION;
    }
    
    // TODO: Add actual health check API call
    return ConnectionStatus.CONNECTED;
  }

  // Real API call wrapper with error handling
  private async apiCall(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('WhatsApp service not initialized. Please check your configuration.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };

    if (data instanceof FormData) {
      delete headers['Content-Type']; // Let browser set boundary for FormData
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`WhatsApp API error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp API call failed:', error);
      throw error;
    }
  }

  // Real message sending implementation
  async sendTextMessage(to: string, message: string, context?: ProjectCommunication): Promise<string> {
    const endpoint = WHATSAPP_ENDPOINTS.messages(this.config.phoneNumberId);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/^\+/, ''), // Remove + prefix if present
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await this.apiCall('POST', endpoint, payload);
    console.log(`📱 WhatsApp message sent to ${to}:`, message.substring(0, 50) + '...');
    
    return response.messages[0].id;
  }

  // Template message for construction project notifications
  async sendTemplateMessage(to: string, templateName: string, parameters: string[], context?: ProjectCommunication): Promise<string> {
    const endpoint = WHATSAPP_ENDPOINTS.messages(this.config.phoneNumberId);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US', // or 'id' for Indonesian
        },
        components: [
          {
            type: 'body',
            parameters: parameters.map(param => ({ type: 'text', text: param })),
          },
        ],
      },
    };

    const response = await this.apiCall('POST', endpoint, payload);
    console.log(`📋 WhatsApp template message sent to ${to}: ${templateName}`);
    
    return response.messages[0].id;
  }

  // Real media upload implementation
  async uploadMedia(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type);
    formData.append('messaging_product', 'whatsapp');

    const response = await this.apiCall('POST', WHATSAPP_ENDPOINTS.uploadMedia, formData);
    console.log(`🖼️ Media uploaded to WhatsApp: ${file.name}`);
    
    return response.id;
  }

  // Send image with caption (for field photos)
  async sendImageMessage(to: string, mediaId: string, caption?: string, context?: ProjectCommunication): Promise<string> {
    const endpoint = WHATSAPP_ENDPOINTS.messages(this.config.phoneNumberId);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/^\+/, ''),
      type: 'image',
      image: {
        id: mediaId,
        caption: caption || '',
      },
    };

    const response = await this.apiCall('POST', endpoint, payload);
    console.log(`📸 WhatsApp image sent to ${to}${caption ? ` with caption: ${caption.substring(0, 30)}...` : ''}`);
    
    return response.messages[0].id;
  }

  // Construction-specific: Send daily site report
  async sendDailyReport(recipients: string[], reportData: {
    date: string;
    weather: string;
    personnel: number;
    progress: string;
    safetyObservations: string[];
    issues?: string[];
  }): Promise<void> {
    const message = this.formatDailyReportMessage(reportData);
    
    const sendPromises = recipients.map(recipient => 
      this.sendTextMessage(recipient, message, {
        projectId: 'current', // Would be passed from context
        messageType: 'daily_report',
        content: message,
        urgency: 'medium',
        recipients,
      })
    );

    await Promise.allSettled(sendPromises);
    console.log(`📊 Daily report sent to ${recipients.length} recipients`);
  }

  // Construction-specific: Send safety alert
  async sendSafetyAlert(recipients: string[], alertData: {
    type: 'incident' | 'hazard' | 'weather' | 'evacuation';
    message: string;
    location?: string;
    urgency: 'high' | 'critical';
  }): Promise<void> {
    const urgencyEmoji = alertData.urgency === 'critical' ? '🚨' : '⚠️';
    const message = `${urgencyEmoji} SAFETY ALERT ${urgencyEmoji}\n\n` +
                   `Type: ${alertData.type.toUpperCase()}\n` +
                   `${alertData.location ? `Location: ${alertData.location}\n` : ''}` +
                   `Message: ${alertData.message}\n\n` +
                   `Please acknowledge receipt and take necessary action immediately.`;

    const sendPromises = recipients.map(recipient => 
      this.sendTextMessage(recipient, message, {
        projectId: 'current',
        messageType: 'safety_alert',
        content: message,
        urgency: alertData.urgency,
        recipients,
      })
    );

    await Promise.allSettled(sendPromises);
    console.log(`🚨 Safety alert sent to ${recipients.length} recipients`);
  }

  // Real webhook setup for receiving messages
  async setupWebhooks(callbackUrl: string): Promise<void> {
    if (!callbackUrl.startsWith('https://')) {
      throw new Error('Webhook URL must be HTTPS');
    }

    const endpoint = WHATSAPP_ENDPOINTS.webhooks(this.config.businessAccountId);
    
    const payload = {
      callback_url: callbackUrl,
      verify_token: this.config.webhookVerifyToken,
      fields: ['messages', 'message_deliveries', 'message_reads'],
    };

    await this.apiCall('POST', endpoint, payload);
    console.log(`🔗 WhatsApp webhooks configured for: ${callbackUrl}`);
  }

  // Webhook verification (for Express.js endpoint)
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('✅ WhatsApp webhook verified');
      return challenge;
    }
    console.error('🔴 WhatsApp webhook verification failed');
    return null;
  }

  // Process incoming webhook payload
  processWebhookPayload(payload: WhatsAppWebhookPayload): WhatsAppMessage[] {
    const messages: WhatsAppMessage[] = [];
    
    payload.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        if (change.value.messages) {
          messages.push(...change.value.messages);
        }
      });
    });

    console.log(`📩 Processed ${messages.length} incoming WhatsApp messages`);
    return messages;
  }

  // Helper method to format daily report message
  private formatDailyReportMessage(reportData: {
    date: string;
    weather: string;
    personnel: number;
    progress: string;
    safetyObservations: string[];
    issues?: string[];
  }): string {
    let message = `📋 DAILY SITE REPORT - ${reportData.date}\n\n`;
    message += `Weather: ${reportData.weather}\n`;
    message += `Personnel on site: ${reportData.personnel}\n\n`;
    message += `Progress Update:\n${reportData.progress}\n\n`;
    
    if (reportData.safetyObservations.length > 0) {
      message += `Safety Observations:\n${reportData.safetyObservations.map(obs => `• ${obs}`).join('\n')}\n\n`;
    }
    
    if (reportData.issues && reportData.issues.length > 0) {
      message += `Issues/Delays:\n${reportData.issues.map(issue => `• ${issue}`).join('\n')}\n\n`;
    }
    
    message += `Generated by FLOCORE AI - Construction Management Platform`;
    
    return message;
  }

  // Get service status for dashboard
  getServiceStatus(): {
    isConnected: boolean;
    lastActivity?: Date;
    phoneNumber: string;
    businessAccount: string;
  } {
    return {
      isConnected: this.isInitialized,
      phoneNumber: this.config.phoneNumberId,
      businessAccount: this.config.businessAccountId,
    };
  }
}

// Export singleton instance (following existing pattern)
export const whatsappService = new WhatsAppService();
export default whatsappService;