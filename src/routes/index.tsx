import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <h1>TanStack Start + Bun + Nitro</h1>
      <p>
        Your app is ready to build with Bun and run in a Nitro-compatible
        environment.
      </p>
    </main>
  );
}
