import { mark } from "@lardon/brand";
import * as SplashScreen from "expo-splash-screen";
import { useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { motionMs, useThemeColors } from "#/shared/lib";

const AnimatedG = Animated.createAnimatedComponent(G<{ matrix?: number[] }>);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function LaunchReveal() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { splash, bacon } = useThemeColors("splash", "bacon");
  const [isRevealed, setIsRevealed] = useState(false);
  const hasStarted = useRef(false);
  const overlayOpacity = useSharedValue(1);
  const stripesOpacity = useSharedValue(1);
  const fillOpacity = useSharedValue(1);
  const settleScale = useSharedValue(1);
  const zoomProgress = useSharedValue(0);
  const iconUnitsPerPt = 1024 / 200;

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const stripesProps = useAnimatedProps(() => ({ opacity: stripesOpacity.value }));
  const fillProps = useAnimatedProps(() => ({ opacity: fillOpacity.value }));

  const windowProps = useAnimatedProps(() => {
    const pointsPerUnit =
      (settleScale.value *
        (Math.hypot(width, height) / 2 / (72 / iconUnitsPerPt)) ** zoomProgress.value) /
      iconUnitsPerPt;

    return {
      matrix: [
        pointsPerUnit,
        0,
        0,
        pointsPerUnit,
        width / 2 - 512 * pointsPerUnit,
        height / 2 - 512 * pointsPerUnit,
      ],
    };
  });

  if (isRevealed) {
    return null;
  }

  const frameWidth = width * 1.2 * iconUnitsPerPt;
  const frameHeight = height * 1.2 * iconUnitsPerPt;
  const frameLeft = 512 - frameWidth / 2;
  const frameTop = 512 - frameHeight / 2;
  const markOutline = mark.path.slice(0, mark.path.indexOf("Z") + 1);

  function finish(isFinished?: boolean) {
    "worklet";

    if (isFinished) {
      scheduleOnRN(setIsRevealed, true);
    }
  }

  function reveal() {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    SplashScreen.hide();

    if (reduceMotion) {
      overlayOpacity.value = withTiming(0, { duration: motionMs.fast }, finish);

      return;
    }

    stripesOpacity.value = withTiming(0, {
      duration: motionMs.fast,
      easing: Easing.inOut(Easing.quad),
    });
    fillOpacity.value = withDelay(
      motionMs.fast + motionMs.moderate,
      withTiming(0, { duration: motionMs.slow, easing: Easing.in(Easing.cubic) }),
    );
    settleScale.value = withDelay(
      motionMs.fast,
      withTiming(0.92, { duration: motionMs.moderate, easing: Easing.inOut(Easing.quad) }),
    );
    zoomProgress.value = withDelay(
      motionMs.fast + motionMs.moderate,
      withTiming(1, { duration: motionMs.slow, easing: Easing.in(Easing.quad) }, finish),
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={reveal}
      style={overlayStyle}
      className="absolute inset-0"
    >
      <Svg width={width} height={height}>
        <AnimatedG
          animatedProps={windowProps}
          transform={[
            1 / iconUnitsPerPt,
            0,
            0,
            1 / iconUnitsPerPt,
            width / 2 - 512 / iconUnitsPerPt,
            height / 2 - 512 / iconUnitsPerPt,
          ]}
        >
          <Path
            fillRule="evenodd"
            fill={splash}
            d={`M ${frameLeft} ${frameTop} h ${frameWidth} v ${frameHeight} h ${-frameWidth} Z ${markOutline}`}
          />
          <AnimatedPath animatedProps={fillProps} fill={bacon} d={markOutline} />
          <AnimatedPath
            animatedProps={stripesProps}
            fill={splash}
            d={mark.path.slice(mark.path.indexOf("Z") + 1)}
          />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
