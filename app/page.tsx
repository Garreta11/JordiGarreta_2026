"use client";

import styles from "./page.module.scss";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { postQueries } from "@/lib/queries/post.queries";
import { descriptionQueries } from "@/lib/queries/description.queries";
import { client } from "@/sanity/lib/client";
import { Post } from "@/lib/types";
import { urlFor } from "@/lib/sanity.image";
import Image from "next/image";
import InfiniteSlider from "./InfiniteSlider.js";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { fadeOutHomeText, homePageIntro } from "@/app/animations";
import Loader from "@/components/Loader/Loader";

const mapValue = (value: number, min: number, max: number, newMin: number, newMax: number) => {
  return (value - min) / (max - min) * (newMax - newMin) + newMin;
};

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [description, setDescription] = useState<PortableTextBlock[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sketchRef = useRef<InfiniteSlider | null>(null);
  const rafRef = useRef<number | null>(null);
  const radiusRef = useRef(3);
  const positionRef = useRef(0);

  const bgRef1 = useRef<HTMLDivElement>(null);
  const bgRef2 = useRef<HTMLDivElement>(null);
  const bgRefs = [bgRef1, bgRef2];
  const [bgImages, setBgImages] = useState<[string, string]>(["", ""]);
  const activeBgRef = useRef<0 | 1>(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const introPlayedRef = useRef(false);
  const isExitingRef = useRef(false);

  // Track readiness: posts fetched + first image loaded
  const postsReadyRef = useRef(false);
  const firstImageReadyRef = useRef(false);

  function checkAllReady() {
    if (postsReadyRef.current && firstImageReadyRef.current) {
      setIsLoading(false);
    }
  }

  /* ----------------------------------
     Fetch Posts
  ---------------------------------- */
  useEffect(() => {
    const fetchPosts = async () => {
      const data = await client.fetch(postQueries.all);
      setPosts(data);
      setCurrentPost(data[0]);
      postsReadyRef.current = true;

      // Preload the first post's image
      if (data[0]) {
        const img = new window.Image();
        img.onload = () => {
          firstImageReadyRef.current = true;
          checkAllReady();
        };
        img.onerror = () => {
          firstImageReadyRef.current = true;
          checkAllReady();
        };
        img.src = urlFor(data[0].mainImage).url();
      } else {
        firstImageReadyRef.current = true;
        checkAllReady();
      }

      checkAllReady();
    };

    const fetchDescription = async () => {
      const data = await client.fetch(descriptionQueries.description);
      setDescription(data.description);
    };

    fetchPosts();
    fetchDescription();
  }, []);

  const infinitePosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    return [...posts, posts[0]];
  }, [posts]);

  /* ----------------------------------
     Init 3D Slider
  ---------------------------------- */
  useEffect(() => {
    if (infinitePosts.length === 0) return;

    const sketch = new InfiniteSlider({
      dom: document.getElementById("container") as HTMLElement,
      images: infinitePosts,
      router: router,
    });

    sketchRef.current = sketch;

    const loops = 4;
    const verticalSpacing = 0.5;
    let lastScroll = 0;
    let smoothVelocity = 0;

    const animate = () => {
      if (!sketchRef.current || isExitingRef.current) return;

      const scroll = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scroll / maxScroll : 0;

      const rawVelocity = (scroll - lastScroll) * 0.1;
      lastScroll = scroll;
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.1;

      const position = progress * (infinitePosts.length - 1);
      positionRef.current = position;
      setCurrentPost(infinitePosts[Math.round(position)]);

      const mappedVelocity = mapValue(Math.abs(smoothVelocity), 0, 0.5, 0, 1);
      const clampedVelocity = Math.max(0, Math.min(1, mappedVelocity));

      const minRadius = 1;
      const maxRadius = 1.2;
      const targetRadius = minRadius + clampedVelocity * (maxRadius - minRadius);

      const lerpSpeed = clampedVelocity < 0.05 ? 0.15 : 0.05;
      radiusRef.current += (targetRadius - radiusRef.current) * lerpSpeed;

      sketchRef.current.updateMeshes(position, loops, verticalSpacing, radiusRef.current);
      sketchRef.current.getVelocity(smoothVelocity);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sketchRef.current) sketchRef.current.destroy();
      sketchRef.current = null;
    };
  }, [infinitePosts]);

  /* ----------------------------------
     Home intro
  ---------------------------------- */
  useEffect(() => {
    const containerEl = document.getElementById("container");
    if (
      introPlayedRef.current ||
      !containerEl ||
      !projectRef.current ||
      !descriptionRef.current ||
      !currentPost ||
      isLoading  // wait for loader to finish
    ) return;

    introPlayedRef.current = true;

    gsap.set(containerEl, { y: "120vh", rotateX: -45, opacity: 0 });
    gsap.set([descriptionRef.current, projectRef.current], { opacity: 0, y: 30 });

    homePageIntro(containerEl, projectRef.current, descriptionRef.current);
  }, [currentPost, isLoading]);

  /* ----------------------------------
     Background crossfade
  ---------------------------------- */
  useEffect(() => {
    if (!currentPost) return;

    const nextImageUrl = urlFor(currentPost.mainImage).url();
    const img = new window.Image();

    img.onload = () => {
      const activeBg = activeBgRef.current;
      const nextBg = (1 - activeBg) as 0 | 1;

      setBgImages((prev) => {
        const copy: [string, string] = [...prev];
        copy[nextBg] = nextImageUrl;
        return copy;
      });

      const fadeInEl = bgRefs[nextBg].current;
      const fadeOutEl = bgRefs[activeBg].current;
      if (!fadeInEl || !fadeOutEl) return;

      gsap.killTweensOf([fadeInEl, fadeOutEl]);
      gsap.set(fadeInEl, { opacity: 0 });
      gsap.to(fadeInEl, { opacity: 1, duration: 0.8, ease: "power2.out" });
      gsap.to(fadeOutEl, { opacity: 0, duration: 0.8, ease: "power2.out" });

      activeBgRef.current = nextBg;
    };

    img.src = nextImageUrl;
  }, [currentPost]);

  useEffect(() => {
    window.exitHomeSketch = (callback: () => void) => {
      if (sketchRef.current) {
        sketchRef.current.exitAnimation(positionRef.current, callback);
      } else {
        callback();
      }
    };
  
    return () => {
      window.exitHomeSketch = undefined; // Limpieza segura
    };
  }, []);

  /* ----------------------------------
     Exit transition
  ---------------------------------- */
  const handleViewMore = useCallback(
    (slug: string, imageUrl: string) => {
      if (!projectRef.current || !descriptionRef.current || !sketchRef.current) return;

      isExitingRef.current = true;

      const img = new window.Image();
      img.onload = () => {
        const bgElements = [bgRef1.current, bgRef2.current].filter(Boolean) as HTMLElement[];
        const tl = fadeOutHomeText(projectRef.current!, descriptionRef.current!, bgElements);
        tl.call(() => {
          sketchRef.current!.exitAnimation(positionRef.current, () => {
            router.push(`/p/${slug}`);
          });
        }, [], 0.1);
      };
      img.src = imageUrl;
    },
    [router]
  );

  const handlePreload = useCallback((imageUrl: string) => {
    const img = new window.Image();
    img.src = imageUrl;
  }, []);

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className={styles.page}>
      <Loader isLoading={isLoading} />

      <div style={{ height: `${posts.length * 200}vh` }} />

      <div className={styles.page__wrap}>
        {infinitePosts.map((post, index) => (
          <div key={`${post._id}-${index}`} className="n">
            <Image
              className="gallery-images"
              data-slug={post.slug}
              src={urlFor(post.mainImage).url()}
              alt={post.title}
              width={800}
              height={800}
            />
          </div>
        ))}
      </div>

      {currentPost && (
        <>
          <div ref={wrapperRef} className={styles.page__wrapper}>
            {bgImages.map((img, i) => (
              <div
                key={i}
                ref={bgRefs[i]}
                className={styles.page__wrapper__bg}
                data-anim="bg"
                style={{ backgroundImage: img ? `url(${img})` : "none" }}
              />
            ))}
          </div>
          <div className={styles.page__overlay} />

          <div ref={descriptionRef} className={styles.page__description} data-anim="description">
            <PortableText value={description} />
          </div>

          <div ref={projectRef} className={styles.page__project} data-anim="project">
            <p className={`${styles.page__project__item} ${styles.page__project__title}`}>
              {currentPost.title}
            </p>
            <div className={`${styles.page__project__item} ${styles.page__project__link}`}>
              <button
                onClick={() => handleViewMore(currentPost.slug, urlFor(currentPost.mainImage).url())}
                onMouseEnter={() => handlePreload(urlFor(currentPost.mainImage).url())}
                className={`${styles.page__project__link__button} underline`}
              >
                VIEW MORE
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                      d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z"
                      fill="var(--background)"
                    />
                </svg>
              </button>
            </div>
            <p className={`${styles.page__project__item} ${styles.page__project__category}`}>
              {currentPost.basicInfo.category}
            </p>
            <p className={`${styles.page__project__item} ${styles.page__project__year}`}>
              {currentPost.basicInfo.year}
            </p>
          </div>
        </>
      )}

      <div id="container" className={styles.page__container} />
    </div>
  );
}