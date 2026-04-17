import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Search, X, Swords } from "lucide-react-native";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { UserAvatar } from "@/src/components/UserAvatar";

export interface SearchedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  gym_name: string | null;
}

interface UserSearchProps {
  onSelect: (user: SearchedUser) => void;
  placeholder?: string;
  ctaLabel?: string;
  excludeSelf?: boolean;
  maxResults?: number;
}

export function UserSearch({
  onSelect,
  placeholder,
  ctaLabel,
  excludeSelf = true,
  maxResults = 10,
}: UserSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_users_by_username", {
        q,
        exclude_user_id: excludeSelf ? user?.id || null : null,
        max_results: maxResults,
      });
      if (error) {
        setResults([]);
      } else {
        setResults((data || []) as SearchedUser[]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeSelf, user?.id, maxResults]);

  const showEmpty =
    touched && !loading && query.trim().length >= 2 && results.length === 0;

  return (
    <View>
      <View
        className="flex-row items-center bg-muted border border-border rounded-xl px-3"
        style={{ height: 44 }}
      >
        <Search size={16} color="#888888" />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setTouched(true);
          }}
          placeholder={placeholder || "Chercher un pseudo…"}
          placeholderTextColor="#666666"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-foreground text-sm ml-2"
          style={{ paddingVertical: 0 }}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => {
              setQuery("");
              setResults([]);
            }}
            hitSlop={10}
          >
            <X size={16} color="#666666" />
          </Pressable>
        )}
        {loading && (
          <ActivityIndicator color="#00FF87" size="small" style={{ marginLeft: 6 }} />
        )}
      </View>

      {results.length > 0 && (
        <View className="bg-card border border-border rounded-xl mt-2 overflow-hidden">
          <FlatList
            data={results}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: "#2A2A2A" }} />
            )}
            renderItem={({ item }) => (
              <View className="flex-row items-center px-3 py-2">
                <UserAvatar
                  avatarUrl={item.avatar_url}
                  username={item.username}
                  size="sm"
                />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-foreground font-bold text-sm"
                    numberOfLines={1}
                  >
                    {item.username}
                  </Text>
                  {item.gym_name ? (
                    <Text
                      className="text-muted-foreground text-[10px] font-bold"
                      numberOfLines={1}
                    >
                      {item.gym_name}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => onSelect(item)}
                  className="flex-row items-center bg-primary rounded-full px-3 py-1.5"
                >
                  <Swords size={12} color="#000" />
                  <Text className="text-black font-black text-[11px] ml-1 uppercase tracking-wider">
                    {ctaLabel || "Défier"}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      )}

      {showEmpty && (
        <View className="bg-card border border-dashed border-border rounded-xl mt-2 py-4 items-center">
          <Text className="text-xs text-muted-foreground font-bold">
            Aucun athlète trouvé
          </Text>
        </View>
      )}
    </View>
  );
}
