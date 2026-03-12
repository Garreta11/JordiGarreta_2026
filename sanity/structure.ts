import type { StructureResolver } from "sanity/structure";
import { singletonTypes } from "./lib/singleton";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";

// context is required by orderableDocumentListDeskItem — it was missing before
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Content")
    .items([
      // Home singleton
      S.listItem()
        .title("Home")
        .id("home")
        .child(
          S.document()
            .schemaType("home")
            .documentId("home")
        ),

      // About singleton
      S.listItem()
        .title("About")
        .id("about")
        .child(
          S.document()
            .schemaType("about")
            .documentId("about")
        ),

      // Posts with drag-and-drop ordering
      orderableDocumentListDeskItem({ type: "post", title: "Posts", S, context }),

      // All other document types — exclude singletons AND post (already listed above)
      ...S.documentTypeListItems().filter(
        (item) =>
          !singletonTypes.has(item.getId()!) &&
          item.getId() !== "post"
      ),
    ]);