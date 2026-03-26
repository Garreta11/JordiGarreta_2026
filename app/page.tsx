"use client";

import styles from "./page.module.scss";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Header from "@/components/Header/Header";
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
import { useViewMode } from "@/lib/context/ViewModeContext";

const mapValue = (value: number, min: number, max: number, newMin: number, newMax: number) => {
  return (value - min) / (max - min) * (newMax - newMin) + newMin;
};

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [description, setDescription] = useState<PortableTextBlock[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { viewMode } = useViewMode();

  const sketchRef = useRef<InfiniteSlider | null>(null);
  const rafRef = useRef<number | null>(null);
  const listViewRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isListViewRef = useRef(false);
  
  const radiusRef = useRef(3);
  const positionRef = useRef(0);
  const spacingRef = useRef(0.8);
  const hSpacingRef = useRef(1.0);

  const bgRef1 = useRef<HTMLDivElement>(null);
  const bgRef2 = useRef<HTMLDivElement>(null);
  const bgRefs = [bgRef1, bgRef2];
  const [bgImages, setBgImages] = useState<[string, string]>(["", ""]);
  const activeBgRef = useRef<0 | 1>(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const currentPostRef = useRef<Post | null>(null);
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

  const infinitePosts = useMemo(() => posts, [posts]);

  /* ----------------------------------
     Init 3D Slider
  ---------------------------------- */
  useEffect(() => {
    if (infinitePosts.length === 0) return;

    const sketch = new InfiniteSlider({
      dom: document.getElementById("container") as HTMLElement,
      images: infinitePosts,
      router: router,
      onHover: (slug: string | null) => {
        const isCurrentPost = slug !== null && slug === currentPostRef.current?.slug;
        projectRef.current?.classList.toggle(styles['page__project--hovered'], isCurrentPost);
        (document.getElementById("container") as HTMLElement).style.cursor = isCurrentPost ? 'pointer' : 'default';
      },
      onClick: (slug: string) => {
        const isCurrentPost = slug !== null && slug === currentPostRef.current?.slug;
        if (currentPost?.mainImage && isCurrentPost) {
          handleViewMore(slug, urlFor(currentPost.mainImage).url() )
        }
      }
    });

    sketchRef.current = sketch;

    const loops = 5;
    let lastScroll = 0;
    let smoothVelocity = 0;

    const animate = () => {
      if (!sketchRef.current || isExitingRef.current) return;
      if (isListViewRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const scroll = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scroll / maxScroll : 0;

      const rawVelocity = (scroll - lastScroll) * 0.1;
      lastScroll = scroll;
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.1;

      const position = progress * infinitePosts.length;
      positionRef.current = position;
      const idx = ((Math.round(position)) % infinitePosts.length + infinitePosts.length) % infinitePosts.length;
      currentPostRef.current = infinitePosts[idx];
      setCurrentPost(infinitePosts[idx]);

      const mappedVelocity = mapValue(Math.abs(smoothVelocity), 0, 15, 0, 5);
      const clampVelocity = Math.max(0, Math.min(mappedVelocity, 2));

      const minRadius = 2;
      const maxRadius = 2.5;
      
      const minSpacing = 0.8;
      const maxSpacing = 0.8;

      const minHSpacing = 1.0;
      const maxHSpacing = 1.2;

      const targetRadius = minRadius + clampVelocity * (maxRadius - minRadius);
      const targetSpacing = minSpacing + clampVelocity * (maxSpacing - minSpacing);
      const targetHSpacing = minHSpacing + clampVelocity * (maxHSpacing - minHSpacing);

      const lerpSpeed = 0.15;
      radiusRef.current += (targetRadius - radiusRef.current) * lerpSpeed;
      spacingRef.current += (targetSpacing - spacingRef.current) * lerpSpeed;
      hSpacingRef.current += (targetHSpacing - hSpacingRef.current) * lerpSpeed;

      sketchRef.current.updateMeshes(position, loops, spacingRef.current, hSpacingRef.current, radiusRef.current);
      sketchRef.current.getVelocity(smoothVelocity);
      sketchRef.current.setDeform(Math.max(-1.5, Math.min(1.5, smoothVelocity)));

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
      isLoading
    ) return;
  
    introPlayedRef.current = true;
  
    gsap.set(containerEl, { y: "120vh", rotateX: -45, opacity: 0 });
    gsap.set([descriptionRef.current, projectRef.current], { opacity: 0, y: 30 });
  
    homePageIntro(containerEl, projectRef.current, descriptionRef.current);
  
    // Trigger the flat → spiral intro once the container slides in
    // Delay matches your homePageIntro slide-up duration
    setTimeout(() => {
      sketchRef.current?.introAnimation();
    }, 800); // adjust to match your GSAP timeline delay
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
     View mode transitions
  ---------------------------------- */
  useEffect(() => {
    const containerEl = document.getElementById("container");
    if (!containerEl || !listViewRef.current) return;

    if (viewMode === "list") {
      isListViewRef.current = true;

      // Fade out spiral elements
      gsap.to(containerEl, { opacity: 0, duration: 0.4, ease: "power2.out" });
      const spiralEls = [projectRef.current, wrapperRef.current, overlayRef.current].filter(Boolean);
      if (spiralEls.length) gsap.to(spiralEls, { opacity: 0, duration: 0.3 });

      // Show list and stagger items in
      gsap.set(listViewRef.current, { display: "flex" });
      const items = listViewRef.current.querySelectorAll("[data-list-item]");
      gsap.fromTo(
        items,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power2.out", delay: 0.25 }
      );
    } else {
      // Stagger list items out
      if (listViewRef.current) {
        const items = listViewRef.current.querySelectorAll("[data-list-item]");
        gsap.to(items, {
          y: -16,
          opacity: 0,
          stagger: 0.03,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            if (listViewRef.current) gsap.set(listViewRef.current, { display: "none" });
            isListViewRef.current = false;
          },
        });
      }

      // Fade spiral back in
      gsap.to(containerEl, { opacity: 1, duration: 0.5, delay: 0.15, ease: "power2.out" });
      const spiralEls = [projectRef.current, wrapperRef.current, overlayRef.current].filter(Boolean);
      if (spiralEls.length) gsap.to(spiralEls, { opacity: 1, duration: 0.5, delay: 0.15 });
    }
  }, [viewMode]);

  // Intercept wheel events on the list so Lenis never sees them
  useEffect(() => {
    if (viewMode !== "list" || !listViewRef.current) return;
    const listEl = listViewRef.current;
    const stopProp = (e: WheelEvent) => e.stopPropagation();
    listEl.addEventListener("wheel", stopProp);
    return () => listEl.removeEventListener("wheel", stopProp);
  }, [viewMode]);

  const handlePreload = useCallback((imageUrl: string) => {
    const img = new window.Image();
    img.src = imageUrl;
  }, []);

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className={styles.page}>
      <Header />
      <Loader isLoading={isLoading} />

      <div style={{ height: `${posts.length * 100}vh` }} />

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
          <div ref={overlayRef} className={styles.page__overlay} />

          <div ref={descriptionRef} className={styles.page__description} data-anim="description">
            {/* <PortableText value={description} /> */}
          </div>

          <div
            ref={projectRef}
            className={styles.page__project}
            data-anim="project"
            onMouseEnter={() => handlePreload(urlFor(currentPost.mainImage).url())}
            onClick={() => handleViewMore(currentPost.slug, urlFor(currentPost.mainImage).url())}
          >
            <p className={`${styles.page__project__item} ${styles.page__project__title}`}>
              {currentPost.title}
            </p>
            <p className={`${styles.page__project__item} ${styles.page__project__category}`}>
              {currentPost.basicInfo.category}
            </p>
            <p className={`${styles.page__project__item} ${styles.page__project__year}`}>
              {currentPost.basicInfo.year}
            </p>
            <div className={`${styles.page__project__item} ${styles.page__project__link}`}>
              <button
                className={`${styles.page__project__link__button} underline`}
                onMouseEnter={() => handlePreload(urlFor(currentPost.mainImage).url())}
                onClick={() => handleViewMore(currentPost.slug, urlFor(currentPost.mainImage).url())}
              >
                <span>VIEW MORE</span>
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
          </div>
        </>
      )}


      <div id="container" className={styles.page__container} />

      <div ref={listViewRef} className={styles.page__list}>
        <div className={styles.page__list__wrapper}>
          {posts.map((post, i) => (
            <div
              key={post._id}
              data-list-item
              className={styles.page__list__item}
              onClick={() => handleViewMore(post.slug, urlFor(post.mainImage).url())}
            >
              <span className={styles.page__list__item__index}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={styles.page__list__item__thumb}>
                <Image
                  src={urlFor(post.mainImage).url()}
                  alt={post.title}
                  width={120}
                  height={160}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className={styles.page__list__item__info}>
                <p className={styles.page__list__item__title}>{post.title}</p>
                <p className={styles.page__list__item__meta}>
                  {post.basicInfo.category}
                </p>
                <p className={styles.page__list__item__mobileMeta}>
                  {post.basicInfo.year}{post.basicInfo.tools?.length > 0 ? ` · ${post.basicInfo.tools.join(" · ")}` : ""}
                </p>
              </div>
              <div className={styles.page__list__item__right}>
                <p className={styles.page__list__item__year}>{post.basicInfo.year}</p>
                {post.basicInfo.tools?.length > 0 && (
                  <p className={styles.page__list__item__tools}>
                    {post.basicInfo.tools.join(" · ")}
                  </p>
                )}
              </div>
              <div className={styles.page__list__item__link}>
                <span className="underline">VIEW MORE</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="var(--background)" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}