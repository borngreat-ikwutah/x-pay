import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileLayout } from "~/components/mobile-layout";
import { useWalletStore } from "~/stores/use-wallet";
import { useGuardStore } from "~/stores/use-guard";
import { GuardHero } from "~/components/guard/guard-hero";
import { DailyAllowance } from "~/components/guard/daily-allowance";
import { ApprovedAgents } from "~/components/guard/approved-agents";
import {
  KillSwitchButton,
  KillSwitchDialog,
} from "~/components/guard/kill-switch-dialog";
import {
  buildInitSessionTx,
  registerAgentAutomation,
  submitGuardTx,
  upsertWalletProfile,
} from "~/server/guard";
import { toast } from "sonner";
import freighterApi from "@stellar/freighter-api";
import { Spinner } from "~/components/ui/spinner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Robot, Sparkle, UserCircle } from "@phosphor-icons/react";
import { getSupabaseClient } from "~/lib/supabase/client";

const { signTransaction } = freighterApi;

export const Route = createFileRoute("/(public)/_public/guard")({
  component: GuardPage,
});

const CONTRACT_ID = "CD6G6FF2NTMK4XHXPYQNTGR5FRSHPURIPIPOUZDT37OBHLUWPGXFU35W";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

function GuardPage() {
  const { address } = useWalletStore();
  const guard = useGuardStore();

  const [killOpen, setKillOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isFetchingAgents, setIsFetchingAgents] = useState(false);

  const [agentAddress, setAgentAddress] = useState("");
  const [agentLabel, setAgentLabel] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("0.2500");
  const [displayName, setDisplayName] = useState("xPay Wallet");

  const spentToday = useMemo(
    () => guard.approvedAgents.reduce((s, a) => s + a.spent, 0),
    [guard.approvedAgents],
  );

  // Fetch agents from Supabase on mount
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
        toast.error("Failed to load approved agents");
      } finally {
        setIsFetchingAgents(false);
      }
    };

    void fetchAgents();
  }, [address]); // Only re-run when address changes

  const handleToggle = () => {
    guard.toggleGuard();
    toast.success(guard.isActive ? "Guard paused" : "Guard activated");
  };

  const handleKill = async () => {
    if (!address) return;
    try {
      const supabase = getSupabaseClient();
      // Deactivate all agents for this user in Supabase
      await supabase
        .from("agents")
        .update({ is_active: false })
        .eq("owner_wallet_address", address);

      guard.killSwitch();
      setKillOpen(false);
      toast.error("Emergency kill switch activated. All agents revoked.");
    } catch (err) {
      console.error("Kill switch error:", err);
      toast.error("Failed to revoke agents in database.");
    }
  };

  const handleUpdateLimit = async (newLimit: number) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setIsUpdating(true);

    try {
      const buildResult = await buildInitSessionTx({
        data: { userAddress: address, newLimit },
      });

      if (!buildResult.success || !buildResult.xdr) {
        throw new Error(
          buildResult.error || "Failed to build limit transaction",
        );
      }

      const signResult = await signTransaction(buildResult.xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult.error || !signResult.signedTxXdr) {
        throw new Error(signResult.error || "Transaction signing failed");
      }

      const submitResult = await submitGuardTx({
        data: { signedXdr: signResult.signedTxXdr },
      });

      if (!submitResult.success) {
        throw new Error(submitResult.error || "Transaction submission failed");
      }

      guard.setDailyLimit(newLimit);
      toast.success(`Daily limit updated to ${newLimit.toFixed(4)} XLM`);
    } catch (e: any) {
      console.error("updateLimit error:", e);
      toast.error(e?.message || "Failed to update limit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegisterAgent = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    const normalizedAgentAddress = agentAddress.trim();
    const budget = Number(monthlyBudget);

    if (!normalizedAgentAddress) {
      toast.error("Enter an agent public key");
      return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      toast.error("Enter a valid monthly budget");
      return;
    }

    setIsRegisteringAgent(true);

    try {
      const registerResult = await registerAgentAutomation({
        data: {
          userAddress: address,
          agentAddress: normalizedAgentAddress,
          monthlyBudgetXlm: budget,
          label: agentLabel.trim() || "AI Agent",
        },
      });

      if (!registerResult.success || !registerResult.xdr) {
        throw new Error("Failed to build agent registration transaction");
      }

      const signResult = await signTransaction(registerResult.xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (signResult.error || !signResult.signedTxXdr) {
        throw new Error(signResult.error || "Transaction signing failed");
      }

      const submitResult = await submitGuardTx({
        data: { signedXdr: signResult.signedTxXdr },
      });

      if (!submitResult.success) {
        throw new Error(submitResult.error || "Transaction submission failed");
      }

      // Persist to Supabase
      const supabase = getSupabaseClient();
      const agentName = registerResult.label || agentLabel.trim() || "AI Agent";

      const { error: dbError } = await supabase.from("agents").upsert(
        {
          owner_wallet_address: address,
          agent_wallet_address: normalizedAgentAddress,
          label: agentName,
          icon: "🤖",
          monthly_budget_xlm: budget,
          spent_xlm: 0,
          is_active: true,
          tx_hash: submitResult.hash || null,
        },
        { onConflict: "owner_wallet_address, agent_wallet_address" },
      );

      if (dbError) throw dbError;

      // Update local store
      guard.addAgent({
        id: normalizedAgentAddress,
        name: agentName,
        icon: "🤖",
        allowance: budget,
        spent: 0,
        address: normalizedAgentAddress,
      });

      setAgentAddress("");
      setAgentLabel("");
      setMonthlyBudget("0.2500");
      toast.success("Agent automation registered");
    } catch (e: any) {
      console.error("registerAgent error:", e);
      toast.error(e?.message || "Failed to register agent automation");
    } finally {
      setIsRegisteringAgent(false);
    }
  };

  const handleRemoveAgent = async (agentId: string) => {
    if (!address) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("agents")
        .update({ is_active: false })
        .eq("owner_wallet_address", address)
        .eq("agent_wallet_address", agentId);

      if (error) throw error;

      guard.removeAgent(agentId);
      toast.info("Agent removed successfully");
    } catch (err) {
      console.error("Failed to remove agent:", err);
      toast.error("Failed to remove agent");
    }
  };

  const handleSyncOnboardingProfile = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setIsSyncingProfile(true);

    try {
      const profileResult = await upsertWalletProfile({
        data: {
          userAddress: address,
          displayName: displayName.trim() || "xPay Wallet",
          preferredAgentBudget: Number(monthlyBudget) || guard.dailyLimit,
          agentSpendEnabled: guard.isActive,
        },
      });

      if (!profileResult.success) {
        throw new Error("Failed to sync onboarding profile");
      }

      toast.success("Onboarding profile synced");
    } catch (e: any) {
      console.error("syncProfile error:", e);
      toast.error(e?.message || "Failed to sync onboarding profile");
    } finally {
      setIsSyncingProfile(false);
    }
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-6 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Contract Control
          </p>
          <h1 className="text-xl font-extrabold tracking-tight">AI Guard</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {CONTRACT_ID.slice(0, 20)}…
          </p>
        </div>

        <GuardHero isActive={guard.isActive} onToggle={handleToggle} />

        <DailyAllowance
          dailyLimit={guard.dailyLimit}
          totalSpent={spentToday}
          onLimitChange={handleUpdateLimit}
          isUpdating={isUpdating}
        />

        {isUpdating && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
            <Spinner className="size-4 text-primary" />
            <span>Shield Syncing...</span>
          </div>
        )}

        <section className="rounded-2xl bg-card/60 border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkle weight="duotone" className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">Onboarding Profile</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Display name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="xPay Wallet"
              className="h-10"
            />
          </div>

          <Button
            onClick={handleSyncOnboardingProfile}
            disabled={isSyncingProfile}
            className="w-full"
          >
            {isSyncingProfile ? (
              <>
                <Spinner className="size-4 mr-2" />
                Syncing profile...
              </>
            ) : (
              <>
                <UserCircle weight="duotone" className="w-4 h-4 mr-2" />
                Sync Onboarding Profile
              </>
            )}
          </Button>
        </section>

        <section className="rounded-2xl bg-card/60 border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Robot weight="duotone" className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">Register Agent Automation</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agent public key
            </label>
            <Input
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              placeholder="G..."
              className="font-mono text-xs h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agent label
            </label>
            <Input
              value={agentLabel}
              onChange={(e) => setAgentLabel(e.target.value)}
              placeholder="OpenAI Assistant"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly budget (XLM)
            </label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="h-10"
            />
          </div>

          <Button
            onClick={handleRegisterAgent}
            disabled={isRegisteringAgent}
            className="w-full"
          >
            {isRegisteringAgent ? (
              <>
                <Spinner className="size-4 mr-2" />
                Registering...
              </>
            ) : (
              "Register Agent"
            )}
          </Button>
        </section>

        {isFetchingAgents ? (
          <div className="flex justify-center p-4">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <ApprovedAgents
            agents={guard.approvedAgents}
            onRemove={handleRemoveAgent}
          />
        )}

        <KillSwitchButton onClick={() => setKillOpen(true)} />
      </div>

      <KillSwitchDialog
        open={killOpen}
        onOpenChange={setKillOpen}
        onConfirm={handleKill}
      />
    </MobileLayout>
  );
}
