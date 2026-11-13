import type { ReactNode } from "react";

import type { IconName } from "../icon";

export type CollectionItem = {
  key: string;
  title: string;
  photo?: ReactNode;
  placeholderIcon?: IconName;
  facts?: readonly { icon?: IconName; label: string }[];
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};
