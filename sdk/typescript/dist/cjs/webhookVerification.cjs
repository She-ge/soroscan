"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Verify SoroScan webhook Ed25519 signatures from the X-Signature header.
 */
const node_crypto_1 = require("node:crypto");
const SIGNATURE_PREFIX = "ed25519=";
function verifyWebhookSignature(payload, signatureHeader, publicKeyBase64) {
    try {
        if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            return false;
        }
        const signature = Buffer.from(signatureHeader.slice(SIGNATURE_PREFIX.length), "base64");
        const rawPublicKey = Buffer.from(publicKeyBase64, "base64");
        const publicKey = (0, node_crypto_1.createPublicKey)({
            key: Buffer.concat([
                Buffer.from("302a300506032b6570032100", "hex"),
                rawPublicKey,
            ]),
            format: "der",
            type: "spki",
        });
        const body = typeof payload === "string" ? Buffer.from(payload) : payload;
        return (0, node_crypto_1.verify)(null, body, publicKey, signature);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=webhookVerification.js.map