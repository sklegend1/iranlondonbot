"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const axios_1 = __importDefault(require("axios"));
class CurrencyService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }
    async fetchData() {
        const res = await axios_1.default.get(this.apiUrl);
        return res.data;
    }
}
exports.CurrencyService = CurrencyService;
