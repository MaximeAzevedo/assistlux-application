import ReconnectingWebSocket from 'reconnecting-websocket';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

class N8nChatClient {
  private baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv779498.hstgr.cloud/webhook/17e272b8-90e4-41ce-a0ef-db068ed5726b';
  private auth = {
    username: import.meta.env.VITE_N8N_USERNAME || '',
    password: import.meta.env.VITE_N8N_PASSWORD || ''
  };
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];

  async connect(userId?: string) {
    console.log('Connected to n8n chat');
  }

  async sendMessage(text: string, userId?: string) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.auth.username}:${this.auth.password}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          userId: userId || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Create bot response message
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data.response || "Je suis désolé, je ne peux pas répondre pour le moment.",
        sender: 'bot',
        timestamp: new Date()
      };

      // Notify subscribers
      this.messageCallbacks.forEach(callback => callback(botMessage));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    console.log('Disconnected from n8n chat');
    this.messageCallbacks = [];
  }
}

const n8nChat = new N8nChatClient();
export default n8nChat;