import { PrismaBotSettingRepository } from "../../infrastructure/db/repositories/PrismaBotSettingRepository";

export class BotSettingService {
  constructor(private repo = new PrismaBotSettingRepository()) {}

  async getSettingValue(key: string): Promise<string | null> {
    const s = await this.repo.getValue(key);
    return s ? s.value : null;
  }

  async toggleInviteSetting(updatedBy: number): Promise<string> {
    const current = await this.getSettingValue("invite_enabled");
    const newValue = current === "true" ? "false" : "true";
    await this.repo.upsert("invite_enabled", newValue, updatedBy);
    return newValue;
  }

  async setSetting(key: string, value: string, updatedBy?: number) {
    return this.repo.upsert(key, value, updatedBy);
  }

  async getAll() {
    return this.repo.getAllSettings();
  }
}
