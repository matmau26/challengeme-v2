import { TextInput, View, Text, type TextInputProps } from "react-native";
import { cn } from "@/src/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          "w-full bg-muted border border-border rounded-xl px-4 py-3",
          "text-sm text-foreground",
          error && "border-destructive",
          className,
        )}
        placeholderTextColor="#888888"
        selectionColor="#00FF87"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {error && (
        <Text className="text-xs text-destructive mt-1">{error}</Text>
      )}
    </View>
  );
}
