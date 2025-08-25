import React, { useState, useEffect } from 'react';
import { IntegrationService } from '../types';
import { IconX, IconLoader, IconCheckCircle2 } from './icons';
import PlatformLogo from './PlatformLogo';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: IntegrationService;
  onConfirmConnect: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, service, onConfirmConnect }) => {
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

  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsConnecting(false);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';

  const handleConnect = () => {
    setIsConnecting(true);
    onConfirmConnect();
  };
  
  const isGoogleWorkspace = service.id === 'google-workspace' && service.subServices;

  return (
    <div className={`fixed inset-0 bg-black/60 z-[70] flex items-center justify-center ${animationClass}`}>
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-700 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8">
                    <PlatformLogo serviceId={service.id} />
                </div>
                <h2 className="text-white text-xl font-bold">Connect to {service.name}</h2>
            </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
            <IconX size={24} />
          </button>
        </div>
        
        {isGoogleWorkspace ? (
          <>
            <p className="text-zinc-400 text-sm mb-6">
                To enable powerful automated workflows, FLOCORE is requesting permission to access your Google account.
                <span className="font-bold text-zinc-300"> You will be redirected to securely sign in with Google. FLOCORE will not see or store your password.</span>
            </p>
            <div className="bg-zinc-950 p-4 rounded-lg space-y-3 mb-8 border border-zinc-800">
                <h4 className="font-semibold text-white text-sm">FLOCORE will request the following permissions:</h4>
                <ul className="space-y-3 text-xs text-zinc-300">
                    {service.subServices!.map(sub => (
                        <li key={sub.id} className="flex items-start gap-3">
                            <div className="w-5 h-5 flex-shrink-0 mt-0.5"><PlatformLogo serviceId={sub.id} /></div>
                            <div>
                                <strong className="text-white">{sub.name}</strong>
                                <p className="text-zinc-400">{sub.permission}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
          </>
        ) : (
            <p className="text-zinc-400 text-sm mb-6">
                To enable automated workflows, FLOCORE needs your permission. You will be redirected to {service.name} to securely sign in. 
                <span className="font-bold text-zinc-300"> FLOCORE will never see your password.</span>
            </p>
        )}


        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-800 disabled:cursor-wait transition-colors"
        >
          {isConnecting ? (
            <>
              <IconLoader className="animate-spin" />
              Connecting...
            </>
          ) : (
             isGoogleWorkspace ? 'Authorize & Connect' : `Authorize & Connect to ${service.name}`
          )}
        </button>
        <button onClick={onClose} className="w-full text-center mt-3 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
        </button>
      </div>
    </div>
  );
};

export default ConnectionModal;
