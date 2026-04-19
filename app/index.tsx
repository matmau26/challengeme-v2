import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
