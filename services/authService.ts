import { User, CalculationStandard, Language } from '../types';

const USER_STORAGE_key = 'flocore_user';

/**
 * Decodes a JWT token from Google Sign-In.
 * NOTE: This is for client-side convenience to get user profile data.
 * In a real production app with a backend, the token should be sent to
 * the backend and verified there for security.
 * @param token The JWT string.
 * @returns The decoded payload object.
 */
const decodeJwtResponse = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Failed to decode JWT", error);
        throw new Error("Invalid token received from Google.");
    }
};


/**
 * Processes the credential from Google, creates a user session.
 * @param credential The JWT credential string from Google.
 * @returns The user object.
 */
export const processGoogleLogin = async (credential: string): Promise<User> => {
    console.log("Processing Google login...");
    return new Promise((resolve, reject) => {
        try {
            const decodedData = decodeJwtResponse(credential);
            
            const storedUserStr = localStorage.getItem(USER_STORAGE_key);
            let onboardingComplete = false;
            let calculationStandard: CalculationStandard = 'SNI 2847:2019 (Indonesia)'; // Default standard
            let language: Language = 'en';
            let suggestionFrequency = 75;
            let proactiveAlerts = { weather: true, safety: true, schedule: true, fatigue: true };
            let learnPatterns = true;

            if (storedUserStr) {
                const storedUser: User = JSON.parse(storedUserStr);
                if (storedUser.email === decodedData.email) {
                    onboardingComplete = storedUser.onboardingComplete;
                    calculationStandard = storedUser.calculationStandard || calculationStandard;
                    language = storedUser.language || 'en';
                    suggestionFrequency = storedUser.suggestionFrequency ?? suggestionFrequency;
                    proactiveAlerts = storedUser.proactiveAlerts ?? proactiveAlerts;
                    learnPatterns = storedUser.learnPatterns ?? learnPatterns;
                }
            }

            const user: User = {
                name: decodedData.given_name || decodedData.name,
                email: decodedData.email,
                picture: decodedData.picture,
                onboardingComplete: onboardingComplete,
                calculationStandard: calculationStandard,
                language: language,
                suggestionFrequency,
                proactiveAlerts,
                learnPatterns,
            };

            localStorage.setItem(USER_STORAGE_key, JSON.stringify(user));
            console.log("Google login successful, user session created.", user);
            resolve(user);

        } catch (error) {
            reject(error);
        }
    });
};


export const checkAuth = async (): Promise<User | null> => {
    console.log("Checking for existing authentication session...");
    return new Promise((resolve) => {
        setTimeout(() => {
            const storedUserStr = localStorage.getItem(USER_STORAGE_key);
            if (storedUserStr) {
                try {
                    const user: User = JSON.parse(storedUserStr);
                     // Backwards compatibility for users without a language set
                    if (!user.language) {
                        user.language = 'en';
                    }
                    console.log("User session found in storage:", user);
                    resolve(user);
                } catch (e) {
                    console.error("Failed to parse stored user data", e);
                    localStorage.removeItem(USER_STORAGE_key);
                    resolve(null);
                }
            } else {
                console.log("No user session found.");
                resolve(null);
            }
        }, 500); // Simulate network delay check
    });
};

export const loginAsGuest = async (): Promise<User> => {
    console.log("Creating guest session...");
    return new Promise((resolve) => {
        const guestUser: User = {
            name: 'Guest',
            email: 'guest@flocore.ai',
            picture: `https://i.pravatar.cc/150?u=guest@flocore.ai`,
            onboardingComplete: false, // This is key for the onboarding flow
            calculationStandard: 'SNI 2847:2019 (Indonesia)',
            language: 'en',
            suggestionFrequency: 75,
            proactiveAlerts: { weather: true, safety: true, schedule: true, fatigue: true },
            learnPatterns: true,
        };
        localStorage.setItem(USER_STORAGE_key, JSON.stringify(guestUser));
        console.log("Guest session created and stored.", guestUser);
        resolve(guestUser);
    });
};


export const logout = async (): Promise<void> => {
    console.log("Logging out and clearing session.");
    // @ts-ignore
    if (window.google && window.google.accounts && window.google.accounts.id) {
         // @ts-ignore
        window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem(USER_STORAGE_key);
};

export const completeOnboarding = async (user: User): Promise<User> => {
    console.log("Marking onboarding as complete for user:", user.email);
    return new Promise((resolve) => {
       const updatedUser = { ...user, onboardingComplete: true };
       localStorage.setItem(USER_STORAGE_key, JSON.stringify(updatedUser));
       console.log("Updated user in storage:", updatedUser);
       resolve(updatedUser);
    });
};


export const updateUserSetting = async (user: User, key: keyof User, value: any): Promise<User> => {
    console.log(`Updating user setting: ${String(key)} = ${value}`);
    return new Promise((resolve) => {
        const updatedUser = { ...user, [key]: value };
        localStorage.setItem(USER_STORAGE_key, JSON.stringify(updatedUser));
        console.log("Updated user in storage:", updatedUser);
        resolve(updatedUser);
    });
};