"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotSettingService = void 0;
const PrismaBotSettingRepository_1 = require("../../infrastructure/db/repositories/PrismaBotSettingRepository");
class BotSettingService {
    constructor(repo = new PrismaBotSettingRepository_1.PrismaBotSettingRepository()) {
        this.repo = repo;
    }
    async getSettingValue(key) {
        const s = await this.repo.getValue(key);
        return s ? s.value : null;
    }
    async toggleInviteSetting(updatedBy) {
        const current = await this.getSettingValue("invite_enabled");
        const newValue = current === "true" ? "false" : "true";
        await this.repo.upsert("invite_enabled", newValue, updatedBy);
        return newValue;
    }
    async setSetting(key, value, updatedBy) {
        return this.repo.upsert(key, value, updatedBy);
    }
    async getAll() {
        return this.repo.getAllSettings();
    }
}
exports.BotSettingService = BotSettingService;
