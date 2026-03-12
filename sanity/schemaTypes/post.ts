import { defineField, defineType } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export default defineType({
  name: "post",
  title: "Post",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "post" }),

    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
    }),

    defineField({
      name: 'basicInfo',
      type: 'object',
      title: 'Basic Info',
      fields: [
        defineField({
          name: "client",
          type: "string",
        }),
        defineField({
          name: "year",
          type: "number",
        }),
        defineField({
          name: "role",
          type: "string",
        }),
        defineField({
          name: "link",
          type: "url",
        }),
        defineField({
          name: "category",
          type: "string",
        }),
        defineField({
          name: "tools",
          type: "array",
          of: [{ type: "string" }],
        }),
      ],
      options: { columns: 2 },
    }),

    defineField({
      name: "mainImage",
      type: "image",
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "array",
      of: [
        {
          type: "image",
          title: "Image",
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
            }),
          ],
        },
        {
          type: "file",
          title: "Video",
          options: {
            accept: "video/*",
          },
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
            }),
          ],
        },
      ],
      options: {
        layout: "grid",
      },
    }),
  ],
});