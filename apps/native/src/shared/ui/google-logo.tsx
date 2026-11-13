import { Image } from "react-native";

export function GoogleLogo({ size }: { size: number }) {
  return (
    <Image
      source={require("../../../assets/images/google-logo.png")}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
    />
  );
}
