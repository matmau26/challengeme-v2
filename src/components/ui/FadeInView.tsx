import { useRef, useEffect, type ReactNode } from "react";
import { Animated, type ViewStyle } from "react-native";

interface Props {
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

export function FadeInView({ children, duration = 400, delay = 0, style, className }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, []);

  const flatStyle = Array.isArray(style) ? style : style ? [style] : [];

  return (
    <Animated.View style={[{ opacity }, ...flatStyle]} className={className}>
      {children}
    </Animated.View>
  );
}
