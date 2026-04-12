import { MagnifyingGlass } from "@phosphor-icons/react";

type FilterType = "all" | "sent" | "received";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FILTERS: FilterType[] = ["all", "sent", "received"];

export function SearchFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: SearchFilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlass
          weight="bold"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transactions…"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/60 border border-border/50
            text-sm placeholder:text-muted-foreground/50
            focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150
              ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/60 border border-border/50 text-muted-foreground"
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
