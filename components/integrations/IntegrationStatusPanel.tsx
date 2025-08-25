import React, { useState, useEffect } from 'react';
import { integrationStatusService, IntegrationStatus } from '../../services/integrations/integrationStatusService';
import { ConnectionStatus } from '../../types';
import { 
  IconWifi, 
  IconWifiOff, 
  IconAlertTriangle, 
  IconSettings, 
  IconCheck,
  IconClock,
  IconX,
  IconRefreshCw,
  IconChevronDown,
  IconChevronRight
} from '../icons';

// Individual Integration Status Card
const IntegrationStatusCard: React.FC<{
  integration: IntegrationStatus;
  onConfigure: (platform: string) => void;
  onRetry: (platform: string) => void;
}> = ({ integration, onConfigure, onRetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (integration.status) {
      case ConnectionStatus.CONNECTED:
        return <IconWifi size={20} className="text-green-400" />;
      case ConnectionStatus.NEEDS_ATTENTION:
        return <IconAlertTriangle size={20} className="text-yellow-400" />;
      case ConnectionStatus.DISCONNECTED:
        return <IconWifiOff size={20} className="text-red-400" />;
      default:
        return <IconWifiOff size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case ConnectionStatus.CONNECTED: 
        return 'border-green-400/20 bg-green-400/5';
      case ConnectionStatus.NEEDS_ATTENTION: 
        return 'border-yellow-400/20 bg-yellow-400/5';
      case ConnectionStatus.DISCONNECTED: 
        return 'border-red-400/20 bg-red-400/5';
      default: 
        return 'border-gray-400/20 bg-gray-400/5';
    }
  };

  const getStatusText = () => {
    switch (integration.status) {
      case ConnectionStatus.CONNECTED: return 'Connected';
      case ConnectionStatus.NEEDS_ATTENTION: return 'Needs Attention';
      case ConnectionStatus.DISCONNECTED: return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatResponseTime = (time: number) => {
    return time > 1000 ? `${(time / 1000).toFixed(1)}s` : `${time}ms`;
  };

  return (
    <div className={`border rounded-xl p-4 transition-all ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-white font-medium text-sm">{integration.displayName}</h3>
            <p className="text-xs text-zinc-400">{getStatusText()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Health Status */}
          <div className={`w-2 h-2 rounded-full ${
            integration.health.status === 'healthy' ? 'bg-green-400' :
            integration.health.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          
          {/* Actions */}
          {integration.status !== ConnectionStatus.CONNECTED && (
            <button
              onClick={() => onConfigure(integration.platform)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title="Configure"
            >
              <IconSettings size={16} />
            </button>
          )}
          
          <button
            onClick={() => onRetry(integration.platform)}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Retry Connection"
          >
            <IconRefreshCw size={16} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-400">Uptime</div>
          <div className="text-sm font-medium text-white">
            {formatUptime(integration.metrics.uptime)}
          </div>
        </div>
        
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-400">Response</div>
          <div className="text-sm font-medium text-white">
            {formatResponseTime(integration.metrics.averageResponseTime)}
          </div>
        </div>
        
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-400">Requests</div>
          <div className="text-sm font-medium text-white">
            {integration.metrics.successfulRequests}/{integration.metrics.totalRequests}
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            integration.configuration.configurationLevel === 'complete' ? 'bg-green-400' :
            integration.configuration.configurationLevel === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className="text-xs text-zinc-400">
            Configuration: {integration.configuration.configurationLevel}
          </span>
        </div>
        
        <div className="text-xs text-zinc-500">
          Last checked: {new Date(integration.health.lastChecked).toLocaleTimeString()}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700/50 space-y-3">
          {/* Features */}
          <div>
            <h4 className="text-xs font-medium text-white mb-2">Features</h4>
            <div className="flex flex-wrap gap-1">
              {integration.features.enabled.map(feature => (
                <span key={feature} className="text-xs px-2 py-1 bg-green-800/30 text-green-300 rounded-full">
                  <IconCheck size={10} className="inline mr-1" />
                  {feature}
                </span>
              ))}
              {integration.features.restricted.map(feature => (
                <span key={feature} className="text-xs px-2 py-1 bg-red-800/30 text-red-300 rounded-full">
                  <IconX size={10} className="inline mr-1" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Health Details */}
          {integration.health.details.warnings && integration.health.details.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-white mb-2">Warnings</h4>
              {integration.health.details.warnings.map((warning, index) => (
                <div key={index} className="text-xs text-yellow-300 bg-yellow-900/20 rounded p-2">
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Missing Configuration */}
          {integration.configuration.missingSettings && integration.configuration.missingSettings.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-white mb-2">Missing Configuration</h4>
              <div className="text-xs text-red-300">
                {integration.configuration.missingSettings.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Integration Status Panel
interface IntegrationStatusPanelProps {
  onConfigurePlatform: (platform: string) => void;
  onRefreshStatus: () => void;
  isCompact?: boolean;
}

const IntegrationStatusPanel: React.FC<IntegrationStatusPanelProps> = ({
  onConfigurePlatform,
  onRefreshStatus,
  isCompact = false
}) => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load integration status
  const loadIntegrationStatus = async () => {
    try {
      setIsLoading(true);
      const status = await integrationStatusService.getAllIntegrationStatus();
      setIntegrations(status);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadIntegrationStatus();
    const interval = setInterval(loadIntegrationStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle platform retry
  const handleRetry = async (platform: string) => {
    console.log(`Retrying connection for ${platform}`);
    await integrationStatusService.performHealthChecks();
    await loadIntegrationStatus();
  };

  // Handle refresh
  const handleRefresh = async () => {
    await loadIntegrationStatus();
    onRefreshStatus();
  };

  // Get summary stats
  const getSummaryStats = () => {
    const connected = integrations.filter(i => i.status === ConnectionStatus.CONNECTED).length;
    const total = integrations.length;
    const healthy = integrations.filter(i => i.health.status === 'healthy').length;
    
    return { connected, total, healthy };
  };

  const stats = getSummaryStats();

  if (isCompact) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium text-sm">Integration Status</h3>
            <p className="text-xs text-zinc-400">
              {stats.connected}/{stats.total} connected • {stats.healthy} healthy
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {integrations.slice(0, 4).map(integration => (
              <div
                key={integration.platform}
                className={`w-2 h-2 rounded-full ${
                  integration.status === ConnectionStatus.CONNECTED ? 'bg-green-400' :
                  integration.status === ConnectionStatus.NEEDS_ATTENTION ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                title={`${integration.displayName}: ${integration.status}`}
              />
            ))}
            
            <button
              onClick={handleRefresh}
              className="text-zinc-400 hover:text-white transition-colors ml-2"
              disabled={isLoading}
            >
              <IconRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Platform Integrations</h2>
          <p className="text-zinc-400 text-sm">
            Manage your connections to WhatsApp, Google Workspace, and other platforms
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 
                   text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <IconRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <IconCheck size={20} className="text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.connected}</div>
              <div className="text-sm text-zinc-400">Connected</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <IconWifi size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-zinc-400">Total Services</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <IconClock size={20} className="text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.healthy}</div>
              <div className="text-sm text-zinc-400">Healthy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {integrations.map(integration => (
          <IntegrationStatusCard
            key={integration.platform}
            integration={integration}
            onConfigure={onConfigurePlatform}
            onRetry={handleRetry}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && integrations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <IconRefreshCw size={20} className="animate-spin text-blue-400" />
            <span className="text-zinc-400">Loading integration status...</span>
          </div>
        </div>
      )}

      {/* Last Refresh */}
      <div className="text-xs text-zinc-500 text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default IntegrationStatusPanel;