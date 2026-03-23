import { defineField, defineType } from "sanity";

export default defineType({
  name: "about",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      initialValue: "About",
      hidden: true,
    }),
    defineField({
      name: "video",
      type: "file",
      options: {
        accept: "video/*",
      },
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "email",
      type: "string",
    }),
    defineField({
      name: "phone",
      type: "string",
    }),
    defineField({
      name: "clients",
      type: "array",
      of: [{ type: "string" }]
    }),
    defineField({
      name: "stack",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "social",
      type: "array",
      of: [{ type: "object", fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "url", type: "url" }),
      ] }],
    }),
    defineField({
      name: "achievements",
      type: "array",
      of: [{ type: "object", fields: [
        defineField({ name: "award", type: "string" }),
        defineField({ name: "result", type: "string" }),
      ] }],
    }),
  ],
});