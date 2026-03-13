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
      media,
      "next": *[_type == "post" && orderRank > ^.orderRank] | order(orderRank asc)[0] { 
        title, 
        "slug": slug.current 
      },
      "prev": *[_type == "post" && orderRank < ^.orderRank] | order(orderRank desc)[0] { 
        title, 
        "slug": slug.current 
      }
    }
  `,
};