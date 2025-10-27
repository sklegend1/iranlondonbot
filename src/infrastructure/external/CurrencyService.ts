import axios from "axios";

export interface CurrencyData {
  gold: any[];
  currency: any[];
  cryptocurrency: any[];
}

export class CurrencyService {
  constructor(private apiUrl: string) {}

  async fetchData(): Promise<CurrencyData> {
    const res = await axios.get(this.apiUrl);
    return res.data;
  }
}
