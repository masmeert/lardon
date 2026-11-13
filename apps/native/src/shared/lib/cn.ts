import { createCn } from "cn/config";

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["label", "caption", "body", "title", "headline", "large-title", "display"] },
      ],
      h: [{ h: ["control-sm", "control", "control-lg"] }],
      size: [{ size: ["control-sm", "control", "control-lg"] }],
      rounded: [{ rounded: ["card", "inner"] }],
      material: ["surface-raised", "accent-raised"],
    },
  },
});
