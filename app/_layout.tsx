import { useEffect } from "react";
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

  useEffect(() => {
    if (isLoading) return;

    const inPublicGroup = segments[0] === "(public)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (session && !inTabsGroup) {
      router.replace({ pathname: "/(tabs)/feed/" });
    } else if (!session && !inPublicGroup) {
      router.replace({ pathname: "/(public)/landing/" });
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
