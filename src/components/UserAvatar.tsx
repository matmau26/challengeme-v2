import { useState, useEffect } from "react";
import { Image, View, Text } from "react-native";
import { avatarWithCache } from "@/src/hooks/useUserProfile";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  gender?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
const FONT_SIZE_MAP = { xs: 10, sm: 13, md: 16, lg: 22, xl: 32 };

export function UserAvatar({ avatarUrl, username, gender, size = "md" }: UserAvatarProps) {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const initial = (username || "A").charAt(0).toUpperCase();

  const resolvedUrl = avatarWithCache(avatarUrl, gender);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  if (resolvedUrl && !failed) {
    return (
      <Image
        source={{ uri: resolvedUrl }}
        onError={() => setFailed(true)}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: "#1A1A1A",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: "#1A1A1A",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#2A2A2A",
      }}
    >
      <Text style={{ fontSize, fontWeight: "900", color: "#00FF87" }}>{initial}</Text>
    </View>
  );
}
