import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { SanityFileSource } from "./sanity.video";
import { PortableTextBlock } from "@portabletext/types";

export interface Post {
  _id: string;
  title: string;
  slug: string;
  mainImage: SanityImageSource;
  basicInfo: {
    client: string;
    year: number;
    role: string;
    link: string;
    category: string;
    tools: string[];
  };
  media: {
    _type: "image" | "video";
    url: string;
  }[];
  description: PortableTextBlock[];
}

export interface Lab {
  _id: string;
  title: string;
  mediaType: "image" | "video";
  image: SanityImageSource;
  video: SanityFileSource;
  tech: string;
}

export interface About {
  _id: string;
  description: PortableTextBlock[];
  stack: string[];
  social: { name: string; url: string }[];
  achievements: { award: string; result: string }[];
  email: string;
  phone: string;
}