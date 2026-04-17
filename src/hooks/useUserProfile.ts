import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";

const getFallbackUrl = (fileName: string) => {
  try {
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data?.publicUrl || "";
  } catch {
    return "";
  }
};

export function avatarWithCache(url: string | null | undefined, gender?: string | null): string {
  const DEFAULT_MALE = getFallbackUrl("default-avatar-male.png");
  const DEFAULT_FEMALE = getFallbackUrl("default-avatar-female.png");

  if (!url || typeof url !== "string" || url.trim().length === 0 || url.includes("default-avatar.png")) {
    const isFemale = String(gender || "").toLowerCase() === "femme";
    return isFemale ? DEFAULT_FEMALE : DEFAULT_MALE;
  }
  return String(url);
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["user-profile-data", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["my-gym-name", user?.id] });
  };
}
