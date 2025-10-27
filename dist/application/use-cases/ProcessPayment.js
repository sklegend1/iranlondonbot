"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessPayment = void 0;
class ProcessPayment {
    constructor(paymentGateway) {
        this.paymentGateway = paymentGateway;
    }
    async execute({ userId, amount, method }) {
        return this.paymentGateway.processPayment(userId, amount, method);
    }
}
exports.ProcessPayment = ProcessPayment;
