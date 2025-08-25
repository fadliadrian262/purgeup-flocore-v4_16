import { ConnectionStatus } from '../../types';

// Google Workspace Configuration
export interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  projectId: string;
}

// OAuth2 Token Management
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
}

// Real Google Workspace OAuth Scopes (2025 Compliant)
export const GOOGLE_SCOPES = {
  // Calendar integration for project scheduling
  calendar: [
    'https://www.googleapis.com/auth/calendar.events',      // Create/edit events
    'https://www.googleapis.com/auth/calendar.readonly'     // Read calendars
  ],
  
  // Drive integration for document storage (using file scope for security)
  drive: [
    'https://www.googleapis.com/auth/drive.file',           // Recommended: per-file access
    'https://www.googleapis.com/auth/drive.readonly'        // Read existing files
  ],
  
  // Sheets integration for data export/import
  sheets: [
    'https://www.googleapis.com/auth/spreadsheets',         // Full spreadsheet access
    'https://www.googleapis.com/auth/drive.file'            // File creation
  ],
  
  // Gmail integration for notifications
  gmail: [
    'https://www.googleapis.com/auth/gmail.compose',        // Create drafts/send
    'https://www.googleapis.com/auth/gmail.readonly'        // Read emails
  ]
};

// Construction Project Data Types for Google Workspace Integration
export interface ProjectSchedule {
  projectId: string;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: 'foundation' | 'structure' | 'finishes' | 'inspection' | 'delivery';
    attendees?: string[];
  }>;
}

export interface ProjectDocument {
  name: string;
  content: string | ArrayBuffer;
  mimeType: string;
  folderId?: string;
  metadata?: {
    projectId: string;
    documentType: 'report' | 'calculation' | 'drawing' | 'inspection' | 'compliance';
    createdBy: string;
  };
}

export interface ProjectDataExport {
  projectId: string;
  sheetTitle: string;
  data: Array<Record<string, any>>;
  headers: string[];
  metadata?: {
    exportType: 'progress' | 'safety' | 'quality' | 'financial' | 'schedule';
    dateRange?: { start: string; end: string };
  };
}

// Real Google API Endpoints (2025)
const GOOGLE_ENDPOINTS = {
  oauth: 'https://oauth2.googleapis.com/token',
  userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  
  // Calendar API v3
  calendar: {
    events: (calendarId: string = 'primary') => `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    calendars: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
  },
  
  // Drive API v3
  drive: {
    files: 'https://www.googleapis.com/drive/v3/files',
    upload: 'https://www.googleapis.com/upload/drive/v3/files',
    folders: 'https://www.googleapis.com/drive/v3/files',
  },
  
  // Sheets API v4
  sheets: {
    spreadsheets: 'https://sheets.googleapis.com/v4/spreadsheets',
    values: (spreadsheetId: string, range: string) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  },
  
  // Gmail API v1
  gmail: {
    messages: (userId: string = 'me') => `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages`,
    send: (userId: string = 'me') => `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/send`,
    drafts: (userId: string = 'me') => `https://gmail.googleapis.com/gmail/v1/users/${userId}/drafts`,
  }
};

class GoogleWorkspaceService {
  private config: GoogleWorkspaceConfig;
  private tokens: StoredTokens | null = null;
  private isInitialized = false;
  private readonly TOKEN_STORAGE_KEY = 'flocore_google_tokens';

  constructor() {
    this.config = this.loadConfiguration();
    this.loadStoredTokens();
  }

  private loadConfiguration(): GoogleWorkspaceConfig {
    const config: GoogleWorkspaceConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth-callback.html`,
      projectId: process.env.GOOGLE_PROJECT_ID || '',
    };

    this.isInitialized = this.validateConfiguration(config);
    
    if (this.isInitialized) {
      console.log('✅ Google Workspace service initialized successfully');
    } else {
      console.warn('⚠️ Google Workspace service not properly configured');
    }

    return config;
  }

  private validateConfiguration(config: GoogleWorkspaceConfig): boolean {
    const required = ['clientId', 'clientSecret', 'redirectUri', 'projectId'];
    const missing = required.filter(key => !config[key as keyof GoogleWorkspaceConfig]);
    
    if (missing.length > 0) {
      console.warn(`🔴 Missing Google Workspace configuration: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  private loadStoredTokens(): void {
    try {
      const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (stored) {
        this.tokens = JSON.parse(stored);
        console.log('🔑 Google Workspace tokens loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load stored Google tokens:', error);
    }
  }

  private storeTokens(tokens: StoredTokens): void {
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      this.tokens = tokens;
      console.log('🔒 Google Workspace tokens stored securely');
    } catch (error) {
      console.error('Failed to store Google tokens:', error);
    }
  }

  public getConnectionStatus(): ConnectionStatus {
    if (!this.isInitialized) {
      return ConnectionStatus.NEEDS_ATTENTION;
    }
    
    if (!this.tokens || this.isTokenExpired()) {
      return ConnectionStatus.DISCONNECTED;
    }
    
    return ConnectionStatus.CONNECTED;
  }

  private isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt;
  }

  // Real OAuth2 Authentication Flow
  public generateAuthUrl(): string {
    if (!this.isInitialized) {
      throw new Error('Google Workspace service not initialized');
    }

    const allScopes = [
      ...GOOGLE_SCOPES.calendar,
      ...GOOGLE_SCOPES.drive,
      ...GOOGLE_SCOPES.sheets,
      ...GOOGLE_SCOPES.gmail,
    ];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: allScopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      include_granted_scopes: 'true',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('🔐 Generated Google OAuth URL');
    return authUrl;
  }

  // Exchange authorization code for tokens
  public async exchangeCodeForTokens(code: string): Promise<void> {
    const payload = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    };

    const response = await fetch(GOOGLE_ENDPOINTS.oauth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const tokenData: TokenResponse = await response.json();
    
    const storedTokens: StoredTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      scopes: tokenData.scope.split(' '),
    };

    this.storeTokens(storedTokens);
    console.log('✅ Google Workspace authentication complete');
  }

  // Refresh access token when expired
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available. User needs to re-authenticate.');
    }

    const payload = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.tokens.refreshToken,
      grant_type: 'refresh_token',
    };

    const response = await fetch(GOOGLE_ENDPOINTS.oauth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokenData: TokenResponse = await response.json();
    
    const refreshedTokens: StoredTokens = {
      ...this.tokens,
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };

    this.storeTokens(refreshedTokens);
    console.log('🔄 Google Workspace token refreshed');
  }

  // API call wrapper with automatic token refresh
  private async apiCall(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.tokens) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    if (this.isTokenExpired() && this.tokens.refreshToken) {
      await this.refreshAccessToken();
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.tokens!.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Google API error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google API call failed:', error);
      throw error;
    }
  }

  // ===== CALENDAR API INTEGRATION =====
  
  // Create project milestone events
  async syncProjectSchedule(schedule: ProjectSchedule): Promise<void> {
    const calendarEvents = schedule.milestones.map(milestone => ({
      summary: `FLOCORE: ${milestone.title}`,
      description: `Project: ${schedule.projectId}\nType: ${milestone.type}\n\n${milestone.description}`,
      start: { 
        dateTime: new Date(milestone.startDate).toISOString(),
        timeZone: 'UTC',
      },
      end: { 
        dateTime: new Date(milestone.endDate).toISOString(),
        timeZone: 'UTC',
      },
      attendees: milestone.attendees?.map(email => ({ email })),
      colorId: this.getMilestoneColor(milestone.type),
    }));

    const createdEvents = [];
    for (const event of calendarEvents) {
      try {
        const response = await this.apiCall('POST', GOOGLE_ENDPOINTS.calendar.events(), event);
        createdEvents.push(response);
        console.log(`📅 Created calendar event: ${event.summary}`);
      } catch (error) {
        console.error(`Failed to create event: ${event.summary}`, error);
      }
    }

    console.log(`📅 Synced ${createdEvents.length}/${calendarEvents.length} project milestones to Google Calendar`);
  }

  private getMilestoneColor(type: string): string {
    const colorMap: Record<string, string> = {
      foundation: '5',    // Yellow
      structure: '11',    // Red
      finishes: '7',      // Blue
      inspection: '2',    // Green
      delivery: '9',      // Purple
    };
    return colorMap[type] || '1'; // Default blue
  }

  // ===== DRIVE API INTEGRATION =====
  
  // Create project folder structure
  async createProjectFolder(projectName: string): Promise<string> {
    const folderMetadata = {
      name: `FLOCORE - ${projectName}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [], // Root folder
    };

    const response = await this.apiCall('POST', GOOGLE_ENDPOINTS.drive.files, folderMetadata);
    console.log(`📁 Created project folder: ${projectName}`);
    
    // Create subfolders
    const subfolders = ['Reports', 'Calculations', 'Drawings', 'Inspections', 'Photos'];
    await this.createSubfolders(response.id, subfolders);
    
    return response.id;
  }

  private async createSubfolders(parentId: string, folderNames: string[]): Promise<void> {
    for (const folderName of folderNames) {
      try {
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        };
        await this.apiCall('POST', GOOGLE_ENDPOINTS.drive.files, folderMetadata);
      } catch (error) {
        console.error(`Failed to create subfolder: ${folderName}`, error);
      }
    }
  }

  // Upload project document
  async uploadDocument(document: ProjectDocument): Promise<string> {
    // First, create metadata
    const metadata = {
      name: document.name,
      parents: document.folderId ? [document.folderId] : undefined,
    };

    // For file uploads, we need to use multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    let body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata);
    body += delimiter + `Content-Type: ${document.mimeType}\r\n\r\n`;
    
    // Convert content to appropriate format
    if (typeof document.content === 'string') {
      body += document.content;
    } else {
      // For binary data, we'd need different handling
      body += new TextDecoder().decode(document.content);
    }
    body += closeDelim;

    const response = await fetch(GOOGLE_ENDPOINTS.drive.upload, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.tokens!.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Content-Length': body.length.toString(),
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Document upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📄 Uploaded document: ${document.name}`);
    return result.id;
  }

  // ===== SHEETS API INTEGRATION =====
  
  // Create and populate project data sheet
  async exportProjectData(exportData: ProjectDataExport): Promise<string> {
    // Create new spreadsheet
    const spreadsheetData = {
      properties: {
        title: `FLOCORE - ${exportData.sheetTitle}`,
      },
    };

    const createResponse = await this.apiCall('POST', GOOGLE_ENDPOINTS.sheets.spreadsheets, spreadsheetData);
    const spreadsheetId = createResponse.spreadsheetId;

    // Populate with data
    const values = [
      exportData.headers,
      ...exportData.data.map(row => exportData.headers.map(header => row[header] || ''))
    ];

    const range = 'A1';
    const valueData = {
      range,
      majorDimension: 'ROWS',
      values,
    };

    await this.apiCall('PUT', 
      GOOGLE_ENDPOINTS.sheets.values(spreadsheetId, range) + '?valueInputOption=RAW', 
      valueData
    );

    console.log(`📊 Created project data sheet: ${exportData.sheetTitle}`);
    return spreadsheetId;
  }

  // ===== GMAIL API INTEGRATION =====
  
  // Send project notification email
  async sendProjectNotification(to: string[], subject: string, htmlBody: string, attachments?: any[]): Promise<void> {
    // Create email message
    const message = this.createEmailMessage(to, subject, htmlBody, attachments);
    
    const response = await this.apiCall('POST', GOOGLE_ENDPOINTS.gmail.send(), {
      raw: message,
    });

    console.log(`📧 Project notification sent to ${to.length} recipients: ${subject}`);
  }

  private createEmailMessage(to: string[], subject: string, htmlBody: string, attachments?: any[]): string {
    const boundary = '-------314159265358979323846';
    let message = `To: ${to.join(', ')}\r\n`;
    message += `Subject: ${subject}\r\n`;
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    
    // HTML body
    message += `--${boundary}\r\n`;
    message += 'Content-Type: text/html; charset=UTF-8\r\n\r\n';
    message += htmlBody + '\r\n';
    
    // TODO: Add attachment handling if needed
    
    message += `--${boundary}--`;
    
    // Base64 encode for Gmail API
    return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Get service status for dashboard
  getServiceStatus(): {
    isAuthenticated: boolean;
    connectedScopes: string[];
    tokenExpiresAt?: Date;
    userEmail?: string;
  } {
    return {
      isAuthenticated: !!this.tokens && !this.isTokenExpired(),
      connectedScopes: this.tokens?.scopes || [],
      tokenExpiresAt: this.tokens ? new Date(this.tokens.expiresAt) : undefined,
    };
  }

  // Clear stored tokens (logout)
  public clearTokens(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    this.tokens = null;
    console.log('🔓 Google Workspace tokens cleared');
  }
}

// Export singleton instance (following existing pattern)
export const googleWorkspaceService = new GoogleWorkspaceService();
export default googleWorkspaceService;