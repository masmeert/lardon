import { Children, type ReactNode } from "react";
import { View } from "react-native";

const backPositions = [-1, 1];

export function Fan({ spreadPt, children }: { spreadPt: number; children: ReactNode }) {
  const [front, ...back] = Children.toArray(children).slice(0, 3);

  return (
    <View className="items-center justify-center">
      {back.map((item, index) => (
        <View
          key={index}
          className="absolute"
          style={{
            transform: [{ translateX: (backPositions[index] ?? 0) * spreadPt }, { scale: 0.86 }],
          }}
        >
          {item}
        </View>
      ))}
      {front}
    </View>
  );
}
