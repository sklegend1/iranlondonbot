import axios from "axios";
import { parse } from "path";
import { text } from "stream/consumers";

export class TelegramService {
  private token: string;
  private baseUrl: string;
  private channelId: string;

  constructor(token: string, channelId: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.channelId = channelId;
  }

  // Send an ad post
  async sendAd(content: string, imageUrl?: string | null): Promise<number> {
    //console.log("Sending ad to Telegram:", { content, imageUrl });
    
    try {
        
      const res = await axios.post(`${this.baseUrl}/sendPhoto`, {
        chat_id: this.channelId,
        photo: imageUrl,
        caption: content ,
        //parse_mode: "MarkdownV2",
      });
      return res.data.result.message_id;
    } catch (err: any) {
      console.error("Failed to send ad:", err.message);
      throw err;
    }
  }
  // Send an ad post
  async sendText(content: string): Promise<number> {
    //console.log("Sending ad to Telegram:", { content, imageUrl });
    try {
        
      const res = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        text: content,
        parse_mode: "Markdown",
      });
      return res.data.result.message_id;
    } catch (err: any) {
      console.error("Failed to send text:", err.message);
      throw err;
    }
  }

  // Delete an ad post by message_id
  async deleteAd(messageId: number): Promise<void> {
    try {
      const res = await axios.post(`${this.baseUrl}/deleteMessage`, {
        chat_id: this.channelId,
        message_id: messageId,
      });
      console.log("Delete response:", res.data);
    } catch (err: any) {
      console.error("Failed to delete ad:", err.message);
    }
  }
}
