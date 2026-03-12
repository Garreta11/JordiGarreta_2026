export const postQueries = {
  all: `
    *[_type == "post"] | order(orderRank asc) {
      _id,
      title,
      "slug": slug.current,
      basicInfo,
      mainImage,
    }
  `,
  
  bySlug: `
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      description,
      mainImage,
      basicInfo,
      media
    }
  `,
};