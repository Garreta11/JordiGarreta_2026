export const labQueries = {
  all: `
    *[_type == "lab"] | order(_createdAt desc) {
      _id,
      title,
      mediaType,
      image,
      video,
      tech,
    }
  `,
};