import { useEffect } from "react";
import { Stack, useSegments, useRouter, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { I18nProvider } from "@/src/lib/i18n";

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

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
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)" || segments[0] === "(tabs)";
    const inPublicGroup = segments[0] === "(public)";
    const isRoot = (segments as string[]).length === 0;

    if (session && (!inAuthGroup || isRoot)) {
      router.replace("/(tabs)/feed");
    } else if (!session && !inPublicGroup) {
      router.replace("/(public)/landing");
    }
  }, [session, isLoading, segments, rootNavigationState?.key]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) {
      console.warn("[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID is not set — skipping init.");
      return;
    }
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);
  }, []);

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
