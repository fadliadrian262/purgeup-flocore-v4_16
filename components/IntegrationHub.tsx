import React, { useState, useEffect } from 'react';
import { ConnectionStatus, User } from '../types';
import { whatsappService } from '../services/integrations/whatsappService';
import { googleWorkspaceService } from '../services/integrations/googleWorkspaceService';
import { integrationStatusService } from '../services/integrations/integrationStatusService';
import IntegrationStatusPanel from './integrations/IntegrationStatusPanel';
import WhatsAppSetupModal from './integrations/WhatsAppSetupModal';
import { 
  IconMessageSquare, 
  IconMail, 
  IconCalendar, 
  IconFileText,
  IconSettings,
  IconPlus,
  IconWifi,
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconLoader,
  IconX
} from './icons';

// Quick Action Card
const QuickActionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  platform: string;
  isEnabled: boolean;
  onClick: () => void;
}> = ({ icon: Icon, title, description, platform, isEnabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={!isEnabled}
    className="text-left p-4 bg-zinc-900/50 hover:bg-zinc-800/50 disabled:bg-zinc-900/30 
             border border-zinc-800 hover:border-zinc-700 disabled:border-zinc-800/50
             rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${
        isEnabled 
          ? platform === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          : 'bg-zinc-700/50 text-zinc-500'
      }`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className={`font-medium text-sm ${isEnabled ? 'text-white' : 'text-zinc-500'}`}>
          {title}
        </h3>
        <p className={`text-xs mt-1 ${isEnabled ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${
            isEnabled ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-xs text-zinc-500 capitalize">{platform}</span>
        </div>
      </div>
    </div>
  </button>
);

// Connection Setup Card
const ConnectionSetupCard: React.FC<{
  platform: 'whatsapp' | 'google';
  status: ConnectionStatus;
  onSetup: () => void;
}> = ({ platform, status, onSetup }) => {
  const platformInfo = {
    whatsapp: {
      name: 'WhatsApp Business',
      description: 'Send messages, receive field updates, and manage team communications',
      icon: IconMessageSquare,
      color: 'green'
    },
    google: {
      name: 'Google Workspace',
      description: 'Sync calendars, upload documents, and send email notifications',
      icon: IconMail,
      color: 'blue'
    }
  };

  const info = platformInfo[platform];
  const Icon = info.icon;

  const getStatusInfo = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return { text: 'Connected', color: 'text-green-400', bgColor: 'bg-green-500/20' };
      case ConnectionStatus.NEEDS_ATTENTION:
        return { text: 'Needs Setup', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
      case ConnectionStatus.DISCONNECTED:
        return { text: 'Not Connected', color: 'text-red-400', bgColor: 'bg-red-500/20' };
      default:
        return { text: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            info.color === 'green' ? 'bg-green-500/20' : 'bg-blue-500/20'
          }`}>
            <Icon size={24} className={
              info.color === 'green' ? 'text-green-400' : 'text-blue-400'
            } />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">{info.name}</h3>
            <p className="text-zinc-400 text-sm">{info.description}</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
          <span className={`text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {status !== ConnectionStatus.CONNECTED && (
        <button
          onClick={onSetup}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            info.color === 'green'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {status === ConnectionStatus.NEEDS_ATTENTION ? 'Complete Setup' : 'Connect'}
        </button>
      )}

      {status === ConnectionStatus.CONNECTED && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <IconCheck size={16} />
          <span>Successfully connected and ready to use</span>
        </div>
      )}
      
      {/* Loading state during authentication */}
      {((platform === 'google' && isAuthenticating.google) || (platform === 'whatsapp' && isAuthenticating.whatsapp)) && (
        <div className="flex items-center gap-2 text-blue-400 text-sm mt-3">
          <IconLoader size={16} className="animate-spin" />
          <span>Authenticating...</span>
        </div>
      )}
    </div>
  );
};

// Main Integration Hub Component
interface IntegrationHubProps {
  user: User;
}

const IntegrationHub: React.FC<IntegrationHubProps> = ({ user }) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    whatsapp: ConnectionStatus;
    google: ConnectionStatus;
  }>({
    whatsapp: ConnectionStatus.DISCONNECTED,
    google: ConnectionStatus.DISCONNECTED
  });

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState<{
    whatsapp: boolean;
    google: boolean;
  }>({ whatsapp: false, google: false });
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleAuthPopup, setGoogleAuthPopup] = useState<Window | null>(null);

  // Load connection status on mount
  useEffect(() => {
    const loadStatus = () => {
      setConnectionStatus({
        whatsapp: whatsappService.getConnectionStatus(),
        google: googleWorkspaceService.getConnectionStatus()
      });
    };

    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Check every 5 seconds for more responsiveness
    return () => clearInterval(interval);
  }, []);

  // Google OAuth popup message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from our domain
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.code) {
        handleGoogleAuthCallback(event.data.code);
        if (googleAuthPopup) {
          googleAuthPopup.close();
          setGoogleAuthPopup(null);
        }
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setAuthError('Google authentication failed. Please try again.');
        setIsAuthenticating(prev => ({ ...prev, google: false }));
        if (googleAuthPopup) {
          googleAuthPopup.close();
          setGoogleAuthPopup(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleAuthPopup]);

  // Handle Google OAuth callback
  const handleGoogleAuthCallback = async (code: string) => {
    try {
      setIsAuthenticating(prev => ({ ...prev, google: true }));
      await googleWorkspaceService.exchangeCodeForTokens(code);
      
      // Refresh connection status
      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          google: googleWorkspaceService.getConnectionStatus()
        }));
        setIsAuthenticating(prev => ({ ...prev, google: false }));
      }, 1000);
      
    } catch (error) {
      console.error('Google OAuth callback failed:', error);
      setAuthError('Failed to complete Google authentication. Please try again.');
      setIsAuthenticating(prev => ({ ...prev, google: false }));
    }
  };

  // Handle platform setup
  const handleSetup = async (platform: 'whatsapp' | 'google') => {
    setAuthError(null);
    
    if (platform === 'google') {
      try {
        setIsAuthenticating(prev => ({ ...prev, google: true }));
        
        // Start Google OAuth flow
        const authUrl = googleWorkspaceService.generateAuthUrl();
        
        // Open popup window
        const popup = window.open(
          authUrl,
          'google_oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        setGoogleAuthPopup(popup);
        
        // Monitor popup closure
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setGoogleAuthPopup(null);
            setIsAuthenticating(prev => ({ ...prev, google: false }));
          }
        }, 1000);
        
      } catch (error) {
        console.error('Google OAuth setup failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Failed to start Google authentication');
        setIsAuthenticating(prev => ({ ...prev, google: false }));
      }
    } else {
      // Show WhatsApp setup modal
      setShowWhatsAppModal(true);
    }
  };

  // Handle WhatsApp setup success
  const handleWhatsAppSetupSuccess = () => {
    // Refresh connection status after successful setup
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        whatsapp: whatsappService.getConnectionStatus()
      }));
    }, 1000);
  };

  // Handle quick actions
  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'send_daily_report':
        // This would open a modal to compose and send daily report
        console.log('Opening daily report composer...');
        break;
      
      case 'create_calendar_event':
        // This would open Google Calendar integration
        console.log('Creating calendar event...');
        break;
      
      case 'upload_document':
        // This would open document upload to Google Drive
        console.log('Opening document uploader...');
        break;
      
      case 'send_team_notification':
        // This would open WhatsApp team notification composer
        console.log('Opening team notification...');
        break;
    }
  };

  const refreshStatus = () => {
    setConnectionStatus({
      whatsapp: whatsappService.getConnectionStatus(),
      google: googleWorkspaceService.getConnectionStatus()
    });
  };

  const configurePlatform = (platform: string) => {
    if (platform === 'whatsapp' || platform === 'google') {
      handleSetup(platform);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Integration Hub</h1>
        <p className="text-zinc-400">
          Connect your construction management platform with WhatsApp Business and Google Workspace 
          to automate communications, sync data, and streamline workflows.
        </p>
      </div>

      {/* Integration Status Panel */}
      <IntegrationStatusPanel
        onConfigurePlatform={configurePlatform}
        onRefreshStatus={refreshStatus}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={IconFileText}
            title="Send Daily Report"
            description="Send progress report to team via WhatsApp"
            platform="whatsapp"
            isEnabled={connectionStatus.whatsapp === ConnectionStatus.CONNECTED}
            onClick={() => handleQuickAction('send_daily_report')}
          />
          
          <QuickActionCard
            icon={IconCalendar}
            title="Create Event"
            description="Schedule project milestone in Google Calendar"
            platform="google"
            isEnabled={connectionStatus.google === ConnectionStatus.CONNECTED}
            onClick={() => handleQuickAction('create_calendar_event')}
          />
          
          <QuickActionCard
            icon={IconFileText}
            title="Upload Document"
            description="Save project document to Google Drive"
            platform="google"
            isEnabled={connectionStatus.google === ConnectionStatus.CONNECTED}
            onClick={() => handleQuickAction('upload_document')}
          />
          
          <QuickActionCard
            icon={IconMessageSquare}
            title="Notify Team"
            description="Send urgent notification to WhatsApp group"
            platform="whatsapp"
            isEnabled={connectionStatus.whatsapp === ConnectionStatus.CONNECTED}
            onClick={() => handleQuickAction('send_team_notification')}
          />
        </div>
      </div>

      {/* Connection Setup Cards */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-4">Platform Connections</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConnectionSetupCard
            platform="whatsapp"
            status={connectionStatus.whatsapp}
            onSetup={() => handleSetup('whatsapp')}
          />
          
          <ConnectionSetupCard
            platform="google"
            status={connectionStatus.google}
            onSetup={() => handleSetup('google')}
          />
        </div>
      </div>

      {/* Integration Benefits */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">Integration Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <IconMessageSquare size={18} />
              WhatsApp Business Integration
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Real-time field updates and photo sharing
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Automated daily progress reports
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Instant safety alerts and incident reporting
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Team coordination through group messaging
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-purple-400 font-medium mb-3 flex items-center gap-2">
              <IconMail size={18} />
              Google Workspace Integration
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Synchronized project calendars and schedules
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Centralized document storage in Drive
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Automated data exports to Sheets
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                Professional email notifications via Gmail
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {(connectionStatus.whatsapp !== ConnectionStatus.CONNECTED || 
        connectionStatus.google !== ConnectionStatus.CONNECTED) && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Getting Started</h2>
          
          <div className="space-y-4">
            {connectionStatus.whatsapp !== ConnectionStatus.CONNECTED && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Connect WhatsApp Business</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    You'll need a WhatsApp Business Account and API credentials. 
                    Contact your IT administrator or visit the Meta Business platform to get started.
                  </p>
                </div>
              </div>
            )}

            {connectionStatus.google !== ConnectionStatus.CONNECTED && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-sm">
                    {connectionStatus.whatsapp !== ConnectionStatus.CONNECTED ? '2' : '1'}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Connect Google Workspace</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Sign in with your Google Workspace account to enable calendar sync, 
                    document storage, and email integration features.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {authError && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <IconAlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium">Authentication Error</h3>
              <p className="text-red-300 text-sm mt-1">{authError}</p>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-400 hover:text-red-300 transition-colors ml-auto"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Setup Modal */}
      <WhatsAppSetupModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSuccess={handleWhatsAppSetupSuccess}
      />
    </div>
  );
};

export default IntegrationHub;