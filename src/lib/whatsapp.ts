import twilio from 'twilio';
import { processMessage } from './chatbot';

const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function handleWhatsAppMessage(body: string, from: string): Promise<void> {
  try {
    // Process message using the chatbot
    const response = await processMessage(body);

    // Send response via WhatsApp
    await client.messages.create({
      body: response,
      from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
      to: from
    });
  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
    throw error;
  }
}