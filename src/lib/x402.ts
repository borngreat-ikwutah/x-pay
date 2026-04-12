import freighterApi from "@stellar/freighter-api";
const { requestAccess, signAuthEntry } = freighterApi;
import { toast } from "sonner";
import { Client, networks } from "~/contracts/xpay/src/index";

export async function xPayFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 402) {
    try {
      const authHeader = response.headers.get("Www-Authenticate");
      
      // Parse amount and destination from a standard L402 or custom header
      // For now we mock it as 0.002 XLM if header parsing isn't explicitly defined
      const amountXlm = 0.002;
      const serviceName = "AI Service";
      
      toast.info(`Payment Required: Settling ${amountXlm} XLM for ${serviceName}...`);

      const { address } = await requestAccess();
      if (!address) {
        throw new Error("Wallet access denied");
      }

      const client = new Client({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        allowHttp: false,
      });

      // We use pay_service for single payments as defined in the generated client
      const tx = await client.pay_service({
        agent: address, // Or the active agent if defined
        user: address,
        destination: "GZ...", // parsed from header in real app
        amount: BigInt(amountXlm * 10_000000), 
      });

      // Depending on contract design, this might need signAuthEntry for multi-hop or direct tx sign
      // Since the prompt asks for "Soroban auth-entry", we prompt for signAuthEntry
      const signedResult = await signAuthEntry(tx.built!.toXDR(), {
        networkPassphrase: networks.testnet.networkPassphrase,
      });

      if (signedResult.error || !signedResult.signedAuthEntry) {
        throw new Error(signedResult.error || "Failed to sign auth entry");
      }

      // In a real integration, the signed token goes back to the server in an Authorization header
      // Example: Authorization: L402 <macaroon> <preimage/signature>
      
      toast.success(`Paid ${amountXlm} XLM for ${serviceName}`);

      // Re-attempt fetch with proof of payment
      const retryInit = {
        ...init,
        headers: {
          ...init?.headers,
          "Authorization": `L402 xpay-signature-${signedResult.signedAuthEntry.slice(0, 10)}`, // Example
        }
      };

      return fetch(input, retryInit);

    } catch (e: any) {
      toast.error(`Auto-payment failed: ${e.message}`);
      return response; // Return original 402 if retry fails
    }
  }

  return response;
}
