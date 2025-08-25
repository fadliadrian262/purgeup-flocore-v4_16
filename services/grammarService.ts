import { supervisor } from './agents/supervisorAgent';
import { getProjectDocuments } from './documentService';

// The static list, moved from useSpeechRecognition for centralization
const staticConstructionTerms = [
  'rebar', 'concrete', 'steel', 'beam', 'column', 'girder', 'scaffolding', 'formwork',
  'foundation', 'footing', 'slab', 'joist', 'truss', 'stud', 'drywall', 'HVAC',
  'plumbing', 'electrical', 'conduit', 'junction box', 'PPE', 'hard hat', 'safety vest',
  'harness', 'excavator', 'bulldozer', 'crane', 'welding', 'bolt', 'anchor',
  'ASTM', 'PSI', 'megapascal', 'drawing', 'blueprint', 'RFI', 'request for information',
  'change order', 'submittal', 'punch list', 'inspection', 'safety', 'violation',
  'hazard', 'analysis', 'report', 'document', 'progress', 'schedule', 'milestone',
  'spalling', 'soffit', 'turnbuckle', 'gusset plate', 'shear wall', 'retaining wall',
  'shoring', 'underpinning', 'facade', 'cladding', 'glazing', 'waterproofing',
  'insulation', 'roofing', 'decking', 'aggregate', 'cement', 'admixture',
  'structural', 'architectural', 'mechanical', 'elevation', 'section', 'plan',
  'W12x26', 'HSS', 'ductwork', 'piping', 'wiring', 'panel', 'breaker', 'switchgear',
  'procore', 'autodesk', 'bim', 'revit', 'tekla', 'flocore', 'analyze', 'measure',
  'calculate', 'verify', 'check', 'spacing', 'alignment', 'dimensions', 'quantity',
  'quality', 'control', 'assurance', 'audit', 'compliance', 'standard', 'code',
  'SNI', 'ACI', 'Eurocode', 'BS', 'OSHA'
];

let cachedGrammar: string[] | null = null;
let grammarPromise: Promise<string[]> | null = null;

/**
 * Generates and caches a comprehensive grammar list for speech recognition
 * by combining static construction terms with dynamic terms extracted from project documents.
 * @returns A promise that resolves to an array of grammar terms.
 */
export const getEnhancedGrammar = (): Promise<string[]> => {
  if (cachedGrammar) {
    return Promise.resolve(cachedGrammar);
  }

  if (grammarPromise) {
    return grammarPromise;
  }

  grammarPromise = (async () => {
    try {
      // --- DEVELOPMENT: API Call Disabled ---
      // The dynamic grammar generation is disabled to conserve API tokens during development.
      // To re-enable this feature, comment out the 'throw' line below and uncomment the original logic block.
      throw new Error("Dynamic grammar generation is disabled for development.");
      
      /*
      // Original logic for dynamic grammar generation
      console.log('[GrammarService] Generating enhanced grammar list...');
      const documents = await getProjectDocuments();
      const documentNames = documents.map(doc => doc.name);
      
      const dynamicTerms = await supervisor.getDynamicGrammar(documentNames);
      
      // Combine static and dynamic terms, ensuring no duplicates
      const combined = [...new Set([...staticConstructionTerms, ...dynamicTerms])];
      
      cachedGrammar = combined;
      console.log(`[GrammarService] Enhanced grammar generated with ${combined.length} total terms.`);
      return combined;
      */
    } catch (error) {
      console.warn('[GrammarService] Falling back to static grammar list. Message:', (error as Error).message);
      // Fallback to only static terms on error or when disabled
      cachedGrammar = staticConstructionTerms;
      return staticConstructionTerms;
    } finally {
        grammarPromise = null; // Reset promise after completion
    }
  })();

  return grammarPromise;
};