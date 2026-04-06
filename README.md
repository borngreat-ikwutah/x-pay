# x-pay

This project uses [Bun](https://bun.com), [TanStack Start](https://tanstack.com/start), and [Nitro](https://nitro.build).

## Install

```bash
bun install
```

## Development

Run the TanStack Start app:

```bash
bun run dev
```

## Build

Build the app with the Nitro-compatible production environment:

```bash
bun run build
```

## Preview

Preview the production build:

```bash
bun run preview
```

## Notes

- Bun is used as the package manager and runtime.
- TanStack Start provides the app framework and routing.
- Nitro is used for the build/output environment and server runtime compatibility.
- If you add new environment-specific configuration, keep it compatible with Nitro's server build pipeline.