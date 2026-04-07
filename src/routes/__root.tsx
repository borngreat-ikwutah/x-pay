/// <reference types="vite/client" />

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { generateSeo } from "~/lib/seo";
import { MobileGuard } from "~/components/mobile-guard";
import { useDeviceStore } from "~/stores/device-store";
import { ErrorPage } from "~/components/error-page";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...generateSeo(),
      {
        name: "apple-mobile-web-app-title",
        content: "Xpay",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png?v=2",
        sizes: "96x96",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=2" },
      { rel: "shortcut icon", href: "/favicon.ico?v=2" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png?v=2",
      },
      { rel: "manifest", href: "/site.webmanifest?v=2" },
    ],
  }),

  notFoundComponent: () => (
    <ErrorPage
      title="Not Found"
      description="The page you requested does not exist."
    />
  ),
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MobileGuard>{children}</MobileGuard>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
