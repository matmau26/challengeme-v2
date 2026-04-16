import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles = {
  primary:     { btn: "bg-primary",                         text: "text-primary-foreground font-black" },
  secondary:   { btn: "bg-secondary",                       text: "text-secondary-foreground font-black" },
  outline:     { btn: "bg-transparent border border-border", text: "text-foreground font-bold" },
  ghost:       { btn: "bg-transparent",                     text: "text-foreground font-bold" },
  destructive: { btn: "bg-destructive",                     text: "text-destructive-foreground font-bold" },
};

const sizeStyles = {
  sm: { btn: "py-2 px-3 rounded-lg",  text: "text-xs" },
  md: { btn: "py-3 px-4 rounded-xl",  text: "text-sm" },
  lg: { btn: "py-4 px-6 rounded-2xl", text: "text-base" },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center",
        v.btn,
        s.btn,
        (disabled || loading) && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#000000" : "#00FF87"} size="small" />
      ) : (
        <Text className={cn(v.text, s.text, textClassName)}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
