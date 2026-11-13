import { createCn } from "cn/config";

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "label",
            "caption",
            "body",
            "title",
            "field",
            "headline",
            "large-title",
            "display",
            "heading-sm",
            "heading",
            "heading-lg",
            "heading-display",
          ],
        },
      ],
      h: [{ h: ["control-sm", "control", "control-lg"] }],
      size: [{ size: ["control-sm", "control", "control-lg"] }],
      rounded: [{ rounded: ["card", "inner"] }],
    },
  },
});
