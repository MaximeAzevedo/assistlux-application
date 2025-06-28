import { AzureOpenAI } from 'openai';
import { databaseService } from './supabase/database';
import { detectLanguage, translateText } from './translation';
import { azureOpenAIClient, DEPLOYMENT_NAME } from './openaiConfig';
import { aiService } from './aiService';
import { KnowledgeBaseService } from './knowledgeBase';
import { searchSocialServices, formatServicesForChat, analyzeQuery } from './socialServiceSearch';

interface ChatContext {
  userId?: string;
  language?: string;
  previousMessages?: Array<{ role: string; content: string }>;
}

export async function processMessage(message: string, userId?: string): Promise<string> {
  try {
    // Get user context if available
    const context = await getUserContext(userId);
    
    // If message is empty, return initial greeting in user's preferred language
    if (!message) {
      const greeting = await getInitialGreeting(context.language || 'fr');
      return greeting;
    }

    // Detect message language
    const detectedLanguage = await detectLanguage(message);
    
    // 🎯 RECHERCHE SIMPLE ET DIRECTE dans les services sociaux
    const servicesInfo = await searchServices(message);
    
    // Si on trouve des services, les retourner directement
    if (servicesInfo.hasResults) {
      const formattedResponse = formatSimpleResponse(servicesInfo.response, message);
      
      // Store conversation if user is authenticated
      if (userId) {
        await storeConversation(userId, message, formattedResponse);
      }
      
      return formattedResponse;
    }
    
    // Sinon, utiliser l'IA pour une réponse générale
    const systemMessage = await prepareSystemMessage(context);
    
    const reply = await aiService.processChat(
      message,
      systemMessage,
      context.previousMessages || []
    );

    const formattedReply = formatResponse(reply);

    // Store conversation in Firebase if user is authenticated
    if (userId) {
      await storeConversation(userId, message, formattedReply);
    }

    // Translate response if needed
    if (detectedLanguage !== 'fr') {
      return await translateText(formattedReply, detectedLanguage);
    }

    return formattedReply;
  } catch (error) {
    console.error('Error processing message:', error);
    throw new Error('Failed to process message');
  }
}

/**
 * 🎯 RECHERCHE SIMPLE ET DIRECTE
 */
async function searchServices(message: string): Promise<{hasResults: boolean, response: string}> {
  try {
    // Analyser la requête pour détecter les mots-clés
    const analysis = analyzeQuery(message);
    const lowerMessage = message.toLowerCase();
    
    // Mots-clés pour l'aide alimentaire
    const foodKeywords = [
      'manger', 'nourriture', 'alimentation', 'alimentaire', 'faim', 'repas',
      'épicerie', 'buttek', 'restaurant social', 'banque alimentaire',
      'gratuit', 'pas cher', 'aide', 'courses', 'colis'
    ];
    
    // Mots-clés pour l'hébergement
    const housingKeywords = [
      'dormir', 'hébergement', 'logement', 'sans abri', 'toit',
      'nuit', 'urgence', 'hiver', 'wak', 'wanteraktioun'
    ];
    
    // Mots-clés pour les vêtements
    const clothingKeywords = [
      'vêtements', 'habits', 'kleederstuff', 'vestiaire', 'fringues'
    ];
    
    let searchQuery = '';
    let hasRelevantKeywords = false;
    
    // Détecter le type de besoin
    if (foodKeywords.some(keyword => lowerMessage.includes(keyword))) {
      searchQuery = 'alimentation épicerie restaurant social';
      hasRelevantKeywords = true;
    } else if (housingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      searchQuery = 'hébergement aide hivernale urgence';
      hasRelevantKeywords = true;
    } else if (clothingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      searchQuery = 'vêtements vestiaire kleederstuff';
      hasRelevantKeywords = true;
    }
    
    // Si on a des mots-clés pertinents, faire la recherche
    if (hasRelevantKeywords) {
      const searchResult = await searchSocialServices(searchQuery, 5);
      
      if (searchResult.services.length > 0) {
        const formattedServices = formatServicesForChat(searchResult.services);
        return {
          hasResults: true,
          response: formattedServices
        };
      }
    }
    
    return { hasResults: false, response: '' };
    
  } catch (error) {
    console.warn('Erreur recherche services:', error);
    return { hasResults: false, response: '' };
  }
}

/**
 * 🎨 Format simple et direct pour les réponses
 */
function formatSimpleResponse(servicesResponse: string, originalMessage: string): string {
  const lowerMessage = originalMessage.toLowerCase();
  
  let intro = "Voici les services qui peuvent vous aider :\n\n";
  
  // Personnaliser l'intro selon le besoin
  if (lowerMessage.includes('manger') || lowerMessage.includes('alimentation')) {
    intro = "🍽️ **Pour l'aide alimentaire, voici où vous pouvez vous adresser :**\n\n";
  } else if (lowerMessage.includes('dormir') || lowerMessage.includes('hébergement')) {
    intro = "🏠 **Pour l'hébergement d'urgence, voici les solutions :**\n\n";
  } else if (lowerMessage.includes('vêtements')) {
    intro = "👕 **Pour les vêtements, voici les vestiaires sociaux :**\n\n";
  }
  
  return intro + servicesResponse + "\n\n💡 **Conseil :** Appelez avant de vous déplacer pour vérifier les horaires et disponibilités.";
}

async function getInitialGreeting(language: string): Promise<string> {
  const greetings: { [key: string]: string } = {
    fr: "👋 **Bonjour !** Je suis votre assistant social virtuel.\n\n🎯 **Je peux vous aider à trouver rapidement :**\n• 🍽️ Aide alimentaire (épiceries sociales, restaurants sociaux)\n• 🏠 Hébergement d'urgence\n• 👕 Vestiaires sociaux\n• 📋 Informations sur les démarches administratives\n\n**Comment puis-je vous aider aujourd'hui ?**",
    en: "👋 **Hello!** I'm your virtual social assistant.\n\n🎯 **I can quickly help you find:**\n• 🍽️ Food assistance (social grocery stores, social restaurants)\n• 🏠 Emergency housing\n• 👕 Social clothing stores\n• 📋 Information on administrative procedures\n\n**How can I help you today?**"
  };

  return greetings[language] || greetings.fr;
}

function formatResponse(text: string): string {
  // Garder simple, juste ajouter quelques emojis pertinents
  let formattedText = text;
  
  // Add emoji based on content
  if (text.toLowerCase().includes('aide') || text.toLowerCase().includes('assistance')) {
    formattedText = '💡 ' + formattedText;
  }
  
  if (text.toLowerCase().includes('luxembourg')) {
    formattedText = '🇱🇺 ' + formattedText;
  }

  return formattedText;
}

async function getUserContext(userId?: string): Promise<ChatContext> {
  if (!userId) return {};

  try {
    const userPreferences = await databaseService.getUserPreferences(userId);
    const recentMessages = await getRecentMessages(userId);
    
    return {
      userId,
      language: userPreferences?.preferred || 'fr',
      previousMessages: recentMessages
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return { userId };
  }
}

async function prepareSystemMessage(context: ChatContext, knowledgeContext: string = ''): Promise<string> {
  const basePrompt = `You are a professional virtual social assistant working in Luxembourg, specialized in helping users with administrative, social, and practical questions.

### STRICT INSTRUCTIONS:
- Always reply clearly and precisely, never vaguely or generally.
- Directly address the user's request with actionable information.
- Suggest specific internal tools proactively:
  - Document scanner: Available on our site to analyze, summarize, and translate administrative documents.
  - Interactive Map: Available on our site to quickly locate hospitals, social services, housing, and other useful services.
  - Dedicated informative pages on our site for administrative processes.

### 🆕 KNOWLEDGE BASE INTEGRATION:
- You now have access to an updated knowledge base with specific information about Luxembourg social services.
- When knowledge base information is provided, use it as your PRIMARY source for accurate, detailed responses.
- Always prioritize knowledge base information over general knowledge.
- If knowledge base information is incomplete, clearly state what additional information might be needed.

### HANDLING SPECIFIC QUESTIONS:
- For questions about hospitals, ALWAYS proactively suggest the Interactive Map available on our site, and clearly explain how to use it to find the nearest hospital or medical service.
- For questions about scanning or understanding documents, ALWAYS directly guide users to our Document Scanner on our site, clearly explaining its purpose and benefits.
- For any administrative procedures (REVIS, housing, healthcare access, regularization, children's education, employment, etc.), ALWAYS provide precise steps clearly structured and include direct links to the relevant page on our site or official websites (Guichet.lu, ASTI, etc.).

### WHEN IN DOUBT OR UNCERTAIN:
- Explicitly inform users that you cannot provide a certain answer.
- Clearly suggest contacting a real social worker or official service, providing direct links or contact information whenever possible.

### COMMUNICATION STYLE:
- Always respectful, warm, and empathetic.
- Use short, well-structured paragraphs.
- Always respond directly in the user's preferred language stored in their profile (do not mention it explicitly).

${knowledgeContext ? `

${knowledgeContext}

⚠️ USE THE ABOVE KNOWLEDGE BASE INFORMATION AS YOUR PRIMARY SOURCE FOR THIS RESPONSE.` : ''}

Remember: Users depend on you for clear and practical guidance, NEVER answer vaguely.`;

  // Translate system prompt if user has a different preferred language
  if (context.language && context.language !== 'fr' && context.language !== 'en') {
    return await translateText(basePrompt, context.language);
  }

  return basePrompt;
}

async function getRecentMessages(userId: string): Promise<Array<{ role: string; content: string }>> {
  try {
    const conversations = await databaseService.getConversationHistory(userId, 5);
    return conversations.map(conv => [
      { role: 'user', content: conv.user_message },
      { role: 'assistant', content: conv.bot_response }
    ]).flat();
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

async function storeConversation(userId: string, userMessage: string, botResponse: string) {
  try {
    await databaseService.saveConversation(userId, userMessage, botResponse);
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
}