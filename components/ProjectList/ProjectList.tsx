import styles from "./ProjectList.module.scss";
import { Post } from "@/lib/types";
import { urlFor } from "@/lib/sanity.image";
import { ForwardedRef, forwardRef, useState, useRef, useCallback } from "react";
import gsap from "gsap";

interface ProjectListProps {
  posts: Post[];
  onProjectClick: (slug: string, imageUrl: string) => void;
}

const ProjectList = forwardRef(({ posts, onProjectClick }: ProjectListProps, ref: ForwardedRef<HTMLDivElement>) => {
  // Estados para el crossfade del fondo
  const [bgImages, setBgImages] = useState({ a: "", b: "" });
  const [activeLayer, setActiveLayer] = useState<"a" | "b">("a");
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const bgARef = useRef<HTMLDivElement>(null);
  const bgBRef = useRef<HTMLDivElement>(null);
  const previewARef = useRef<HTMLDivElement>(null);
  const previewBRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((imageUrl: string) => {
    setHoveredImage(imageUrl);

    const nextLayer = activeLayer === "a" ? "b" : "a";
    setBgImages((prev) => ({ ...prev, [nextLayer]: imageUrl }));
    setActiveLayer(nextLayer);

    const incomingBg = nextLayer === "a" ? bgARef.current : bgBRef.current;
    const outgoingBg = nextLayer === "a" ? bgBRef.current : bgARef.current;
    const incomingPrev = nextLayer === "a" ? previewARef.current : previewBRef.current;
    const outgoingPrev = nextLayer === "a" ? previewBRef.current : previewARef.current;

    gsap.killTweensOf([incomingBg, outgoingBg, incomingPrev, outgoingPrev]);

    gsap.to(incomingBg, { opacity: 1, duration: 1, ease: "power2.inOut" });
    gsap.to(outgoingBg, { opacity: 0, duration: 1, ease: "power2.inOut" });
    gsap.to(incomingPrev, { opacity: 1, duration: 0.6, ease: "power2.inOut" });
    gsap.to(outgoingPrev, { opacity: 0, duration: 0.6, ease: "power2.inOut" });
  }, [activeLayer]);

  const handleMouseLeave = useCallback(() => {
    setHoveredImage(null);
    gsap.to([bgARef.current, bgBRef.current], { opacity: 0, duration: 0.8, ease: "power2.inOut" });
    gsap.to([previewARef.current, previewBRef.current], { opacity: 0, duration: 0.5, ease: "power2.inOut" });
  }, []);

  return (
    <div ref={ref} className={styles.list}>
      {/* 1. CONTENEDOR DE FONDOS (CROSSFADE) */}
      <div className={styles.list__bg_container}>
        <div
          ref={bgARef}
          className={styles.list__bg_layer}
          style={{ backgroundImage: bgImages.a ? `url(${bgImages.a})` : "none" }}
        />
        <div
          ref={bgBRef}
          className={styles.list__bg_layer}
          style={{ backgroundImage: bgImages.b ? `url(${bgImages.b})` : "none", opacity: 0 }}
        />
        {/* Overlay con blur fijo */}
        <div className={styles.list__bg_overlay} />
      </div>

      {/* 2. PREVIEW CENTRAL (NÍTIDA) */}
      <div className={`${styles.list__preview} ${hoveredImage ? styles["list__preview--active"] : ""}`}>
        <div
          ref={previewARef}
          className={styles.list__preview__layer}
          style={{ backgroundImage: bgImages.a ? `url(${bgImages.a})` : "none" }}
        />
        <div
          ref={previewBRef}
          className={styles.list__preview__layer}
          style={{ backgroundImage: bgImages.b ? `url(${bgImages.b})` : "none", opacity: 0 }}
        />
      </div>

      {/* 3. LISTADO DE PROYECTOS */}
      <div className={styles.list__wrapper}>
        {posts.map((post, i) => {
          const imageUrl = urlFor(post.mainImage).url();
          
          return (
            <div
              key={post._id}
              data-list-item
              className={styles.list__item}
              onMouseEnter={() => handleMouseEnter(imageUrl)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onProjectClick(post.slug, imageUrl)}
            >
              <div className={styles.list__item__index}>
                <p>{String(i + 1).padStart(2, "0")}</p>
              </div>
              <div className={styles.list__item__title}>
                <p>{post.title}</p>
              </div>
              <div className={styles.list__item__category}>
                <p>{post.basicInfo.category}</p>
              </div>
              <div className={styles.list__item__tools}>
                <p>{post.basicInfo.tools?.join(" · ")}</p>
              </div>
              <div className={styles.list__item__year}>
                <p>{post.basicInfo.year}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ProjectList.displayName = "ProjectList";

export default ProjectList;