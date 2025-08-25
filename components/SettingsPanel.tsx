import React, { useState, useEffect } from 'react';
import { 
    IconX, 
    IconWrench, 
    IconBuilding,
    IconLink,
    IconDownloadCloud,
    IconFolderSync,
    IconArrowLeft,
    IconChevronRight,
    IconExternalLink,
    IconDatabase,
    IconCreditCard,
    IconCheckCircle2,
    IconLogOut,
    IconChevronDown,
    IconLayoutTemplate,
    IconGlobe,
    IconSparkles,
    IconUser,
} from './icons';
import { IntegrationService, ConnectionStatus, SubscriptionPlan, User, CalculationStandard, Language } from '../types';
import PlatformLogo from './PlatformLogo';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplateStudio: () => void;
  integrationServices: IntegrationService[];
  onConnect: (service: IntegrationService) => void;
  onDisconnect: (serviceId: string) => void;
  onLogout: () => void;
  user: User;
  onSettingChange: (key: keyof User, value: any) => void;
}

type SettingsView = 'main' | 'ai' | 'data' | 'subscription' | 'integrations';

// --- Mock Data ---
const currentSubscription: SubscriptionPlan = {
    name: 'Enterprise',
    price: '$299/month',
    features: [
        'Full Co-Pilot AI',
        'CYA Mode',
        'Offline Sync',
        'Multi-site Dashboard',
        'Insurance Integration'
    ]
};

// --- Reusable Components ---

const SettingsLink: React.FC<{ icon: React.ElementType; title: string; subtitle: string; onClick: () => void; index: number; }> = ({ icon: Icon, title, subtitle, onClick, index }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/10 active:scale-[0.98]"
  >
    <Icon className="text-blue-400 mr-4 flex-shrink-0" size={24} />
    <div className="flex-grow">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
    </div>
    <IconChevronRight className="text-zinc-500" size={20} />
  </button>
);

const SettingsCategory: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, description, children }) => (
    <div>
        <h4 className="font-semibold text-white text-base">{title}</h4>
        {description && <p className="text-sm text-zinc-400 mt-1 mb-4">{description}</p>}
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ label?: string; enabled: boolean; setEnabled: (enabled: boolean) => void; }> = ({ label, enabled, setEnabled }) => {
    const switchButton = (
         <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    if (label) {
        return (
            <div className="flex items-center justify-between">
                <label className="font-semibold text-white text-sm">{label}</label>
                {switchButton}
            </div>
        );
    }
    return switchButton;
};

const CheckboxRow: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void;}> = ({label, checked, onChange}) => (
    <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500" />
        <span className="text-sm text-zinc-300">{label}</span>
    </label>
);

const SelectInput: React.FC<{ label: string; children: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;}> = ({ label, children, value, onChange }) => (
    <div>
        <label className="font-semibold text-white text-sm mb-2 block">{label}</label>
        <div className="relative">
            <select value={value} onChange={onChange} className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8">
                {children}
            </select>
            <IconChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
    </div>
);

const SliderInput: React.FC<{
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    minLabel: string;
    maxLabel: string;
}> = ({ label, value, onChange, minLabel, maxLabel }) => (
    <div>
        <label className="font-semibold text-white text-sm mb-2 block">{label}</label>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number; colorClass: string; }> = ({ value, colorClass }) => (
    <div className="w-full bg-zinc-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${value}%` }}></div>
    </div>
);


const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onOpenTemplateStudio, integrationServices, onConnect, onDisconnect, onLogout, user, onSettingChange }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimatingOut(false);
    } else {
      if (isRendered) {
        setIsAnimatingOut(true);
        const timer = setTimeout(() => setIsRendered(false), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isRendered]);

  const [activeView, setActiveView] = useState<SettingsView>('main');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');
  const [autoDownload, setAutoDownload] = useState(true);
  
  useEffect(() => {
    if(isOpen) {
        setActiveView('main');
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';

  const viewTitles: Record<SettingsView, string> = {
    main: 'Workspace Configuration',
    ai: 'AI System',
    data: 'Data, Sync & Offline',
    subscription: 'Account Manager',
    integrations: 'Platform Integrations',
  };

  const handleClose = () => {
    setActiveView('main');
    onClose();
  };

  const handleProactiveAlertChange = (key: keyof User['proactiveAlerts'], checked: boolean) => {
    const newAlerts = { ...user.proactiveAlerts, [key]: checked };
    onSettingChange('proactiveAlerts', newAlerts);
  };

  const renderContent = () => {
    const mainLinks = [
        { icon: IconLayoutTemplate, title: "Template Studio", subtitle: "Create and manage report templates.", onClick: onOpenTemplateStudio, index: 0 },
        { icon: IconSparkles, title: "AI System", subtitle: "Configure Co-Pilot behavior, language, and models.", onClick: () => setActiveView('ai'), index: 1 },
        { icon: IconDatabase, title: "Data, Sync & Offline", subtitle: "Manage storage, sync, and retention.", onClick: () => setActiveView('data'), index: 2 },
        { icon: IconUser, title: "Account Manager", subtitle: "Manage your connected account and subscription.", onClick: () => setActiveView('subscription'), index: 3 },
        { icon: IconLink, title: "Platform Integrations", subtitle: "Connect to other services for automated workflows.", onClick: () => setActiveView('integrations'), index: 4 },
    ];

    switch (activeView) {
      case 'main':
        return (
          <>
            <p className="text-zinc-400 text-sm mb-6 max-w-3xl">Configure application settings, connect to external platforms, and manage your user profile and preferences.</p>
            <div className="space-y-3">
              {mainLinks.map((link) => <SettingsLink key={link.title} {...link} />)}
            </div>
          </>
        );
      
      case 'ai':
        return (
            <>
                <p className="text-zinc-400 text-sm mb-6 max-w-3xl">Customize how the AI Co-Pilot interacts with you, set your preferred language, and manage regional engineering standards.</p>
                <div className="space-y-6">
                     <SettingsCategory title="Language & Region" description="Change the display language and engineering standards for the app.">
                        <SelectInput 
                            label="App Language"
                            value={user.language}
                            onChange={(e) => onSettingChange('language', e.target.value as Language)}
                        >
                            <option value="en">English (US)</option>
                            <option value="id">Bahasa Indonesia</option>
                        </SelectInput>
                         <SelectInput 
                            label="Engineering Calculation Standard"
                            value={user.calculationStandard}
                            onChange={(e) => onSettingChange('calculationStandard', e.target.value as CalculationStandard)}
                        >
                            <option value="SNI 2847:2019 (Indonesia)">SNI 2847:2019 (Indonesia)</option>
                            <option value="ACI 318-19 (USA)">ACI 318-19 (USA)</option>
                            <option value="Eurocode 2 (Europe)">Eurocode 2 (Europe)</option>
                            <option value="BS 8110 (UK)">BS 8110 (UK)</option>
                        </SelectInput>
                    </SettingsCategory>
                    <SettingsCategory title="Co-Pilot Behavior">
                        <SliderInput 
                            label="Suggestion Frequency" 
                            value={user.suggestionFrequency}
                            onChange={(e) => onSettingChange('suggestionFrequency', Number(e.target.value))}
                            minLabel="Critical Only"
                            maxLabel="Frequently Helpful"
                        />
                         <div>
                            <label className="font-semibold text-white text-sm mb-3 block">Enable Proactive Alerts For:</label>
                            <div className="grid grid-cols-2 gap-3">
                               <CheckboxRow label="Weather" checked={user.proactiveAlerts.weather} onChange={(c) => handleProactiveAlertChange('weather', c)} />
                               <CheckboxRow label="Safety" checked={user.proactiveAlerts.safety} onChange={(c) => handleProactiveAlertChange('safety', c)} />
                               <CheckboxRow label="Schedule" checked={user.proactiveAlerts.schedule} onChange={(c) => handleProactiveAlertChange('schedule', c)} />
                               <CheckboxRow label="Fatigue" checked={user.proactiveAlerts.fatigue} onChange={(c) => handleProactiveAlertChange('fatigue', c)} />
                            </div>
                        </div>
                        <ToggleSwitch label="Learn from My Patterns" enabled={user.learnPatterns} setEnabled={(e) => onSettingChange('learnPatterns', e)} />
                    </SettingsCategory>
                    <SettingsCategory title="Engine & Model Management" description="Manage local models that run directly on your device for offline use.">
                         <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-white">Model Updates</p>
                                <p className="text-xs text-zinc-400">Current version: 1.2.1</p>
                            </div>
                            <button
                                disabled={!isUpdateAvailable}
                                className="flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white active:scale-95"
                            >
                                <IconDownloadCloud size={16} />
                                {isUpdateAvailable ? 'Download v1.3.0' : 'Up to date'}
                            </button>
                        </div>
                         <ToggleSwitch label="Auto-Download Updates on Wi-Fi" enabled={autoDownload} setEnabled={setAutoDownload} />
                    </SettingsCategory>
                </div>
            </>
        );

      case 'data':
        return (
          <>
            <p className="text-zinc-400 text-sm mb-6 max-w-3xl">Manage local storage, sync status with the cloud, and set data retention policies.</p>
            <div className="space-y-6">
                <SettingsCategory title="Sync Status">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white text-sm">Last Synced: 3 minutes ago (Wi-Fi)</p>
                            <p className="text-xs text-green-400">All data is up to date.</p>
                        </div>
                        <button className="flex items-center gap-2 text-sm text-blue-400 font-semibold hover:text-white transition-colors">
                            <IconFolderSync size={16} /> Sync Now
                        </button>
                    </div>
                </SettingsCategory>
                 <SettingsCategory title="Storage Management">
                     <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-zinc-300">Used: 4.8 GB</span>
                            <span className="text-zinc-400">Total: 64 GB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ProgressBar value={7.5} colorClass="bg-blue-500" />
                        </div>
                         <div className="text-xs text-zinc-500 mt-2 space-y-1">
                            <p>Video Buffers: 2.1 GB</p>
                            <p>Photos & Docs: 1.5 GB</p>
                            <p>System & Models: 1.2 GB</p>
                        </div>
                    </div>
                    <button className="w-full text-center text-sm font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 py-2 rounded-lg transition-colors">
                        Clear Cache
                    </button>
                 </SettingsCategory>
                <SettingsCategory title="Data Retention">
                    <SelectInput label="Auto-delete analysis after" value={dataRetention} onChange={(e) => setDataRetention(e.target.value)}>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                        <option value="never">Never</option>
                    </SelectInput>
                </SettingsCategory>
              </div>
          </>
        );

      case 'subscription':
        return (
            <div className="space-y-6">
                <SettingsCategory title="Connected Account">
                    <div className="flex items-center gap-4">
                        <img src={user.picture} alt={user.name} className="w-14 h-14 rounded-full" />
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-white truncate">{user.name}</p>
                            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 text-sm text-red-400 font-semibold py-2.5 rounded-lg hover:bg-red-500/10 transition-colors mt-2"
                    >
                        <IconLogOut size={16} />
                        Sign Out
                    </button>
                </SettingsCategory>
                <SettingsCategory title="My Plan">
                    <div className="flex justify-between items-baseline">
                        <h5 className="text-xl font-bold text-white">{currentSubscription.name} Plan</h5>
                        <p className="text-zinc-400">{currentSubscription.price}</p>
                    </div>
                     <ul className="space-y-2 pt-2">
                        {currentSubscription.features.map(feature => (
                            <li key={feature} className="flex items-center gap-3 text-sm">
                                <IconCheckCircle2 size={16} className="text-green-400" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                     <button className="w-full text-center text-sm font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 py-2.5 rounded-lg transition-colors">
                        Upgrade Plan
                    </button>
                </SettingsCategory>
                 <SettingsCategory title="Billing Information">
                     <p className="text-sm text-zinc-300">Your payments are managed securely through Stripe.</p>
                     <button className="w-full flex items-center justify-center gap-2 text-sm text-zinc-300 font-semibold py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                        <IconCreditCard size={16} /> Manage Billing & Invoices
                    </button>
                 </SettingsCategory>
            </div>
        );

      case 'integrations':
        const IntegrationCard: React.FC<{
            service: IntegrationService;
            onConnect: (service: IntegrationService) => void;
            onDisconnect: (serviceId: string) => void;
        }> = ({ service, onConnect, onDisconnect }) => {
            const isConnected = service.status === ConnectionStatus.CONNECTED;
            const needsAttention = service.status === ConnectionStatus.NEEDS_ATTENTION;
            
            return (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <PlatformLogo serviceId={service.id} />
                            <div>
                                <h5 className="font-semibold text-white">{service.name}</h5>
                                <p className="text-xs text-zinc-400">{service.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => isConnected ? onDisconnect(service.id) : onConnect(service)}
                            className={`flex-shrink-0 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                                isConnected ? 'bg-zinc-700 hover:bg-red-500/20 text-zinc-300 hover:text-red-300' :
                                needsAttention ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            {isConnected ? 'Disconnect' : needsAttention ? 'Reconnect' : 'Connect'}
                        </button>
                    </div>
                    {service.subServices && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                             <h6 className="text-xs font-semibold text-zinc-500 mb-2">SERVICES INCLUDED</h6>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {service.subServices.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2">
                                        <PlatformLogo serviceId={sub.id} />
                                        <span className="text-sm text-zinc-300">{sub.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )
        };
        
        return (
          <div>
            <p className="text-zinc-400 text-sm mb-6 max-w-3xl">Allow FLOCORE to reference other apps and services for more context. This enables powerful, automated workflows across your entire toolchain.</p>
            <div className="space-y-4">
              {integrationServices.map((service) => (
                <IntegrationCard key={service.id} service={service} onConnect={onConnect} onDisconnect={onDisconnect} />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-50 flex flex-col no-scrollbar ${animationClass}`}>
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          {activeView !== 'main' && (
            <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
              <IconArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-bold truncate text-white">{viewTitles[activeView]}</h2>
        </div>
        
        <button onClick={handleClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
          <IconX size={24} />
        </button>
      </div>

      <div className="flex-grow p-6 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPanel;