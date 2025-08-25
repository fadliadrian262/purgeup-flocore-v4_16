import React, { useEffect, useState } from 'react';

// MathJax is loaded via npm package and attached to the window object.
declare global {
    interface Window {
        MathJax: any;
    }
}

// Initialize MathJax configuration if not already done
if (typeof window !== 'undefined' && !window.MathJax) {
    window.MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        chtml: {
            fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
        },
        startup: {
            ready: () => {
                console.log('MathJax ready');
                window.MathJax.startup.defaultReady();
            }
        }
    };

    // Load MathJax from CDN for browser compatibility
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    script.async = true;
    script.onload = () => {
        console.log('MathJax loaded successfully from CDN');
    };
    script.onerror = () => {
        console.error('Failed to load MathJax from CDN');
    };
    document.head.appendChild(script);
}

interface LatexRendererProps {
  latexString: string;
  theme?: 'light' | 'dark';
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ latexString, theme = 'dark' }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Create a sandbox element to render MathJax in a clean, isolated environment.
    const sandbox = document.createElement('div');
    document.body.appendChild(sandbox);
    Object.assign(sandbox.style, { position: 'absolute', left: '-9999px', visibility: 'hidden' });

    const renderContent = async () => {
        // If there's no string or MathJax isn't ready, just display the raw string.
        if (!latexString || !window.MathJax) {
            if (isMounted) setHtmlContent(latexString);
            return;
        }

        try {
            await window.MathJax.startup.promise;
            if (!isMounted) return;

            setError(false);
            
            // Let MathJax process the string. It will find and convert any math (inline $, display $$).
            // Plain text will be passed through unchanged.
            sandbox.innerHTML = latexString;
            await window.MathJax.typesetPromise([sandbox]);
            if (!isMounted) return;
            
            // The sandbox now contains the rendered CHTML or the original plain text.
            if (isMounted) {
                setHtmlContent(sandbox.innerHTML);
            }
        } catch (err) {
            console.error('MathJax rendering error:', err, 'for string:', latexString);
            if (isMounted) setError(true);
        }
    };

    renderContent();

    // Cleanup function: remove the sandbox from the DOM when the component unmounts.
    return () => {
        isMounted = false;
        if (document.body.contains(sandbox)) {
            document.body.removeChild(sandbox);
        }
    };
  }, [latexString]);

  if (error) {
    return <div className="text-sm text-red-400 font-mono p-2 bg-red-900/50 rounded-md pl-5">Error rendering formula.</div>;
  }
  
  // Show a loading skeleton only if there is content that is currently being rendered.
  if (!htmlContent && latexString) { 
    return <div className={`text-sm h-6 rounded animate-pulse w-3/4 my-1 ml-5 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>;
  }
  
  const themeClass = theme === 'dark'
    ? 'text-zinc-300' // Dark theme: light text
    : 'text-zinc-700'; // Light theme: dark text
    
  // Render the final content, which could be plain text or CHTML, with consistent styling.
  return (
      <div 
        className={`text-sm pl-5 ${themeClass}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
  );
};

export default LatexRenderer;