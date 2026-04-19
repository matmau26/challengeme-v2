import { useEffect, useRef } from "react";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { I18nProvider } from "@/src/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function NavigationGuard() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasNavigated.current) return;

    const inPublicGroup = segments[0] === "(public)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (session && !inTabsGroup) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.replace({ pathname: "/(tabs)/feed/" });
      }, 0);
    } else if (!session && !inPublicGroup) {
      hasNavigated.current = true;
      setTimeout(() => {
        router.replace({ pathname: "/(public)/landing/" });
      }, 0);
    }
  }, [session, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <NavigationGuard />
          <StatusBar style="light" backgroundColor="#000000" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(public)" />
          </Stack>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
