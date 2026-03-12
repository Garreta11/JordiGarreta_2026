import { defineField, defineType } from "sanity";

export default defineType({
  name: "home",
  title: "Home",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      initialValue: "Homepage",
      hidden: true,
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});