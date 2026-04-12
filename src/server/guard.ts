import { createServerFn } from "@tanstack/react-start";
import { Client, networks } from "~/contracts/xpay/src/index";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";

const NETWORK = networks.testnet;
const RPC_URL = "https://soroban-testnet.stellar.org";
const NATIVE_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/**
 * Build an unsigned init_session transaction XDR on the server.
 */
export const buildInitSessionTx = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { userAddress: string; newLimit: number; agentAddress?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { userAddress, newLimit, agentAddress } = data;

    const client = new Client({
      networkPassphrase: NETWORK.networkPassphrase,
      contractId: NETWORK.contractId,
      rpcUrl: RPC_URL,
      allowHttp: false,
      publicKey: userAddress,
    });

    const stroopsLimit = BigInt(Math.round(newLimit * 10_000_000));

    const tx = await client.init_session({
      user: userAddress,
      agent: agentAddress ?? userAddress,
      token: NATIVE_TOKEN,
      escrow_amount: stroopsLimit,
      limit: stroopsLimit,
      period: BigInt(86400),
      deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 86400),
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
 * Submit a signed transaction XDR to Soroban RPC from the server.
 */
export const submitGuardTx = createServerFn({ method: "POST" })
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

/**
 * Fetch session data from the contract (server-side).
 */
export const fetchGuardSession = createServerFn({ method: "GET" })
  .inputValidator((data: { userAddress: string }) => data)
  .handler(async ({ data }) => {
    // TODO: When get_session is added to the contract client, call it here.
    return {
      success: true as const,
      spentToday: 0,
      dailyLimit: 0,
    };
  });

/**
 * Create or sync a lightweight wallet profile for onboarding and agent automation.
 */
export const upsertWalletProfile = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userAddress: string;
      displayName?: string;
      avatarUrl?: string;
      preferredAgentBudget?: number;
      agentSpendEnabled?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const {
      userAddress,
      displayName = "xPay Wallet",
      avatarUrl = "",
      preferredAgentBudget = 0,
      agentSpendEnabled = true,
    } = data;

    return {
      success: true as const,
      profile: {
        address: userAddress,
        display_name: displayName,
        avatar_url: avatarUrl,
        preferred_agent_budget: preferredAgentBudget.toFixed(4),
        agent_spend_enabled: agentSpendEnabled,
        onboarding_state: "ready",
        wallet_kind: "consumer",
      },
    };
  });

/**
 * Register an AI agent allowance so the wallet can automate payments.
 */
export const registerAgentAutomation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      userAddress: string;
      agentAddress: string;
      monthlyBudgetXlm: number;
      label?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const {
      userAddress,
      agentAddress,
      monthlyBudgetXlm,
      label = "AI Agent",
    } = data;

    const client = new Client({
      networkPassphrase: NETWORK.networkPassphrase,
      contractId: NETWORK.contractId,
      rpcUrl: RPC_URL,
      allowHttp: false,
      publicKey: userAddress,
    });

    const budgetStroops = BigInt(Math.round(monthlyBudgetXlm * 10_000_000));

    const tx = await client.init_session({
      user: userAddress,
      agent: agentAddress,
      token: NATIVE_TOKEN,
      escrow_amount: budgetStroops,
      limit: budgetStroops,
      period: BigInt(30 * 86400),
      deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 86400),
    });

    return {
      success: true as const,
      label,
      agentAddress,
      monthlyBudgetXlm: monthlyBudgetXlm.toFixed(4),
      xdr: tx.built?.toXDR() ?? "",
    };
  });

/**
 * Example onboarding payload for a consumer-first wallet profile.
 */
export const exampleWalletOnboardingProfile = {
  display_name: "xPay Wallet",
  wallet_kind: "consumer",
  onboarding_state: "new",
  agent_spend_enabled: true,
  preferred_agent_budget: "0.0000",
  surfaces: ["home", "guard", "activity", "profile"],
  vibe: "mobile-first, low-friction, wallet-like",
};
