import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileLayout } from "~/components/mobile-layout";
import { useWalletStore } from "~/stores/use-wallet";
import { useGuardStore } from "~/stores/use-guard";
import {
  Compass,
  ShoppingCart,
  Cpu,
  Lightning,
  CaretRight,
} from "@phosphor-icons/react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import { getSupabaseClient } from "~/lib/supabase/client";
import {
  buildX402PaymentTx,
  submitX402Tx,
  queryNativeAgent,
} from "~/server/x402";
import freighterApi from "@stellar/freighter-api";

const { signTransaction } = freighterApi;
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const Route = createFileRoute("/(public)/_public/discover")({
  component: DiscoverPage,
});

type BazaarItem = {
  id: string;
  source: string;
  name: string;
  description: string;
  price: number;
  destination: string;
  icon: React.ReactNode;
  color: string;
};

function DiscoverPage() {
  const { address } = useWalletStore();
  const guard = useGuardStore();
  const { approvedAgents } = guard;

  const [bazaarItems, setBazaarItems] = useState<BazaarItem[]>([]);
  const [isFetchingBazaar, setIsFetchingBazaar] = useState(true);

  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [isFetchingAgents, setIsFetchingAgents] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    title: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    async function fetchBazaar() {
      try {
        const res = await fetch(
          "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources",
        );
        const data = await res.json();
        const items = (data.items || [])
          .slice(0, 10)
          .map((item: any, i: number) => {
            const accept = item.accepts?.[0] || {};
            const priceStr = accept.maxAmountRequired || "10000";
            const price = parseInt(priceStr) / 10000000;
            let name = "x402 Agent";
            try {
              const resourceUrl = new URL(item.resource);
              name = resourceUrl.pathname.split("/").pop() || "x402 Agent";
            } catch (e) {
              // fallback
            }

            return {
              id: item.resource || `item-${i}`,
              source: accept.network || "x402 Bazaar",
              name: name.replace(/[-_]/g, " "),
              description: accept.description || item.resource,
              price: price > 0 ? price : 0.001,
              destination:
                accept.payTo ||
                "GBR5R4KX4KXPQ275M2C2B22O6V5T2J3U7T26MIF7HQJQQHTQZ2D252T5",
              icon: (
                <Cpu weight="duotone" className="w-6 h-6 text-indigo-500" />
              ),
              color: "bg-indigo-500/10",
            };
          });
        setBazaarItems(items);
      } catch (err) {
        console.error("Failed to fetch bazaar items", err);
      } finally {
        setIsFetchingBazaar(false);
      }
    }
    fetchBazaar();
  }, []);

  // Fetch real agents from Supabase
  useEffect(() => {
    if (!address) return;

    const fetchAgents = async () => {
      setIsFetchingAgents(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("owner_wallet_address", address)
          .eq("is_active", true);

        if (error) throw error;

        if (data) {
          guard.setAgents(
            data.map((a) => ({
              id: a.agent_wallet_address,
              name: a.label,
              icon: a.icon || "🤖",
              allowance: Number(a.monthly_budget_xlm),
              spent: Number(a.spent_xlm || 0),
              address: a.agent_wallet_address,
            })),
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch agents:", err);
      } finally {
        setIsFetchingAgents(false);
      }
    };

    void fetchAgents();
  }, [address]);

  const handlex402Request = async (
    itemId: string,
    itemName: string,
    price: number,
    destination: string,
  ) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (approvedAgents.length === 0) {
      toast.error("No active agents. Please register an agent in Guard first.");
      return;
    }

    // Use the first active agent
    const agent = approvedAgents[0];
    if (!agent.address) {
      toast.error("Agent does not have a valid address");
      return;
    }

    setIsRequesting(itemId);

    try {
      // 1. Build the x402 pay_service transaction
      const buildResult = await buildX402PaymentTx({
        data: {
          userAddress: address,
          agentAddress: agent.address,
          destination: destination,
          amountXlm: price,
        },
      });

      if (!buildResult.success || !buildResult.xdr) {
        throw new Error(buildResult.error || "Failed to build x402 payment tx");
      }

      // 2. Sign the transaction (in a real fully-automated flow the agent server would sign this with its secret key,
      // but here we sign via Freighter for demonstration/client side integration as the connected agent/user)
      const signResult = await signTransaction(buildResult.xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult.error || !signResult.signedTxXdr) {
        throw new Error(signResult.error || "Transaction signing failed");
      }

      // 3. Submit the transaction
      const submitResult = await submitX402Tx({
        data: { signedXdr: signResult.signedTxXdr },
      });

      if (!submitResult.success) {
        throw new Error(submitResult.error || "Transaction submission failed");
      }

      // 4. Record the spending in Supabase
      const newSpent = agent.spent + price;
      const supabase = getSupabaseClient();
      await supabase
        .from("agents")
        .update({ spent_xlm: newSpent })
        .eq("owner_wallet_address", address)
        .eq("agent_wallet_address", agent.address);

      // 5. Update local store
      guard.addAgent({
        ...agent,
        spent: newSpent,
      });

      // 6. Execute Native AI Agent
      const aiResult = await queryNativeAgent({
        data: {
          query: `Give me a concise update regarding ${itemName}`,
          paymentTxHash: submitResult.hash,
          userAddress: address,
        },
      });

      setAiResponse({
        title: `${itemName} Response`,
        content: aiResult.answer || "No response generated.",
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">x402 Payment Successful</span>
          <span className="text-xs">
            Agent automatically paid {price} XLM for {itemName}
          </span>
        </div>,
      );
    } catch (err: any) {
      console.error("x402 request error:", err);
      toast.error(err?.message || "Failed to complete x402 request");
    } finally {
      setIsRequesting(null);
    }
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            x402 Marketplace
          </p>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Compass weight="bold" className="w-6 h-6" />
            Discover
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse automated services from Arcana and Stellar Bazaar.
          </p>
        </div>

        {/* Active Agents Status */}
        <div className="rounded-2xl bg-card/60 border border-border/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">
              Available Agents
            </p>
            {isFetchingAgents ? (
              <p className="text-xs text-muted-foreground animate-pulse">
                Syncing...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {approvedAgents.length} agents ready to pay x402 invoices
              </p>
            )}
          </div>
          <div className="flex -space-x-2">
            {approvedAgents.slice(0, 3).map((agent, i) => (
              <div
                key={agent.id}
                className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs z-10"
                style={{ zIndex: 10 - i }}
              >
                {agent.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground pl-1">
            Featured Services
          </h2>

          <div className="grid gap-3">
            {isFetchingBazaar ? (
              <div className="py-10 flex flex-col items-center justify-center text-muted-foreground">
                <Spinner className="w-6 h-6 mb-2" />
                <span className="text-xs">Loading marketplace...</span>
              </div>
            ) : (
              bazaarItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-card/60 border border-border/50 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                        {item.source}
                      </p>
                      <p className="text-sm font-bold text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <p className="text-sm font-bold">
                      {item.price} XLM{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        /req
                      </span>
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-lg text-xs font-bold px-3"
                      onClick={() =>
                        handlex402Request(
                          item.id,
                          item.name,
                          item.price,
                          item.destination,
                        )
                      }
                      disabled={
                        isRequesting === item.id ||
                        approvedAgents.length === 0 ||
                        isFetchingAgents
                      }
                    >
                      {isRequesting === item.id ? (
                        <>
                          <Spinner className="w-3 h-3 mr-1.5" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Request
                          <CaretRight weight="bold" className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Response Modal Overlay */}
      {aiResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu weight="duotone" className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">{aiResponse.title}</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {aiResponse.content}
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => setAiResponse(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
