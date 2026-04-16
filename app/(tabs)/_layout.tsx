import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect, useRouter } from "expo-router";
import { Home, Trophy, User } from "lucide-react-native";
import { useAuth } from "@/src/contexts/AuthContext";
import { useUserProfile } from "@/src/hooks/useUserProfile";

function TabsNavigator() {
  const { data: profile, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !profile) return;
    const hasUsername = typeof profile.username === "string" && profile.username.trim() !== "";
    const hasGender = typeof profile.gender === "string" && profile.gender.trim() !== "";
    if (!hasUsername || !hasGender) {
      router.replace({ pathname: "/(auth)/onboarding/" });
    }
  }, [profile, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#2A2A2A",
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: "#00FF87",
        tabBarInactiveTintColor: "#888888",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: ({ color }) => <Trophy size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{ href: null }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00FF87" size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(public)/landing/" />;

  return <TabsNavigator />;
}
