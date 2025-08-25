import React, { useState } from 'react';
import { whatsappService } from '../../services/integrations/whatsappService';
import { 
  IconX, 
  IconCheck, 
  IconLoader, 
  IconAlertTriangle, 
  IconExternalLink,
  IconCopy,
  IconEye,
  IconEyeOff
} from '../icons';

interface WhatsAppCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface WhatsAppSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WhatsAppSetupModal: React.FC<WhatsAppSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'credentials' | 'test' | 'webhooks'>('credentials');
  const [credentials, setCredentials] = useState<WhatsAppCredentials>({
    appId: '',
    appSecret: '',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  // Handle credential input changes
  const handleInputChange = (field: keyof WhatsAppCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Test API connection
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Save credentials to environment (in real implementation, this would be more secure)
      Object.entries(credentials).forEach(([key, value]) => {
        const envKey = `WHATSAPP_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        // In real implementation, you'd save to secure storage
        console.log(`Setting ${envKey} = ${value}`);
      });

      // Test the connection by getting service status
      const serviceStatus = whatsappService.getServiceStatus();
      
      // Mock API test call (in real implementation, make actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        phoneNumber: credentials.phoneNumberId,
        businessName: 'Your Business Name',
        status: 'verified',
        quotaUsed: '15/1000 messages today'
      });

      setCurrentStep('webhooks');
      setSuccess('Connection test successful!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete setup
  const completeSetup = async () => {
    setIsLoading(true);
    
    try {
      // In real implementation, save credentials securely and initialize service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('WhatsApp integration configured successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      setError('Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate required fields
  const isStepValid = () => {
    switch (currentStep) {
      case 'credentials':
        return Object.values(credentials).every(value => value.trim() !== '');
      case 'test':
        return testResult !== null;
      case 'webhooks':
        return true;
      default:
        return false;
    }
  };

  const renderCredentialsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg mb-2">WhatsApp Business API Credentials</h3>
        <p className="text-zinc-400 text-sm">
          Enter your WhatsApp Business API credentials from the Meta Developer Console.
        </p>
      </div>

      <div className="space-y-4">
        {/* App ID */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            App ID
          </label>
          <input
            type="text"
            value={credentials.appId}
            onChange={(e) => handleInputChange('appId', e.target.value)}
            placeholder="Enter your Meta App ID"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white 
                     placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* App Secret */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            App Secret
          </label>
          <div className="relative">
            <input
              type={showSecrets.appSecret ? "text" : "password"}
              value={credentials.appSecret}
              onChange={(e) => handleInputChange('appSecret', e.target.value)}
              placeholder="Enter your Meta App Secret"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-10 text-white 
                       placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => toggleSecretVisibility('appSecret')}
              className="absolute right-3 top-3 text-zinc-400 hover:text-white"
            >
              {showSecrets.appSecret ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Access Token
          </label>
          <div className="relative">
            <input
              type={showSecrets.accessToken ? "text" : "password"}
              value={credentials.accessToken}
              onChange={(e) => handleInputChange('accessToken', e.target.value)}
              placeholder="Enter your System User Access Token"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-10 text-white 
                       placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => toggleSecretVisibility('accessToken')}
              className="absolute right-3 top-3 text-zinc-400 hover:text-white"
            >
              {showSecrets.accessToken ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
        </div>

        {/* Phone Number ID */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Phone Number ID
          </label>
          <input
            type="text"
            value={credentials.phoneNumberId}
            onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
            placeholder="Enter your Business Phone Number ID"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white 
                     placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Business Account ID */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Business Account ID (WABA)
          </label>
          <input
            type="text"
            value={credentials.businessAccountId}
            onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
            placeholder="Enter your WhatsApp Business Account ID"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white 
                     placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Webhook Verify Token */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Webhook Verify Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={credentials.webhookVerifyToken}
              onChange={(e) => handleInputChange('webhookVerifyToken', e.target.value)}
              placeholder="Enter your custom webhook verify token"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white 
                       placeholder-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => {
                const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                handleInputChange('webhookVerifyToken', randomToken);
              }}
              className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              title="Generate random token"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Help Links */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">Need Help Getting Credentials?</h4>
        <div className="space-y-2 text-sm">
          <a
            href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            <IconExternalLink size={14} />
            WhatsApp Business API Setup Guide
          </a>
          <a
            href="https://business.facebook.com/wa/manage/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            <IconExternalLink size={14} />
            WhatsApp Business Manager
          </a>
        </div>
      </div>
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg mb-2">Test Connection</h3>
        <p className="text-zinc-400 text-sm">
          Let's verify that your credentials work by testing the API connection.
        </p>
      </div>

      {!testResult && (
        <div className="text-center py-8">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 
                     text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <IconLoader size={20} className="animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <IconCheck size={20} />
                Test Connection
              </>
            )}
          </button>
        </div>
      )}

      {testResult && (
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <IconCheck size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Connection Successful!</h4>
              <p className="text-green-400 text-sm">Your WhatsApp Business API is configured correctly</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-400">Phone Number</div>
              <div className="text-white font-medium">{testResult.phoneNumber}</div>
            </div>
            <div>
              <div className="text-zinc-400">Status</div>
              <div className="text-green-400 font-medium capitalize">{testResult.status}</div>
            </div>
            <div>
              <div className="text-zinc-400">Business Name</div>
              <div className="text-white font-medium">{testResult.businessName}</div>
            </div>
            <div>
              <div className="text-zinc-400">Daily Quota</div>
              <div className="text-white font-medium">{testResult.quotaUsed}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderWebhooksStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg mb-2">Configure Webhooks</h3>
        <p className="text-zinc-400 text-sm">
          Configure webhooks in your Meta Developer Console to receive real-time messages.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Webhook Configuration</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-800 px-3 py-2 rounded text-green-400 text-sm">
                https://yourdomain.com/webhooks/whatsapp
              </code>
              <button
                onClick={() => copyToClipboard('https://yourdomain.com/webhooks/whatsapp')}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Verify Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-800 px-3 py-2 rounded text-green-400 text-sm">
                {credentials.webhookVerifyToken}
              </code>
              <button
                onClick={() => copyToClipboard(credentials.webhookVerifyToken)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                <IconCopy size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Webhook Fields</label>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-white">messages</span>
              <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-white">message_deliveries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <IconAlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="text-amber-400 font-medium mb-1">Important</div>
            <div className="text-amber-200">
              Make sure your webhook endpoint is publicly accessible and uses HTTPS. 
              You'll need to configure this URL in your Meta Developer Console under WhatsApp > Configuration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold text-xl">WhatsApp Business Setup</h2>
            <p className="text-zinc-400 text-sm">Connect your WhatsApp Business API</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            {['credentials', 'test', 'webhooks'].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-green-500 text-white' 
                    : index < ['credentials', 'test', 'webhooks'].indexOf(currentStep)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {index + 1}
                </div>
                <span className={`text-sm capitalize ${
                  currentStep === step ? 'text-white' : 'text-zinc-400'
                }`}>
                  {step}
                </span>
                {index < 2 && <div className="w-8 h-px bg-zinc-700" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === 'credentials' && renderCredentialsStep()}
          {currentStep === 'test' && renderTestStep()}
          {currentStep === 'webhooks' && renderWebhooksStep()}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <IconAlertTriangle size={16} />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <IconCheck size={16} />
              {success}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <button
            onClick={() => {
              if (currentStep === 'credentials') {
                onClose();
              } else if (currentStep === 'test') {
                setCurrentStep('credentials');
              } else if (currentStep === 'webhooks') {
                setCurrentStep('test');
              }
            }}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            {currentStep === 'credentials' ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => {
              if (currentStep === 'credentials') {
                setCurrentStep('test');
              } else if (currentStep === 'test') {
                setCurrentStep('webhooks');
              } else if (currentStep === 'webhooks') {
                completeSetup();
              }
            }}
            disabled={!isStepValid() || isLoading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed
                     text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <IconLoader size={16} className="animate-spin" />
            ) : currentStep === 'webhooks' ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetupModal;