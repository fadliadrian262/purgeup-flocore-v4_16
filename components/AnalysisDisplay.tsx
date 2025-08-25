import React, { useState, useEffect, useRef } from 'react';
import { AnalysisMessage, User, ConnectionStatus } from '../types';
import { integrationOrchestrator, IntegratedResponse, PlatformAction } from '../services/integrations/integrationOrchestrator';
import { integrationStatusService } from '../services/integrations/integrationStatusService';
import { geminiService } from '../services/geminiService';
import { parseMarkdown } from '../utils/markdownParser';
import { 
  IconSparkles, 
  IconUser, 
  IconSend, 
  IconMic, 
  IconLoader, 
  IconWifi, 
  IconWifiOff, 
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMessageSquare,
  IconCalendar,
  IconFile,
  IconMail,
  IconPlayCircle
} from './icons';

// Integration Status Indicator Component
const IntegrationStatusIndicator: React.FC<{ status: ConnectionStatus; platform: string }> = ({ status, platform }) => {
  const getStatusIcon = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <IconWifi size={16} className="text-green-400" />;
      case ConnectionStatus.NEEDS_ATTENTION:
        return <IconAlertTriangle size={16} className="text-yellow-400" />;
      case ConnectionStatus.DISCONNECTED:
        return <IconWifiOff size={16} className="text-red-400" />;
      default:
        return <IconWifiOff size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED: return 'bg-green-400/20 border-green-400/30';
      case ConnectionStatus.NEEDS_ATTENTION: return 'bg-yellow-400/20 border-yellow-400/30';
      case ConnectionStatus.DISCONNECTED: return 'bg-red-400/20 border-red-400/30';
      default: return 'bg-gray-400/20 border-gray-400/30';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-xs font-medium capitalize">{platform}</span>
    </div>
  );
};

// Suggested Actions Component
const SuggestedActionsPanel: React.FC<{
  actions: PlatformAction[];
  onActionClick: (action: PlatformAction) => void;
  isExecuting: boolean;
}> = ({ actions, onActionClick, isExecuting }) => {
  if (actions.length === 0) return null;

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_message': return <IconMessageSquare size={16} />;
      case 'create_event': return <IconCalendar size={16} />;
      case 'upload_document': return <IconFile size={16} />;
      case 'send_email': return <IconMail size={16} />;
      default: return <IconPlayCircle size={16} />;
    }
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 mb-4">
      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
        <IconSparkles size={16} className="text-purple-400" />
        Suggested Actions
      </h4>
      <div className="space-y-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            disabled={isExecuting}
            className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:bg-zinc-800/30 
                     border border-zinc-700/50 rounded-lg transition-all duration-200
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="text-blue-400 mt-1">
                {getActionIcon(action.actionType)}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{action.title}</div>
                <div className="text-zinc-400 text-xs mt-1">{action.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {action.platforms.map(platform => (
                      <span key={platform} className="text-xs px-2 py-1 bg-zinc-700 rounded-full">
                        {platform}
                      </span>
                    ))}
                  </div>
                  {action.confirmationRequired && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <IconClock size={12} />
                      Needs confirmation
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Integrated Response Component
const IntegratedResponseCard: React.FC<{ 
  response: IntegratedResponse;
  onActionClick: (action: PlatformAction) => void;
  isExecuting: boolean;
}> = ({ response, onActionClick, isExecuting }) => {
  const formattedSummary = parseMarkdown(response.aggregatedData.summary);

  return (
    <div className="mb-6 animate-fade-in">
      <p className="font-semibold text-purple-400 text-sm flex items-center gap-2 mb-3">
        <IconSparkles size={16} />
        <span>FLOCORE AI - Integrated Response</span>
        <span className="text-xs text-zinc-500">({response.responseTime}ms)</span>
      </p>
      
      <div className="pl-8 space-y-4">
        {/* Integration Status */}
        <div className="flex gap-2 flex-wrap">
          {response.sources.whatsapp && (
            <IntegrationStatusIndicator 
              status={response.sources.whatsapp.status === 'success' ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED}
              platform="WhatsApp"
            />
          )}
          {response.sources.google && (
            <IntegrationStatusIndicator 
              status={response.sources.google.status === 'success' ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED}
              platform="Google"
            />
          )}
        </div>

        {/* Main Response */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div
            className="prose prose-sm prose-zinc max-w-none text-zinc-300"
            dangerouslySetInnerHTML={{ __html: formattedSummary }}
          />
        </div>

        {/* Detailed Data Sources */}
        {response.aggregatedData.details.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-white font-medium text-sm">Integrated Data Sources</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {response.aggregatedData.details.map((detail, index) => (
                <div key={index} className="bg-zinc-900/30 rounded-lg border border-zinc-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      detail.source === 'whatsapp' ? 'bg-green-400' :
                      detail.source === 'google' ? 'bg-blue-400' : 'bg-purple-400'
                    }`} />
                    <span className="text-xs font-medium text-white capitalize">{detail.source}</span>
                    <span className="text-xs text-zinc-500">({detail.type})</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {typeof detail.content === 'string' ? detail.content : JSON.stringify(detail.content, null, 2).substring(0, 100) + '...'}
                  </div>
                  {detail.timestamp && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(detail.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts Warning */}
        {response.aggregatedData.conflicts && response.aggregatedData.conflicts.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertTriangle size={16} className="text-amber-400" />
              <span className="text-amber-400 font-medium text-sm">Data Conflicts Detected</span>
            </div>
            {response.aggregatedData.conflicts.map((conflict, index) => (
              <div key={index} className="text-xs text-amber-200 mb-1">
                {conflict.description} (Sources: {conflict.sources.join(', ')})
              </div>
            ))}
          </div>
        )}

        {/* Suggested Actions */}
        <SuggestedActionsPanel 
          actions={response.suggestedActions}
          onActionClick={onActionClick}
          isExecuting={isExecuting}
        />
      </div>

      <hr className="border-t border-zinc-800 my-6" />
    </div>
  );
};

// Action Confirmation Modal
const ActionConfirmationModal: React.FC<{
  action: PlatformAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, onConfirm, onCancel }) => {
  if (!action) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-white font-semibold text-lg mb-4">Confirm Action</h3>
        
        <div className="mb-4">
          <h4 className="text-white font-medium mb-2">{action.title}</h4>
          <p className="text-zinc-400 text-sm mb-3">{action.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Platforms:</span>
              {action.platforms.map(platform => (
                <span key={platform} className="text-xs px-2 py-1 bg-zinc-800 rounded-full text-white">
                  {platform}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Impact:</span>
              <span className={`text-xs font-medium ${getImpactColor(action.estimatedImpact)}`}>
                {action.estimatedImpact.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component Props
interface ConversationalAnalysisDisplayProps {
  user: User;
  currentMode: string;
}

// Main Conversational Analysis Display Component
const ConversationalAnalysisDisplay: React.FC<ConversationalAnalysisDisplayProps> = ({ user, currentMode }) => {
  const [conversationHistory, setConversationHistory] = useState<(AnalysisMessage | { type: 'integrated'; response: IntegratedResponse })[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PlatformAction | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<{[key: string]: ConnectionStatus}>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Load integration status on mount
  useEffect(() => {
    const loadIntegrationStatus = async () => {
      try {
        const status = await integrationStatusService.getAllIntegrationStatus();
        const statusMap: {[key: string]: ConnectionStatus} = {};
        status.forEach(s => {
          statusMap[s.platform] = s.status;
        });
        setIntegrationStatus(statusMap);
      } catch (error) {
        console.error('Failed to load integration status:', error);
      }
    };

    loadIntegrationStatus();
    const interval = setInterval(loadIntegrationStatus, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Handle conversational query submission
  const handleQuerySubmit = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    // Add user message to history
    const userMessage: AnalysisMessage = {
      id: Date.now(),
      author: 'user',
      type: 'text',
      text: query,
      isTyping: false
    };
    setConversationHistory(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Add typing indicator
      const typingMessage: AnalysisMessage = {
        id: Date.now() + 1,
        author: 'ai',
        type: 'text',
        text: '',
        isTyping: true
      };
      setConversationHistory(prev => [...prev, typingMessage]);

      // Process query through integration orchestrator
      const response = await integrationOrchestrator.processConversationalQuery(query, user.email);
      
      // Remove typing indicator and add integrated response
      setConversationHistory(prev => 
        prev.filter(msg => !('isTyping' in msg) || !msg.isTyping)
          .concat([{ type: 'integrated', response }])
      );

    } catch (error) {
      console.error('Error processing conversational query:', error);
      
      // Remove typing indicator and add error message
      setConversationHistory(prev => 
        prev.filter(msg => !('isTyping' in msg) || !msg.isTyping)
          .concat([{
            id: Date.now() + 2,
            author: 'ai',
            type: 'text',
            text: 'I encountered an error while processing your request. Some integrations may be unavailable. Please try again or check your integration settings.',
            isTyping: false
          }])
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle action execution
  const handleActionClick = (action: PlatformAction) => {
    if (action.confirmationRequired) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: PlatformAction) => {
    setIsExecuting(true);
    setPendingAction(null);

    try {
      const result = await integrationOrchestrator.executeConfirmedAction(action.id, user.email);
      
      // Add execution result to conversation
      const resultMessage: AnalysisMessage = {
        id: Date.now(),
        author: 'ai',
        type: 'text',
        text: ` Action executed successfully: ${action.title}\n\n${result.results.map(r => 
          `${r.platform}: ${r.success ? ' Success' : 'L Failed'}`
        ).join('\n')}`,
        isTyping: false
      };
      
      setConversationHistory(prev => [...prev, resultMessage]);
      
    } catch (error) {
      console.error('Error executing action:', error);
      
      const errorMessage: AnalysisMessage = {
        id: Date.now(),
        author: 'ai',
        type: 'text',
        text: `L Failed to execute action: ${action.title}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isTyping: false
      };
      
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuerySubmit(inputText);
  };

  // Handle textarea key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuerySubmit(inputText);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Conversational Analysis Hub</h2>
            <p className="text-zinc-400 text-sm">Ask questions about your project across all connected platforms</p>
          </div>
          
          {/* Integration Status Indicators */}
          <div className="flex gap-2">
            <IntegrationStatusIndicator status={integrationStatus.whatsapp || ConnectionStatus.DISCONNECTED} platform="WhatsApp" />
            <IntegrationStatusIndicator status={integrationStatus.google || ConnectionStatus.DISCONNECTED} platform="Google" />
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.length === 0 && (
          <div className="text-center py-12">
            <IconSparkles size={48} className="text-purple-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Start a Conversation</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Ask me about project status, schedules, communications, or any other construction-related questions. 
              I'll gather information from WhatsApp, Google Workspace, and other connected platforms.
            </p>
            
            {/* Example Queries */}
            <div className="mt-8 max-w-2xl mx-auto">
              <p className="text-zinc-500 text-sm mb-3">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "What's our project progress this week?",
                  "Any safety incidents reported today?",
                  "Show me the construction schedule",
                  "What documents were uploaded recently?",
                  "Send daily report to the team",
                  "Create a calendar event for inspection"
                ].map(example => (
                  <button
                    key={example}
                    onClick={() => setInputText(example)}
                    className="text-left text-sm text-blue-400 hover:text-blue-300 p-2 rounded border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message History */}
        {conversationHistory.map((item, index) => {
          if ('type' in item && item.type === 'integrated') {
            return (
              <IntegratedResponseCard
                key={`integrated-${index}`}
                response={item.response}
                onActionClick={handleActionClick}
                isExecuting={isExecuting}
              />
            );
          } else {
            const message = item as AnalysisMessage;
            if (message.author === 'user') {
              return (
                <div key={message.id} className="mb-6 animate-fade-in">
                  <p className="font-semibold text-blue-400 text-sm flex items-center gap-2">
                    <IconUser size={16} />
                    <span>You</span>
                  </p>
                  <p className="text-white text-base mt-1 pl-6">{message.text}</p>
                </div>
              );
            } else {
              const formattedText = message.text ? parseMarkdown(message.text) : '';
              return (
                <div key={message.id} className="mb-6 animate-fade-in">
                  <p className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                    <IconSparkles size={16} />
                    <span>FLOCORE AI</span>
                  </p>
                  <div className="mt-2 pl-6">
                    {message.isTyping ? (
                      <div className="flex items-center gap-2">
                        <IconLoader className="inline-block animate-spin" size={16} />
                        <span className="text-sm text-zinc-400 italic">Processing your request across platforms...</span>
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm prose-zinc max-w-none text-zinc-300"
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                      />
                    )}
                  </div>
                  {!message.isTyping && <hr className="border-t border-zinc-800 my-6" />}
                </div>
              );
            }
          }
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textAreaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about your project... (Shift+Enter for new line)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none
                       min-h-[44px] max-h-[200px]"
              rows={1}
              disabled={isProcessing}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed
                     text-white rounded-xl transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <IconLoader size={20} className="animate-spin" />
            ) : (
              <IconSend size={20} />
            )}
          </button>
        </form>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>Connected platforms: {Object.values(integrationStatus).filter(s => s === ConnectionStatus.CONNECTED).length}</span>
            {isExecuting && (
              <div className="flex items-center gap-1">
                <IconLoader size={12} className="animate-spin" />
                <span>Executing action...</span>
              </div>
            )}
          </div>
          <div>
            Powered by FLOCORE AI " Real-time integration
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      <ActionConfirmationModal
        action={pendingAction}
        onConfirm={() => pendingAction && executeAction(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};

export default ConversationalAnalysisDisplay;