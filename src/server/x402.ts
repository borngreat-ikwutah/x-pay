import { createServerFn } from "@tanstack/react-start";
import { Client, networks } from "~/contracts/xpay/src/index";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";

const NETWORK = networks.testnet;
const RPC_URL = "https://soroban-testnet.stellar.org";
const NATIVE_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/**
 * Build an unsigned pay_service transaction XDR for x402 payments.
 * The agent acts as the source and authorizes the payment from the user's escrowed limit.
 */
export const buildX402PaymentTx = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userAddress: string;
      agentAddress: string;
      destination: string;
      amountXlm: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { userAddress, agentAddress, destination, amountXlm } = data;

    const client = new Client({
      networkPassphrase: NETWORK.networkPassphrase,
      contractId: NETWORK.contractId,
      rpcUrl: RPC_URL,
      allowHttp: false,
      publicKey: agentAddress, // Agent initiates and signs the pay_service call
    });

    const stroopsAmount = BigInt(Math.round(amountXlm * 10_000_000));

    const tx = await client.pay_service({
      agent: agentAddress,
      user: userAddress,
      destination,
      amount: stroopsAmount,
    });

    if (tx.simulation && "error" in tx.simulation && tx.simulation.error) {
      return {
        success: false as const,
        error: `Simulation failed: ${JSON.stringify(tx.simulation.error)}`,
        xdr: "",
      };
    }

    return {
      success: true as const,
      error: "",
      xdr: tx.built!.toXDR(),
    };
  });

/**
 * Submit the signed x402 transaction XDR to the Soroban RPC.
 */
export const submitX402Tx = createServerFn({ method: "POST" })
  .inputValidator((data: { signedXdr: string }) => data)
  .handler(async ({ data }) => {
    const { signedXdr } = data;

    const server = new rpc.Server(RPC_URL);
    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);

    const response = await server.sendTransaction(tx);

    if (response.status === "ERROR") {
      return {
        success: false as const,
        error: `Submission failed: ${JSON.stringify(response.errorResult)}`,
        hash: "",
        status: response.status,
      };
    }

    return {
      success: true as const,
      error: "",
      hash: response.hash,
      status: response.status,
    };
  });

// --- Native Stellar x402 AI Agent ---

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimits = new Map<string, number[]>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(identifier) || [];
  const validTimestamps = timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimits.set(identifier, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimits.set(identifier, validTimestamps);
  return true;
}

/**
 * Fulfills an AI query after verifying the Soroban payment transaction.
 * Incorporates rate limiting by userAddress.
 */
export const queryNativeAgent = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { query: string; paymentTxHash: string; userAddress: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { query, paymentTxHash, userAddress } = data;

    // 1. Rate Limiting
    if (!checkRateLimit(userAddress)) {
      throw new Error("Rate limit exceeded. Maximum 5 requests per minute.");
    }

    // 2. Verify Payment on Stellar
    const server = new rpc.Server(RPC_URL);
    try {
      const txDetails = await server.getTransaction(paymentTxHash);
      if (txDetails.status !== "SUCCESS") {
        throw new Error("Transaction is not successful yet.");
      }
      // Note: In production, decode txDetails.envelopeXdr here to ensure
      // destination contract and amount matches the 0.001 XLM x402 price.
    } catch (err: any) {
      throw new Error("Invalid or unverified x402 payment proof.");
    }

    // 3. AI Execution (Using Gemini API natively via fetch to avoid extra dependencies)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback if no API key is provided in .env
      return {
        success: true,
        answer: `Mock AI Response for: "${query}". (Payment verified! Set GEMINI_API_KEY to enable real LLM responses).`,
      };
    }

    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a specialized crypto data agent. Answer this query concisely: ${query}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!aiRes.ok) {
        throw new Error("AI provider returned an error.");
      }

      const aiData = await aiRes.json();
      const answer =
        aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated.";

      return { success: true, answer };
    } catch (error: any) {
      throw new Error(
        `AI Agent failed to process the request: ${error.message}`,
      );
    }
  });
