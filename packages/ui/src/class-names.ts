import { extendTailwindMerge, type ClassNameValue } from "tailwind-merge";

const mergeClassNames = extendTailwindMerge<"tactile-gradient">({
  extend: {
    theme: {
      text: [
        "display",
        "display-compact",
        "title",
        "title-compact",
        "headline",
        "headline-compact",
        "body",
        "body-compact",
        "caption",
        "caption-compact",
        "micro",
      ],
      radius: ["sheet", "card", "tile", "control"],
      shadow: ["raised", "floating", "accent", "danger", "control", "disabled"],
    },
    classGroups: {
      "tactile-gradient": [
        "bg-accent-gradient",
        "bg-danger-gradient",
        "bg-control-gradient",
        "bg-disabled-gradient",
      ],
    },
  },
});

export function cn(...classNames: Array<ClassNameValue>) {
  return mergeClassNames(classNames);
}
