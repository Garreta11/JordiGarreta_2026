"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Post } from "@/lib/types";
import { postQueries } from "@/lib/queries/post.queries";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/lib/sanity.image";
import Image from "next/image";
import gsap from "gsap";
import { moreProjectsExit } from "@/app/animations";
import styles from "./MoreProjects.module.scss";

interface MoreProjectsProps {
  currentSlug: string;
  onProjectClick: (slug: string) => void;
}

export default function MoreProjects({ currentSlug, onProjectClick }: MoreProjectsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [bgImages, setBgImages] = useState({ a: "", b: "" });
  const [activeLayer, setActiveLayer] = useState<"a" | "b">("a");

  const bgARef = useRef<HTMLDivElement>(null);
  const bgBRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    client.fetch(postQueries.all).then((data: Post[]) => setPosts(data));
  }, []);

  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  const nextPosts =
    currentIndex === -1 || posts.length === 0
      ? []
      : Array.from({ length: Math.min(6, posts.length - 1) }, (_, i) => {
          const idx = (currentIndex + 1 + i) % posts.length;
          return { post: posts[idx], globalIndex: idx };
        });

  const handleMouseEnter = useCallback(
    (imageUrl: string) => {
      setHoveredImage(imageUrl);
      const nextLayer = activeLayer === "a" ? "b" : "a";
      setBgImages((prev) => ({ ...prev, [nextLayer]: imageUrl }));
      setActiveLayer(nextLayer);

      const inEl = nextLayer === "a" ? bgARef.current : bgBRef.current;
      const outEl = nextLayer === "a" ? bgBRef.current : bgARef.current;
      gsap.killTweensOf([inEl, outEl]);
      gsap.to(inEl, { opacity: 1, duration: 0.8, ease: "power2.inOut" });
      gsap.to(outEl, { opacity: 0, duration: 0.8, ease: "power2.inOut" });
    },
    [activeLayer]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredImage(null);
    gsap.to([bgARef.current, bgBRef.current], {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
    });
  }, []);

  const handleClick = useCallback((slug: string) => {
    if (listRef.current) {
      const items = Array.from(listRef.current.querySelectorAll<HTMLElement>("[data-more-item]"));
      moreProjectsExit(items);
    }
    onProjectClick(slug);
  }, [onProjectClick]);

  if (nextPosts.length === 0) return null;

  return (
    <div className={styles.more}>
      <div
        className={`${styles.more__preview} ${hoveredImage ? styles["more__preview--active"] : ""}`}
      >
        {hoveredImage && (
          <Image
            src={hoveredImage}
            alt="Project preview"
            fill
            sizes="30vw"
            className={styles.more__preview__img}
          />
        )}
      </div>

      <div className={styles.more__header}>
        <p>More projects</p>
      </div>

      <div ref={listRef} className={styles.more__list}>
        {nextPosts.map(({ post, globalIndex }) => {
          const imageUrl = urlFor(post.mainImage).url();
          return (
            <div
              key={post._id}
              data-more-item
              className={styles.more__item}
              onMouseEnter={() => handleMouseEnter(imageUrl)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(post.slug)}
            >
              <div className={styles.more__item__index}>
                <p>{String(globalIndex + 1).padStart(2, "0")}</p>
              </div>
              <div className={styles.more__item__title}>
                <p>{post.title}</p>
              </div>
              <div className={styles.more__item__category}>
                <p>{post.basicInfo.category}</p>
              </div>
              <div className={styles.more__item__tools}>
                <p>{post.basicInfo.tools?.join(" · ")}</p>
              </div>
              <div className={styles.more__item__year}>
                <p>{post.basicInfo.year}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
