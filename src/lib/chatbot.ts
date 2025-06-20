import { AzureOpenAI } from 'openai';
import { databaseService } from './supabase/database';
import { detectLanguage, translateText } from './translation';
import { azureOpenAIClient, DEPLOYMENT_NAME } from './openaiConfig';
import { aiService } from './aiService';

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
    
    // Prepare system message with context
    const systemMessage = await prepareSystemMessage(context);
    
    // Utiliser aiService au lieu d'appels directs
    const reply = await aiService.processChat(
      message,
      systemMessage,
      context.previousMessages || []
    );

    // Add friendly emojis and formatting
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

async function getInitialGreeting(language: string): Promise<string> {
  const greetings: { [key: string]: string } = {
    fr: "👋 Bonjour ! Je suis votre assistant social virtuel, là pour vous aider avec vos démarches administratives et sociales au Luxembourg. Comment puis-je vous aider aujourd'hui ? 😊",
    en: "👋 Hello! I'm your virtual social worker, here to help you with administrative and social procedures in Luxembourg. How can I assist you today? 😊",
    de: "👋 Guten Tag! Ich bin Ihr virtueller Sozialarbeiter und helfe Ihnen bei Verwaltungs- und Sozialverfahren in Luxemburg. Wie kann ich Ihnen heute helfen? 😊",
    pt: "👋 Olá! Sou seu assistente social virtual, aqui para ajudar com procedimentos administrativos e sociais em Luxemburgo. Como posso ajudar você hoje? 😊",
    ar: "👋 مرحباً! أنا المساعد الاجتماعي الافتراضي الخاص بك، هنا لمساعدتك في الإجراءات الإدارية والاجتماعية في لوكسمبورغ. كيف يمكنني مساعدتك اليوم؟ 😊",
    lb: "👋 Moien! Ech sinn Äre virtuelle Sozialberoder a sinn do fir Iech bei administrative a soziale Prozeduren zu Lëtzebuerg ze hëllefen. Wéi kann ech Iech haut hëllefen? 😊"
  };

  return greetings[language] || greetings.fr;
}

function formatResponse(text: string): string {
  // Add appropriate emojis based on content
  let formattedText = text;
  
  // Add emoji for document-related content
  if (text.toLowerCase().includes('document') || text.toLowerCase().includes('formulaire')) {
    formattedText = '📄 ' + formattedText;
  }
  
  // Add emoji for help-related content
  if (text.toLowerCase().includes('aide') || text.toLowerCase().includes('assistance')) {
    formattedText = '💡 ' + formattedText;
  }
  
  // Add emoji for location-related content
  if (text.toLowerCase().includes('luxembourg')) {
    formattedText = '🇱🇺 ' + formattedText;
  }

  // Add emoji for financial assistance
  if (text.toLowerCase().includes('revis') || text.toLowerCase().includes('allocation')) {
    formattedText = '💶 ' + formattedText;
  }

  // Add emoji for housing
  if (text.toLowerCase().includes('logement') || text.toLowerCase().includes('hébergement')) {
    formattedText = '🏠 ' + formattedText;
  }

  // Add emoji for health
  if (text.toLowerCase().includes('santé') || text.toLowerCase().includes('médical')) {
    formattedText = '🏥 ' + formattedText;
  }

  // Add friendly closing if not present
  if (!formattedText.includes('😊')) {
    formattedText += ' 😊';
  }

  // Break long paragraphs into smaller chunks
  formattedText = formattedText.replace(/([.!?])\s+/g, '$1\n\n');

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

async function prepareSystemMessage(context: ChatContext): Promise<string> {
  const basePrompt = `You are a professional virtual social assistant working in Luxembourg, specialized in helping users with administrative, social, and practical questions.

### STRICT INSTRUCTIONS:
- Always reply clearly and precisely, never vaguely or generally.
- Directly address the user's request with actionable information.
- Suggest specific internal tools proactively:
  - Document scanner: Available on our site to analyze, summarize, and translate administrative documents.
  - Interactive Map: Available on our site to quickly locate hospitals, social services, housing, and other useful services.
  - Dedicated informative pages on our site for administrative processes.

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