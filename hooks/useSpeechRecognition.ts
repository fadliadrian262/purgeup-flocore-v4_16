
import { useState, useEffect, useRef, useCallback } from 'react';
import { getEnhancedGrammar } from '../services/grammarService';
import { Language } from '../types';

// SpeechRecognition might exist on window but not in the standard TS lib
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechGrammarList: any;
    webkitSpeechGrammarList: any;
  }
}

interface SpeechRecognitionHook {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (language: Language = 'en'): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const languageRef = useRef(language);

  // Keep language ref updated without re-triggering the main effect
  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'id' ? 'id-ID' : 'en-US';
    }
  }, [language]);


  // This effect sets up the speech recognition object and its event handlers.
  // It runs only once on component mount, thanks to the empty dependency array.
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Asynchronously apply the enhanced grammar from the grammar service.
    if (SpeechGrammarList) {
        getEnhancedGrammar().then(grammarTerms => {
            try {
                const speechRecognitionList = new SpeechGrammarList();
                const grammar = '#JSGF V1.0; grammar terms; public <term> = ' + grammarTerms.join(' | ') + ' ;';
                speechRecognitionList.addFromString(grammar, 1);
                recognition.grammars = speechRecognitionList;
                console.log("Speech recognition grammar enhanced with project-specific terms.");
            } catch(e) {
                console.error("Could not add grammar list to speech recognition:", e);
            }
        }).catch(err => {
            console.error("Failed to fetch enhanced grammar:", err);
        });
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageRef.current === 'id' ? 'id-ID' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      // Reset transcripts at the beginning of a new listening session.
      setInterimTranscript('');
      setFinalTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') { // Don't show an error for silence.
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(prev => prev + final.trim() + ' ');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // The empty array is crucial to prevent re-initialization on every render.

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = languageRef.current === 'id' ? 'id-ID' : 'en-US';
        recognitionRef.current.start();
      } catch (e) {
        // This can happen if start() is called again before the engine is ready.
        console.error("Could not start recognition:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);
  
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, interimTranscript, finalTranscript, startListening, stopListening, error, isSupported, resetTranscript };
};
