import { logo, mark, wordmark } from "@lardon/brand";
import Svg, { Path } from "react-native-svg";

export function LardonLogo({ height, color }: { height: number; color: string }) {
  const [, , viewBoxWidth = 1, viewBoxHeight = 1] = logo.viewBox.split(" ").map(Number);

  return (
    <Svg
      width={(height * viewBoxWidth) / viewBoxHeight}
      height={height}
      viewBox={logo.viewBox}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lardon"
    >
      <Path transform={logo.markTransform} fillRule="evenodd" d={mark.path} fill={color} />
      <Path transform={logo.wordmarkTransform} d={wordmark.path} fill={color} />
    </Svg>
  );
}
