import { mark } from "@lardon/brand";
import Svg, { Path } from "react-native-svg";

export function LardonMark({ width, color }: { width: number; color: string }) {
  const [, , viewBoxWidth = 1, viewBoxHeight = 1] = mark.viewBox.split(" ").map(Number);

  return (
    <Svg
      width={width}
      height={(width * viewBoxHeight) / viewBoxWidth}
      viewBox={mark.viewBox}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path fillRule="evenodd" d={mark.path} fill={color} />
    </Svg>
  );
}
