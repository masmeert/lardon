import { View } from "react-native";

import { PhotoSticker } from "./photo-sticker";

export function Hero() {
  return (
    <View className="flex-row items-center justify-center">
      <PhotoSticker
        source={require("@lardon/brand/assets/photos/pancakes.jpg")}
        sizePt={120}
        className="-mr-4"
        rotationDeg={-7}
        floatDistancePt={6}
        floatPeriodMs={6000}
      />
      <PhotoSticker
        source={require("@lardon/brand/assets/photos/lasagna.jpg")}
        sizePt={168}
        className="z-10"
        rotationDeg={2}
        floatDistancePt={4}
        floatPeriodMs={4200}
      />
      <PhotoSticker
        source={require("@lardon/brand/assets/photos/borscht.jpg")}
        sizePt={120}
        className="-ml-4"
        rotationDeg={6}
        floatDistancePt={-4.5}
        floatPeriodMs={5600}
      />
    </View>
  );
}
