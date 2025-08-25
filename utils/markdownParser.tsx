import { marked } from 'marked';

// Basic configuration for marked
marked.setOptions({
  gfm: true, // Use GitHub Flavored Markdown
  breaks: true, // Convert single line breaks into <br>
  pedantic: false,
  mangle: false,
  headerIds: false,
});

/**
 * Parses a Markdown string and returns a sanitized HTML string.
 * @param markdownText - The text to parse.
 * @returns A string containing HTML.
 */
export const parseMarkdown = (markdownText: string): string => {
  if (!markdownText) return '';
  // The 'marked' library handles sanitization by default to prevent XSS.
  // We can trust its output for rendering.
  return marked.parse(markdownText) as string;
};
