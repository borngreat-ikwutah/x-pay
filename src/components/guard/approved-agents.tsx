import { Robot, Trash } from "@phosphor-icons/react";

interface ApprovedAgent {
  id: string;
  name: string;
  icon: string;
  allowance: number;
  spent: number;
}

interface ApprovedAgentsProps {
  agents: ApprovedAgent[];
  onRemove: (id: string) => void;
}

export function ApprovedAgents({ agents, onRemove }: ApprovedAgentsProps) {
  return (
    <div className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Robot weight="duotone" className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">Approved Agents</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {agents.length} active
        </span>
      </div>

      <div className="divide-y divide-border/30">
        {agents.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No agents approved
          </div>
        ) : (
          agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              onRemove={() => onRemove(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AgentRow({
  agent,
  onRemove,
}: {
  agent: ApprovedAgent;
  onRemove: () => void;
}) {
  const usagePercent = Math.min((agent.spent / agent.allowance) * 100, 100);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-lg shrink-0">
        {agent.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {agent.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {agent.spent.toFixed(4)} / {agent.allowance.toFixed(4)} XLM
        </p>
      </div>

      <div className="w-12 h-1 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <button
        onClick={onRemove}
        className="p-2 rounded-xl text-muted-foreground active:bg-destructive/10 active:text-destructive transition-colors shrink-0"
      >
        <Trash weight="bold" className="w-4 h-4" />
      </button>
    </div>
  );
}
