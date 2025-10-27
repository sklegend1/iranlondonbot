import { IPaymentGateway } from "../ports/IPaymentGateway";

interface ProcessPaymentRequest {
  userId: number;
  amount: number;
  method: string;
}

export class ProcessPayment {
  constructor(private paymentGateway: IPaymentGateway) {}

  async execute({ userId, amount, method }: ProcessPaymentRequest): Promise<boolean> {
    return this.paymentGateway.processPayment(userId, amount, method);
  }
}
