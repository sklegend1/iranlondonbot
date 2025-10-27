import { IPaymentGateway } from "../../application/ports/IPaymentGateway";

export class FakePaymentGateway implements IPaymentGateway {
  async processPayment(userId: number, amount: number, method: string): Promise<boolean> {
    console.log(`💳 [FAKE PAYMENT] user=${userId}, amount=${amount}, method=${method}`);
    // simulate a fake delay
    await new Promise((r) => setTimeout(r, 1000));
    return true; // always succeed
  }
}
