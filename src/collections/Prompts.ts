import type { CollectionConfig } from "payload";

export const Prompts: CollectionConfig = {
  slug: "prompts",
  // auth: true,
  // access: {
  //   read: () => true,
  // },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "prompt",
      type: "text",
      required: true,
    },
  ],
};
