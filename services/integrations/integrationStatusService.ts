import { whatsappService } from './whatsappService';
import { googleWorkspaceService } from './googleWorkspaceService';
import { integrationOrchestrator } from './integrationOrchestrator';
import { webhookManager } from './webhookManager';
import { ConnectionStatus } from '../../types';

// Health Check Result
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  details: {
    connectivity: 'ok' | 'slow' | 'failed';
    authentication: 'valid' | 'expired' | 'invalid' | 'missing';
    quotaStatus?: 'normal' | 'approaching_limit' | 'exceeded';
    lastSuccessfulCall?: Date;
    errorCount?: number;
    warnings?: string[];
  };
}

// Integration Metrics
export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number; // percentage
  lastActivity: Date;
  dailyUsage: {
    date: string;
    requests: number;
    errors: number;
  }[];
}

// Comprehensive Integration Status
export interface IntegrationStatus {
  platform: 'whatsapp' | 'google' | 'orchestrator' | 'webhooks';
  displayName: string;
  status: ConnectionStatus;
  health: HealthCheckResult;
  metrics: IntegrationMetrics;
  configuration: {
    isConfigured: boolean;
    configurationLevel: 'none' | 'partial' | 'complete';
    missingSettings?: string[];
  };
  features: {
    available: string[];
    enabled: string[];
    restricted: string[];
  };
}

// Alert Configuration
interface StatusAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  platform: string;
  timestamp: Date;
  acknowledged: boolean;
  autoResolve: boolean;
}

class IntegrationStatusService {
  private statusCache = new Map<string, IntegrationStatus>();
  private alerts: StatusAlert[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsHistory = new Map<string, IntegrationMetrics[]>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startHealthChecks();
    console.log('📊 Integration Status Service initialized');
  }

  // Start periodic health checks
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    // Perform initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  // Perform health checks for all services
  public async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing integration health checks...');

    const platforms = ['whatsapp', 'google', 'orchestrator', 'webhooks'];
    const healthPromises = platforms.map(platform => this.checkServiceHealth(platform));

    try {
      await Promise.allSettled(healthPromises);
      console.log('✅ Health checks completed');
    } catch (error) {
      console.error('❌ Error during health checks:', error);
    }
  }

  // Check health of individual service
  private async checkServiceHealth(platform: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      switch (platform) {
        case 'whatsapp':
          result = await this.checkWhatsAppHealth();
          break;
        case 'google':
          result = await this.checkGoogleHealth();
          break;
        case 'orchestrator':
          result = await this.checkOrchestratorHealth();
          break;
        case 'webhooks':
          result = await this.checkWebhookHealth();
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      result.responseTime = Date.now() - startTime;
      result.lastChecked = new Date();
      
      // Update alerts based on health status
      this.updateAlertsForService(platform, result);
      
    } catch (error) {
      result = {
        service: platform,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          connectivity: 'failed',
          authentication: 'invalid',
          errorCount: 1,
          warnings: [error instanceof Error ? error.message : 'Unknown error']
        }
      };
    }

    return result;
  }

  // WhatsApp Service Health Check
  private async checkWhatsAppHealth(): Promise<HealthCheckResult> {
    const serviceStatus = whatsappService.getConnectionStatus();
    const serviceInfo = whatsappService.getServiceStatus();

    let status: HealthCheckResult['status'] = 'healthy';
    let connectivity: 'ok' | 'slow' | 'failed' = 'ok';
    let authentication: 'valid' | 'expired' | 'invalid' | 'missing' = 'valid';

    if (serviceStatus === ConnectionStatus.DISCONNECTED) {
      status = 'unhealthy';
      connectivity = 'failed';
      authentication = 'missing';
    } else if (serviceStatus === ConnectionStatus.NEEDS_ATTENTION) {
      status = 'degraded';
      authentication = 'invalid';
    }

    // TODO: Actual API health check call
    // try {
    //   const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
    //     headers: { 'Authorization': `Bearer ${accessToken}` }
    //   });
    //   if (!response.ok) {
    //     status = 'degraded';
    //     connectivity = 'slow';
    //   }
    // } catch (error) {
    //   status = 'unhealthy';
    //   connectivity = 'failed';
    // }

    return {
      service: 'whatsapp',
      status,
      responseTime: 0, // Will be set by caller
      lastChecked: new Date(),
      details: {
        connectivity,
        authentication,
        quotaStatus: 'normal', // TODO: Check actual quota
        lastSuccessfulCall: serviceInfo.lastActivity,
        errorCount: 0
      }
    };
  }

  // Google Workspace Service Health Check
  private async checkGoogleHealth(): Promise<HealthCheckResult> {
    const serviceStatus = googleWorkspaceService.getConnectionStatus();
    const serviceInfo = googleWorkspaceService.getServiceStatus();

    let status: HealthCheckResult['status'] = 'healthy';
    let connectivity: 'ok' | 'slow' | 'failed' = 'ok';
    let authentication: 'valid' | 'expired' | 'invalid' | 'missing' = 'valid';

    if (serviceStatus === ConnectionStatus.DISCONNECTED) {
      status = 'unhealthy';
      connectivity = 'failed';
      authentication = 'missing';
    } else if (serviceStatus === ConnectionStatus.NEEDS_ATTENTION) {
      status = 'degraded';
      authentication = 'expired';
    }

    // Check token expiration
    if (serviceInfo.tokenExpiresAt && serviceInfo.tokenExpiresAt < new Date()) {
      status = 'degraded';
      authentication = 'expired';
    }

    return {
      service: 'google',
      status,
      responseTime: 0,
      lastChecked: new Date(),
      details: {
        connectivity,
        authentication,
        quotaStatus: 'normal', // TODO: Check actual quota
        errorCount: 0,
        warnings: authentication === 'expired' ? ['Access token expired'] : undefined
      }
    };
  }

  // Integration Orchestrator Health Check
  private async checkOrchestratorHealth(): Promise<HealthCheckResult> {
    const orchestratorStatus = integrationOrchestrator.getIntegrationStatus();
    
    let status: HealthCheckResult['status'] = 'healthy';
    if (orchestratorStatus.orchestrator === 'degraded') {
      status = 'degraded';
    } else if (orchestratorStatus.orchestrator === 'unavailable') {
      status = 'unhealthy';
    }

    return {
      service: 'orchestrator',
      status,
      responseTime: 0,
      lastChecked: new Date(),
      details: {
        connectivity: 'ok',
        authentication: 'valid',
        warnings: status !== 'healthy' ? ['Some platform integrations are unavailable'] : undefined
      }
    };
  }

  // Webhook Manager Health Check
  private async checkWebhookHealth(): Promise<HealthCheckResult> {
    const webhookStatus = webhookManager.getWebhookStatus();
    
    let status: HealthCheckResult['status'] = 'healthy';
    if (webhookStatus.queueLength > 100) {
      status = 'degraded';
    }
    
    if (webhookStatus.activeSubscriptions === 0) {
      status = 'degraded';
    }

    return {
      service: 'webhooks',
      status,
      responseTime: 0,
      lastChecked: new Date(),
      details: {
        connectivity: 'ok',
        authentication: 'valid',
        warnings: webhookStatus.queueLength > 50 ? [`High queue length: ${webhookStatus.queueLength}`] : undefined
      }
    };
  }

  // Get comprehensive status for all integrations
  public async getAllIntegrationStatus(): Promise<IntegrationStatus[]> {
    const platforms = [
      {
        platform: 'whatsapp' as const,
        displayName: 'WhatsApp Business',
        features: {
          available: ['messaging', 'media_upload', 'templates', 'groups'],
          enabled: ['messaging', 'media_upload'],
          restricted: []
        }
      },
      {
        platform: 'google' as const,
        displayName: 'Google Workspace',
        features: {
          available: ['calendar', 'drive', 'sheets', 'gmail'],
          enabled: ['calendar', 'drive'],
          restricted: ['gmail'] // Requires additional verification
        }
      },
      {
        platform: 'orchestrator' as const,
        displayName: 'Integration Hub',
        features: {
          available: ['cross_platform_queries', 'data_aggregation', 'action_execution'],
          enabled: ['cross_platform_queries', 'data_aggregation'],
          restricted: []
        }
      },
      {
        platform: 'webhooks' as const,
        displayName: 'Real-time Updates',
        features: {
          available: ['whatsapp_webhooks', 'google_push_notifications', 'event_processing'],
          enabled: ['event_processing'],
          restricted: []
        }
      }
    ];

    const statusPromises = platforms.map(async (platformInfo) => {
      // Get health check result
      const health = await this.checkServiceHealth(platformInfo.platform);
      
      // Determine connection status
      let connectionStatus: ConnectionStatus = ConnectionStatus.CONNECTED;
      if (health.status === 'unhealthy') {
        connectionStatus = ConnectionStatus.DISCONNECTED;
      } else if (health.status === 'degraded') {
        connectionStatus = ConnectionStatus.NEEDS_ATTENTION;
      }

      // Generate mock metrics (in real implementation, these would be tracked)
      const metrics: IntegrationMetrics = {
        totalRequests: Math.floor(Math.random() * 1000) + 100,
        successfulRequests: Math.floor(Math.random() * 900) + 90,
        failedRequests: Math.floor(Math.random() * 10),
        averageResponseTime: Math.floor(Math.random() * 1000) + 200,
        uptime: Math.floor(Math.random() * 10) + 90,
        lastActivity: new Date(),
        dailyUsage: []
      };

      // Configuration status
      const configuration = {
        isConfigured: health.details.authentication !== 'missing',
        configurationLevel: this.getConfigurationLevel(platformInfo.platform),
        missingSettings: this.getMissingSettings(platformInfo.platform)
      };

      return {
        platform: platformInfo.platform,
        displayName: platformInfo.displayName,
        status: connectionStatus,
        health,
        metrics,
        configuration,
        features: platformInfo.features
      };
    });

    return Promise.all(statusPromises);
  }

  // Get configuration level for platform
  private getConfigurationLevel(platform: string): 'none' | 'partial' | 'complete' {
    switch (platform) {
      case 'whatsapp':
        const whatsappStatus = whatsappService.getConnectionStatus();
        if (whatsappStatus === ConnectionStatus.CONNECTED) return 'complete';
        if (whatsappStatus === ConnectionStatus.NEEDS_ATTENTION) return 'partial';
        return 'none';
      
      case 'google':
        const googleStatus = googleWorkspaceService.getConnectionStatus();
        if (googleStatus === ConnectionStatus.CONNECTED) return 'complete';
        if (googleStatus === ConnectionStatus.NEEDS_ATTENTION) return 'partial';
        return 'none';
      
      default:
        return 'complete';
    }
  }

  // Get missing settings for platform
  private getMissingSettings(platform: string): string[] {
    const missing: string[] = [];
    
    switch (platform) {
      case 'whatsapp':
        const whatsappStatus = whatsappService.getConnectionStatus();
        if (whatsappStatus === ConnectionStatus.DISCONNECTED) {
          missing.push('API Token', 'Phone Number ID', 'Business Account ID');
        }
        break;
      
      case 'google':
        const googleStatus = googleWorkspaceService.getConnectionStatus();
        if (googleStatus === ConnectionStatus.DISCONNECTED) {
          missing.push('OAuth2 Credentials', 'User Authorization');
        }
        break;
    }
    
    return missing;
  }

  // Update alerts based on service health
  private updateAlertsForService(platform: string, health: HealthCheckResult): void {
    // Remove resolved alerts
    this.alerts = this.alerts.filter(alert => 
      !(alert.platform === platform && alert.autoResolve && health.status === 'healthy')
    );

    // Add new alerts for problems
    if (health.status === 'unhealthy') {
      this.addAlert({
        type: 'error',
        severity: 'high',
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Service Unavailable`,
        message: `The ${platform} integration is currently unavailable. Please check your configuration.`,
        platform,
        autoResolve: true
      });
    } else if (health.status === 'degraded') {
      this.addAlert({
        type: 'warning',
        severity: 'medium',
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Service Degraded`,
        message: `The ${platform} integration is experiencing issues. Some features may be limited.`,
        platform,
        autoResolve: true
      });
    }

    // Add specific alerts for warnings
    if (health.details.warnings) {
      health.details.warnings.forEach(warning => {
        this.addAlert({
          type: 'warning',
          severity: 'low',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Warning`,
          message: warning,
          platform,
          autoResolve: true
        });
      });
    }
  }

  // Add new alert
  private addAlert(alertData: Omit<StatusAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.platform === alertData.platform && 
      alert.title === alertData.title
    );

    if (existingAlert) {
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: StatusAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    console.log(`🚨 New alert: ${alert.title}`);
  }

  // Get current alerts
  public getAlerts(includeAcknowledged = false): StatusAlert[] {
    return this.alerts
      .filter(alert => includeAcknowledged || !alert.acknowledged)
      .sort((a, b) => {
        // Sort by severity, then by timestamp
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  // Acknowledge alert
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`✅ Alert acknowledged: ${alert.title}`);
      return true;
    }
    return false;
  }

  // Get integration summary for dashboard
  public getIntegrationSummary(): {
    totalIntegrations: number;
    connectedIntegrations: number;
    healthyIntegrations: number;
    activeAlerts: number;
    lastHealthCheck: Date;
  } {
    const totalIntegrations = 4; // whatsapp, google, orchestrator, webhooks
    
    // This would be computed from actual status in real implementation
    return {
      totalIntegrations,
      connectedIntegrations: 3,
      healthyIntegrations: 2,
      activeAlerts: this.getAlerts().length,
      lastHealthCheck: new Date()
    };
  }

  // Utility methods
  private generateAlertId(): string {
    return 'alert_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Cleanup
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('📊 Integration Status Service destroyed');
  }
}

// Export singleton instance
export const integrationStatusService = new IntegrationStatusService();
export default integrationStatusService;