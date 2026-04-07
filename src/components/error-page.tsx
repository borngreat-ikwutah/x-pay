import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  HouseIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Button } from "~/components/ui/button";

interface ErrorPageProps {
  error?: Error | unknown;
  title?: string;
  description?: string;
  showRefresh?: boolean;
  showGoBack?: boolean;
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
}

export function ErrorPage({
  error,
  title = "Something went wrong",
  description = "An unexpected error has occurred. Please try again later.",
  showRefresh = true,
  showGoBack = true,
  showHomeButton = true,
  customActions,
}: ErrorPageProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const handleRefresh = () => {
    router.invalidate();
  };

  const handleGoBack = () => {
    // Use router's history to go back
    router.history.back();
  };

  const handleRouteRefresh = async () => {
    try {
      await navigate({ to: ".", replace: true });
    } catch (err) {
      // Fallback to router invalidate if navigate fails
      router.invalidate();
    }
  };

  // Extract error message if available
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Empty className="max-w-2xl border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningIcon className="size-6 text-destructive" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl font-bold text-destructive md:text-3xl">
            {title}
          </EmptyTitle>
          <EmptyDescription className="text-base md:text-lg">
            {description}
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <div className="space-y-4 text-center">
            {/* Show error details in development */}
            {errorMessage && process.env.NODE_ENV === "development" && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <p className="font-mono text-sm wrap-break-word text-destructive">
                  {errorMessage}
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              We apologize for the inconvenience. Our team has been notified and
              is working to resolve this issue.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
              {showRefresh && (
                <Button
                  onClick={handleRefresh}
                  className="min-w-[140px] rounded-md"
                >
                  <ArrowClockwiseIcon className="mr-2 size-4" />
                  Try Again
                </Button>
              )}

              {showHomeButton && (
                <Button variant="outline" className="min-w-[140px] rounded-md">
                  <Link to="/" className="flex items-center gap-2">
                    <HouseIcon className="mr-2 size-4" />
                    Go Home
                  </Link>
                </Button>
              )}

              {/* Custom actions if provided */}
              {customActions}
            </div>

            {/* Go Back Button */}
            {showGoBack && (
              <div className="border-t border-dashed pt-6">
                <Button
                  variant="ghost"
                  onClick={handleGoBack}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Go Back
                </Button>
              </div>
            )}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}

// Pre-configured error components for common scenarios
export function DefaultErrorPage({ error }: { error?: Error | unknown }) {
  return <ErrorPage error={error} />;
}

export function NetworkErrorPage() {
  const router = useRouter();

  return (
    <ErrorPage
      title="Connection Error"
      description="Unable to connect to our servers. Please check your internet connection and try again."
      customActions={
        <Button variant="outline" onClick={() => router.invalidate()}>
          <ArrowClockwiseIcon className="mr-2 size-4" />
          Retry Connection
        </Button>
      }
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      title="Server Error"
      description="Our servers are experiencing issues. Please try again in a few minutes."
      showGoBack={false}
    />
  );
}
