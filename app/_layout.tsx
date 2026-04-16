import { useEffect, useRef } from "react";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { I18nProvider } from "@/src/lib/i18n";
import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/**
 * NavigationGuard — redirects users based on auth state.
 *
 * Key safeguards against the double-navigation crash (GO_BACK):
 * 1. `isNavigating` ref prevents re-entry while a router.replace() is in flight.
 *    Segments briefly pass through undefined during transitions, which would
 *    otherwise re-trigger the redirect and crash the navigator.
 * 2. `setTimeout(..., 0)` defers navigation until the current render cycle
 *    completes and the navigator is fully mounted/ready.
 * 3. The ref resets only when segments settle into the correct group,
 *    re-enabling future redirects (e.g. after sign-out).
 */
function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (isNavigating.current) return;

    const inProtectedGroup = segments[0] === "(tabs)" || segments[0] === "(auth)";
    const inPublicGroup = segments[0] === "(public)" || !segments[0];

    if (user && inPublicGroup) {
      isNavigating.current = true;
      setTimeout(() => router.replace({ pathname: "/(tabs)/feed/" }), 0);
    } else if (!user && inProtectedGroup) {
      isNavigating.current = true;
      setTimeout(() => router.replace({ pathname: "/(public)/landing/" }), 0);
    } else {
      // Segments have settled into the correct group — unlock for future redirects.
      isNavigating.current = false;
    }
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <NavigationGuard />
          <StatusBar style="light" backgroundColor="#000000" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
