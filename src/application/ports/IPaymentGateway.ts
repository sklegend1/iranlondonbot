export interface IPaymentGateway {
    /**
     * Process a payment for a given user and amount.
     * Returns true if successful, false otherwise.
     */
    processPayment(userId: number, amount: number, method: string): Promise<boolean>;
  }
  