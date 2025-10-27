"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakePaymentGateway = void 0;
class FakePaymentGateway {
    async processPayment(userId, amount, method) {
        console.log(`💳 [FAKE PAYMENT] user=${userId}, amount=${amount}, method=${method}`);
        // simulate a fake delay
        await new Promise((r) => setTimeout(r, 1000));
        return true; // always succeed
    }
}
exports.FakePaymentGateway = FakePaymentGateway;
