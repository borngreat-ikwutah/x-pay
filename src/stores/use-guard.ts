import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ApprovedAgent {
  id: string;
  name: string;
  icon: string;
  allowance: number;
  spent: number;
  address?: string;
}

interface AddApprovedAgentInput {
  id?: string;
  name: string;
  icon?: string;
  allowance: number;
  spent?: number;
  address?: string;
}

interface GuardState {
  isActive: boolean;
  dailyLimit: number;
  approvedAgents: ApprovedAgent[];
  toggleGuard: () => void;
  setDailyLimit: (limit: number) => void;
  setAgents: (agents: ApprovedAgent[]) => void;
  addAgent: (agent: AddApprovedAgentInput) => void;
  removeAgent: (id: string) => void;
  killSwitch: () => void;
}

export const useGuardStore = create<GuardState>()(
  persist(
    (set) => ({
      isActive: false,
      dailyLimit: 2,
      approvedAgents: [], // Cleared mock agents, will fetch from Supabase

      toggleGuard: () => set((state) => ({ isActive: !state.isActive })),

      setDailyLimit: (limit: number) => set({ dailyLimit: limit }),

      setAgents: (agents: ApprovedAgent[]) => set({ approvedAgents: agents }),

      addAgent: (agent: AddApprovedAgentInput) =>
        set((state) => {
          const normalizedAddress = agent.address?.trim();
          const normalizedName = agent.name.trim().toLowerCase();

          const existingIndex = state.approvedAgents.findIndex((a) => {
            const sameAddress =
              normalizedAddress &&
              a.address &&
              a.address.toLowerCase() === normalizedAddress.toLowerCase();
            const sameName = a.name.trim().toLowerCase() === normalizedName;
            return Boolean(sameAddress) || sameName;
          });

          const nextAgent: ApprovedAgent = {
            id:
              agent.id?.trim() ||
              normalizedAddress ||
              `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: agent.name.trim(),
            icon: agent.icon?.trim() || "🤖",
            allowance: Number.isFinite(agent.allowance) ? agent.allowance : 0,
            spent: Number.isFinite(agent.spent ?? 0) ? (agent.spent ?? 0) : 0,
            address: normalizedAddress,
          };

          if (existingIndex >= 0) {
            const updated = [...state.approvedAgents];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              ...nextAgent,
              spent:
                existing.spent && existing.spent > 0
                  ? existing.spent
                  : nextAgent.spent,
            };
            return { approvedAgents: updated };
          }

          return { approvedAgents: [nextAgent, ...state.approvedAgents] };
        }),

      removeAgent: (id: string) =>
        set((state) => ({
          approvedAgents: state.approvedAgents.filter(
            (a) => a.id !== id && a.address !== id,
          ),
        })),

      killSwitch: () =>
        set({
          isActive: false,
          approvedAgents: [],
          dailyLimit: 0,
        }),
    }),
    { name: "xpay-guard-storage" },
  ),
);
