import { Stack } from "expo-router";

export default function FeedLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
      }}
    >
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="[slug]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
