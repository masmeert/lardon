import type { ReactNode } from "react";

export type CollectionItem = {
  key: string;
  title: string;
  cover: (sizePt: number) => ReactNode;
  details?: ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};
