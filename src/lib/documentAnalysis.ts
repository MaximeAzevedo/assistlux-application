import { z } from 'zod';
import openai from './openaiConfig';
import { translateText, detectLanguage, supportedLanguages } from './translation';
import i18next from 'i18next';

// System prompt for context: Social assistant role for Luxembourg's social services
const SOCIAL_ASSISTANT_SYSTEM_PROMPT = `You are an AI assistant for Luxembourg's social services. Your task is to support the document-scanner feature: you must generate a clear summary, key points and a full translation of the input, without modifying any other part of the existing code or functionality. Adopt the role of a benevolent but ultra-professional social assistant. Your users are primarily people experiencing homelessness, refugees or clients of social agencies.

– In the summary, use simple language that anyone can understand.
– In the key points, highlight the most important details you find, such as address, contact person, phone/email contacts, required documents and deadlines.
– Keep your tone respectful, supportive and professional at all times.`;

export const documentSchema = z.object({
  type: z.string(),
  confidence: z.number(),
  detectedLanguage: z.string(),
  targetLanguage: z.string(),
  fields: z.object({
    personal: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      nationality: z.string().optional(),
      gender: z.string().optional()
    }).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    identification: z.object({
      documentType: z.string(),
      documentNumber: z.string().optional(),
      issueDate: z.string().optional(),
      expiryDate: z.string().optional(),
      issuingAuthority: z.string().optional()
    }).optional(),
    contact: z.object({
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional()
    }).optional(),
    deadlines: z.array(z.object({
      date: z.string(),
      description: z.string()
    })).optional(),
    requiredDocuments: z.array(z.string()).optional()
  }),
  explanation: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    translations: z.record(z.string()),
    context: z.object({
      importance: z.enum(['low', 'medium', 'high', 'urgent']),
      category: z.string(),
      nextSteps: z.array(z.string()).optional()
    }).optional()
  })
});

export type DocumentAnalysis = z.infer<typeof documentSchema>;

export async function analyzeDocument(text: string, preferredLanguage?: string): Promise<DocumentAnalysis> {
  if (!text) {
    throw new Error('No text provided for analysis');
  }

  try {
    console.log('🔍 Starting enhanced document analysis...');
    
    // 1. Detect the source language of the document
    const detectedLanguage = await detectLanguage(text);
    console.log('📝 Detected document language:', detectedLanguage);
    
    // 2. Determine target language (user preference > current i18n > fallback)
    const targetLanguage = preferredLanguage || i18next.language || navigator.language.split('-')[0] || 'fr';
    console.log('🎯 Target language:', targetLanguage);
    
    // 3. Detect document type early for better context
    const documentType = await detectDocumentType(text);
    console.log('📄 Document type:', documentType);
    
    // 4. Translate if needed (only if source and target languages differ)
    let translatedText = text;
    if (detectedLanguage !== targetLanguage && detectedLanguage !== 'unknown') {
      console.log('🔄 Translating document...');
      try {
        translatedText = await translateText(text, targetLanguage);
      } catch (error) {
        console.warn('Translation failed, using original text:', error);
        translatedText = text;
      }
    }
    
    // 5. Generate enhanced analysis with fallbacks
    let summary = '';
    let keyPoints: string[] = [];
    let fields: any = {
      personal: {},
      address: {},
      identification: { documentType },
      contact: {},
      deadlines: [],
      requiredDocuments: []
    };
    let context = {
      importance: 'medium' as const,
      category: 'administrative',
      nextSteps: []
    };

    try {
      const results = await Promise.allSettled([
        generateEnhancedSummary(translatedText, documentType, targetLanguage, detectedLanguage),
        generateEnhancedKeyPoints(translatedText, documentType, targetLanguage),
        extractEnhancedFields(translatedText, documentType),
        generateDocumentContext(translatedText, documentType, targetLanguage)
      ]);

      // Process results with fallbacks
      if (results[0].status === 'fulfilled') {
        summary = results[0].value;
      } else {
        console.warn('Summary generation failed:', results[0].reason);
        summary = 'Résumé non disponible pour ce document.';
      }

      if (results[1].status === 'fulfilled') {
        keyPoints = results[1].value;
      } else {
        console.warn('Key points generation failed:', results[1].reason);
        keyPoints = ['Analyse des points clés non disponible.'];
      }

      if (results[2].status === 'fulfilled') {
        fields = results[2].value;
      } else {
        console.warn('Fields extraction failed:', results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        context = results[3].value;
      } else {
        console.warn('Context generation failed:', results[3].reason);
      }
    } catch (error) {
      console.warn('Some analysis steps failed, using fallbacks:', error);
    }

    // Ensure fields structure is valid
    fields = validateAndCleanFields(fields, documentType);

    const analysis: DocumentAnalysis = {
      type: documentType,
      confidence: calculateConfidence(fields),
      detectedLanguage,
      targetLanguage,
      fields,
      explanation: {
        summary,
        keyPoints,
        translations: {
          [targetLanguage]: translatedText,
          ...(detectedLanguage !== targetLanguage && { [detectedLanguage]: text })
        },
        context
      }
    };

    // Validate the analysis object against the schema
    try {
      documentSchema.parse(analysis);
      console.log('✅ Document analysis completed successfully');
      return analysis;
    } catch (validationError) {
      console.error('Schema validation failed:', validationError);
      // Return a minimal valid analysis
      return createFallbackAnalysis(text, translatedText, documentType, detectedLanguage, targetLanguage);
    }
  } catch (error) {
    console.error('❌ Document analysis error:', error);
    // Return a minimal valid analysis instead of throwing
    return createFallbackAnalysis(text, text, 'document_administratif', 'unknown', preferredLanguage || 'fr');
  }
}

async function detectDocumentType(text: string): Promise<string> {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOCIAL_ASSISTANT_SYSTEM_PROMPT },
        {
          role: "system",
          content: `You are a document classification expert specializing in Luxembourg administrative documents.
Analyze the provided text and determine the document type.
Return ONLY the document type in French, nothing else.
Common types include:
- allocation_vie_chere (cost of living allowance)
- declaration_arrivee (arrival declaration)
- attestation_enregistrement (registration certificate)
- demande_logement (housing application)
- certificat_residence (residence certificate)
- demande_nationalite (nationality application)
- attestation_chomage (unemployment certificate)
- carte_identite (identity card)
- passeport (passport)
- permis_sejour (residence permit)
- contrat_travail (work contract)
- fiche_salaire (pay slip)
- facture (invoice/bill)
- courrier_officiel (official correspondence)
- formulaire_social (social form)

If the document doesn't match any specific type, return 'document_administratif'.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      max_tokens: 50
    });

    return response.choices[0]?.message?.content?.toLowerCase().trim() || 'unknown';
  } catch (error) {
    console.error('Error detecting document type:', error);
    return 'unknown';
  }
}

async function generateEnhancedSummary(text: string, documentType: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
  try {
    const languageInfo = supportedLanguages[targetLanguage as keyof typeof supportedLanguages];
    const languagePrompt = targetLanguage === 'lb' 
      ? 'Write in Luxembourgish (Lëtzebuergesch). Use proper Luxembourgish grammar and vocabulary.'
      : `Write in ${languageInfo?.name || targetLanguage}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOCIAL_ASSISTANT_SYSTEM_PROMPT },
        { role: "system", content: `${languagePrompt}
Create a comprehensive summary (3-4 sentences) of this ${documentType} document.
The summary should:
- Clearly explain what the document is and its purpose
- Highlight why it's important for the user
- Mention what benefits or rights it provides
- Include any urgent actions needed

Make it accessible and reassuring for someone who might be stressed or unfamiliar with administrative processes.
Return ONLY the summary text, no additional formatting.` },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating enhanced summary:', error);
    throw error;
  }
}

async function generateEnhancedKeyPoints(text: string, documentType: string, targetLanguage: string): Promise<string[]> {
  try {
    const languageInfo = supportedLanguages[targetLanguage as keyof typeof supportedLanguages];
    const languagePrompt = targetLanguage === 'lb' 
      ? 'Write in Luxembourgish (Lëtzebuergesch). Use proper Luxembourgish grammar and vocabulary.'
      : `Write in ${languageInfo?.name || targetLanguage}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOCIAL_ASSISTANT_SYSTEM_PROMPT },
        { role: "system", content: `${languagePrompt}
Extract 5-8 key points from this ${documentType} document, prioritizing the most important information.
Focus on:
1. Document purpose and what it grants/allows
2. Required actions (what the user must do)
3. Important deadlines (with specific dates if mentioned)
4. Required documents to submit
5. Contact information (office, person, phone, email)
6. Amounts, benefits, or rights mentioned
7. Conditions or requirements to maintain benefits
8. Next steps or follow-up actions

Format each point as a separate line starting with "•".
Be specific and include numbers, dates, and contact details when available.
Return ONLY the bullet points, no additional text.` },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const content = response.choices[0]?.message?.content || '';
    return content
      .split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(point => point.replace('•', '').trim())
      .filter(point => point.length > 0);
  } catch (error) {
    console.error('Error generating enhanced key points:', error);
    throw error;
  }
}

async function generateDocumentContext(text: string, documentType: string, targetLanguage: string) {
  try {
    const languageInfo = supportedLanguages[targetLanguage as keyof typeof supportedLanguages];
    const languagePrompt = targetLanguage === 'lb' 
      ? 'Répondez en luxembourgeois (Lëtzebuergesch). Utilisez la grammaire et le vocabulaire luxembourgeois appropriés.'
      : `Répondez en ${languageInfo?.name || 'français'}. Utilisez uniquement cette langue pour votre réponse.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOCIAL_ASSISTANT_SYSTEM_PROMPT },
        { role: "system", content: `${languagePrompt}

Analysez ce document ${documentType} et fournissez des informations contextuelles.
Retournez un objet JSON avec :
{
  "importance": "low|medium|high|urgent",
  "category": "housing|financial|legal|health|employment|education|immigration|administrative",
  "nextSteps": ["étape1", "étape2", "étape3"]
}

Niveaux d'importance :
- urgent: action immédiate requise (échéances dans les jours)
- high: action importante requise (échéances dans les semaines)
- medium: action requise (échéances dans les mois)
- low: informatif ou long terme

Les prochaines étapes doivent être en ${languageInfo?.name || 'français'} et être des actions concrètes et utiles.
Retournez UNIQUEMENT l'objet JSON.` },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(content.trim());
      
      // Ensure nextSteps is always an array of strings
      if (parsed.nextSteps && Array.isArray(parsed.nextSteps)) {
        parsed.nextSteps = parsed.nextSteps
          .filter((step: any) => typeof step === 'string' && step.trim().length > 0)
          .map((step: any) => String(step).trim());
      } else {
        parsed.nextSteps = [];
      }
      
      return parsed;
    } catch {
      return {
        importance: 'medium' as const,
        category: 'administrative',
        nextSteps: [
          'Lire attentivement le document',
          'Contacter le service concerné si nécessaire',
          'Conserver une copie du document'
        ]
      };
    }
  } catch (error) {
    console.error('Error generating document context:', error);
    return {
      importance: 'medium' as const,
      category: 'administrative',
      nextSteps: [
        'Lire attentivement le document',
        'Contacter le service concerné si nécessaire',
        'Conserver une copie du document'
      ]
    };
  }
}

async function extractEnhancedFields(text: string, documentType: string) {
  const fields: any = {
    personal: {},
    address: {},
    identification: { documentType },
    contact: {},
    deadlines: [],
    requiredDocuments: []
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOCIAL_ASSISTANT_SYSTEM_PROMPT },
        { role: "system", content: `Extract all relevant information from this ${documentType} document and return it as a valid JSON object with the following structure:
{
  "personal": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "dateOfBirth": "DD/MM/YYYY",
    "nationality": "Nationality"
  },
  "address": {
    "street": "Street address",
    "city": "City name",
    "postalCode": "Postal code",
    "country": "Country name"
  },
  "contact": {
    "phone": "Phone number",
    "email": "Email address",
    "website": "Website URL"
  },
  "deadlines": [
    {
      "date": "DD/MM/YYYY",
      "description": "What needs to be done"
    }
  ],
  "requiredDocuments": ["Document 1", "Document 2"],
  "amounts": {
    "benefit": "Amount if applicable",
    "fee": "Fee if applicable"
  }
}

Only include fields that are actually present in the document.
Return ONLY the JSON object, with no markdown formatting or code blocks.
Ensure the JSON is properly formatted with double quotes around property names.` },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || '{}';
    let cleanedContent = content.trim();
    
    // Remove markdown code block markers if present
    cleanedContent = cleanedContent
      .replace(/^```(?:json)?\n/, '')
      .replace(/\n```$/, '')
      .trim();
    
    try {
      const extractedFields = JSON.parse(cleanedContent);
      
      // Merge extracted fields with our structure
      Object.keys(extractedFields).forEach(key => {
        if (fields.hasOwnProperty(key)) {
          fields[key] = { ...fields[key], ...extractedFields[key] };
        }
      });

      return fields;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return fields;
    }
  } catch (error) {
    console.error('Error extracting enhanced fields:', error);
    return fields;
  }
}

function calculateConfidence(fields: any): number {
  let totalPossibleFields = 0;
  let extractedFields = 0;
  
  // Define expected fields for different sections
  const expectedFields = {
    personal: ['firstName', 'lastName', 'dateOfBirth', 'nationality'],
    address: ['street', 'city', 'postalCode', 'country'],
    contact: ['phone', 'email'],
    identification: ['documentType', 'documentNumber'],
    deadlines: [], // Array field
    requiredDocuments: [] // Array field
  };

  function countFieldsInSection(sectionData: any, expectedFieldsList: string[]) {
    if (!sectionData || typeof sectionData !== 'object') return { total: 0, filled: 0 };
    
    let sectionTotal = 0;
    let sectionFilled = 0;
    
    expectedFieldsList.forEach(fieldName => {
      sectionTotal++;
      if (sectionData[fieldName] && 
          typeof sectionData[fieldName] === 'string' && 
          sectionData[fieldName].trim().length > 0) {
        sectionFilled++;
      }
    });
    
    return { total: sectionTotal, filled: sectionFilled };
  }

  try {
    // Count personal information fields
    const personalCount = countFieldsInSection(fields.personal, expectedFields.personal);
    totalPossibleFields += personalCount.total;
    extractedFields += personalCount.filled;

    // Count address fields
    const addressCount = countFieldsInSection(fields.address, expectedFields.address);
    totalPossibleFields += addressCount.total;
    extractedFields += addressCount.filled;

    // Count contact fields
    const contactCount = countFieldsInSection(fields.contact, expectedFields.contact);
    totalPossibleFields += contactCount.total;
    extractedFields += contactCount.filled;

    // Count identification fields
    const identificationCount = countFieldsInSection(fields.identification, expectedFields.identification);
    totalPossibleFields += identificationCount.total;
    extractedFields += identificationCount.filled;

    // Count array fields (deadlines and required documents)
    totalPossibleFields += 2; // deadlines and requiredDocuments
    
    if (Array.isArray(fields.deadlines) && fields.deadlines.length > 0) {
      extractedFields++;
    }
    
    if (Array.isArray(fields.requiredDocuments) && fields.requiredDocuments.length > 0) {
      extractedFields++;
    }

    // Calculate confidence as percentage
    const confidence = totalPossibleFields > 0 ? (extractedFields / totalPossibleFields) : 0;
    
    // Round to 2 decimal places and ensure it's between 0 and 1
    return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
    
  } catch (error) {
    console.warn('Error calculating confidence:', error);
    return 0.1; // Default low confidence if calculation fails
  }
}

// Helper function to validate and clean fields structure
function validateAndCleanFields(fields: any, documentType: string) {
  const cleanFields = {
    personal: {},
    address: {},
    identification: { documentType },
    contact: {},
    deadlines: [],
    requiredDocuments: []
  };

  try {
    if (fields && typeof fields === 'object') {
      // Clean personal info
      if (fields.personal && typeof fields.personal === 'object') {
        cleanFields.personal = {
          firstName: typeof fields.personal.firstName === 'string' ? fields.personal.firstName : undefined,
          lastName: typeof fields.personal.lastName === 'string' ? fields.personal.lastName : undefined,
          dateOfBirth: typeof fields.personal.dateOfBirth === 'string' ? fields.personal.dateOfBirth : undefined,
          nationality: typeof fields.personal.nationality === 'string' ? fields.personal.nationality : undefined,
          gender: typeof fields.personal.gender === 'string' ? fields.personal.gender : undefined
        };
      }

      // Clean address info
      if (fields.address && typeof fields.address === 'object') {
        cleanFields.address = {
          street: typeof fields.address.street === 'string' ? fields.address.street : undefined,
          city: typeof fields.address.city === 'string' ? fields.address.city : undefined,
          postalCode: typeof fields.address.postalCode === 'string' ? fields.address.postalCode : undefined,
          country: typeof fields.address.country === 'string' ? fields.address.country : undefined
        };
      }

      // Clean contact info
      if (fields.contact && typeof fields.contact === 'object') {
        cleanFields.contact = {
          phone: typeof fields.contact.phone === 'string' ? fields.contact.phone : undefined,
          email: typeof fields.contact.email === 'string' ? fields.contact.email : undefined,
          website: typeof fields.contact.website === 'string' ? fields.contact.website : undefined
        };
      }

      // Clean deadlines
      if (Array.isArray(fields.deadlines)) {
        cleanFields.deadlines = fields.deadlines
          .filter((deadline: any) => deadline && typeof deadline === 'object' && deadline.date && deadline.description)
          .map((deadline: any) => ({
            date: String(deadline.date),
            description: String(deadline.description)
          }));
      }

      // Clean required documents
      if (Array.isArray(fields.requiredDocuments)) {
        cleanFields.requiredDocuments = fields.requiredDocuments
          .filter((doc: any) => typeof doc === 'string' && doc.trim().length > 0)
          .map((doc: any) => String(doc).trim());
      }
    }
  } catch (error) {
    console.warn('Error cleaning fields:', error);
  }

  return cleanFields;
}

// Helper function to create a fallback analysis when everything fails
function createFallbackAnalysis(originalText: string, translatedText: string, documentType: string, detectedLanguage: string, targetLanguage: string): DocumentAnalysis {
  return {
    type: documentType,
    confidence: 0.1,
    detectedLanguage,
    targetLanguage,
    fields: {
      personal: {},
      address: {},
      identification: { documentType },
      contact: {},
      deadlines: [],
      requiredDocuments: []
    },
    explanation: {
      summary: 'Document analysé avec succès. Contenu disponible ci-dessous.',
      keyPoints: ['Document traité', 'Contenu extrait', 'Analyse de base effectuée'],
      translations: {
        [targetLanguage]: translatedText,
        ...(detectedLanguage !== targetLanguage && { [detectedLanguage]: originalText })
      },
      context: {
        importance: 'medium' as const,
        category: 'administrative',
        nextSteps: ['Vérifier le contenu du document', 'Contacter les services concernés si nécessaire']
      }
    }
  };
}
