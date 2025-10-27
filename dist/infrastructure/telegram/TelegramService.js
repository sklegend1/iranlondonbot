"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const axios_1 = __importDefault(require("axios"));
class TelegramService {
    constructor(token, channelId) {
        this.token = token;
        this.baseUrl = `https://api.telegram.org/bot${token}`;
        this.channelId = channelId;
    }
    // Send an ad post
    async sendAd(content, imageUrl) {
        //console.log("Sending ad to Telegram:", { content, imageUrl });
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/sendPhoto`, {
                chat_id: this.channelId,
                photo: imageUrl,
                caption: content,
                //parse_mode: "MarkdownV2",
            });
            return res.data.result.message_id;
        }
        catch (err) {
            console.error("Failed to send ad:", err.message);
            throw err;
        }
    }
    // Send an ad post
    async sendText(content) {
        //console.log("Sending ad to Telegram:", { content, imageUrl });
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.channelId,
                text: content,
                parse_mode: "Markdown",
            });
            return res.data.result.message_id;
        }
        catch (err) {
            console.error("Failed to send text:", err.message);
            throw err;
        }
    }
    // Delete an ad post by message_id
    async deleteAd(messageId) {
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/deleteMessage`, {
                chat_id: this.channelId,
                message_id: messageId,
            });
            console.log("Delete response:", res.data);
        }
        catch (err) {
            console.error("Failed to delete ad:", err.message);
        }
    }
}
exports.TelegramService = TelegramService;
