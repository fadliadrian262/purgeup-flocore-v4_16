
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { IconLoader, IconTriangleAlert } from './icons';
import * as authService from '../services/authService';

// This interface is needed for the Google Identity Services library
interface CredentialResponse {
    credential?: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

// =================================================================================
// IMPORTANT: Replace this placeholder with your actual Google Cloud Client ID.
// You can get this from the Google Cloud Console under "APIs & Services" > "Credentials".
// Make sure your app's origin (e.g., http://localhost:3000) is added to the
// "Authorized JavaScript origins" for this client ID.
// =================================================================================
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';


const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleGoogleLogin = async (response: CredentialResponse) => {
        if (!response.credential) {
            setError("Google sign-in failed. No credential received.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const user = await authService.processGoogleLogin(response.credential);
            onLoginSuccess(user);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during login.";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await authService.loginAsGuest();
            onLoginSuccess(user);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during guest login.";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
            setIsConfigured(false);
            return;
        }
        
        setIsConfigured(true);

        // @ts-ignore
        if (window.google && googleButtonRef.current) {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin,
            });
            // @ts-ignore
            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: 'outline', size: 'large', type: 'standard', text: 'continue_with', width: '320' }
            );
             // @ts-ignore
             window.google.accounts.id.prompt(); // Show One Tap prompt
        }
    }, []);

    const NotConfiguredState = () => (
        <div className="bg-orange-900/50 border border-orange-500/50 text-orange-200 p-4 rounded-xl mb-6 flex flex-col items-start gap-3 w-full max-w-sm">
            <div className="flex items-center gap-3">
                <IconTriangleAlert size={20} />
                <h3 className="font-bold">Configuration Required</h3>
            </div>
            <p className="text-sm">
                Google Sign-In is not configured. Please add your Google Client ID to continue.
            </p>
            <p className="text-sm">
                Open this file and replace the placeholder value in: <strong className="text-white">components/LoginPage.tsx</strong>
            </p>
        </div>
    );

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
            <div className="w-full max-w-sm mx-auto z-10 animate-fade-in flex flex-col items-center">
                <div className="flex flex-col items-center text-center mb-10">
                    <h1 className="text-5xl font-bold text-white tracking-wide">FLOCORE</h1>
                    <p className="text-zinc-400 mt-4">Construction Intelligence, Activated.</p>
                </div>
                
                {!isConfigured ? (
                    <NotConfiguredState />
                ) : error ? (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-xl mb-6 flex items-center gap-3">
                        <IconTriangleAlert size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                ) : null}
                
                {isConfigured && !isLoading && (
                    <div ref={googleButtonRef} className="h-[50px] mb-4">
                        {/* The Google Sign-In button will be rendered here. */}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[98px]">
                        <IconLoader className="animate-spin text-zinc-400" size={32}/>
                        <p className="text-zinc-400 mt-2 text-sm">Signing in...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-[320px]">
                        <div className="flex items-center w-full my-2">
                            <div className="flex-grow border-t border-zinc-700"></div>
                            <span className="flex-shrink mx-4 text-zinc-500 text-sm">OR</span>
                            <div className="flex-grow border-t border-zinc-700"></div>
                        </div>

                        <button
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                            className="bg-zinc-800 text-zinc-200 font-semibold w-full h-[40px] flex items-center justify-center rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            Continue as Guest
                        </button>
                    </div>
                )}


                 <p className="text-xs text-zinc-600 mt-8 text-center max-w-xs">
                    By continuing, you agree to the FLOCORE Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;