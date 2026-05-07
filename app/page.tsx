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
import ProjectList from "@/components/ProjectList/ProjectList";
import type { PortableTextBlock } from "@portabletext/types";
import { fadeOutHomeText, homePageIntro, fadeOutListView } from "@/app/animations";
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
  const followerRef = useRef<HTMLDivElement>(null);

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
      // List view exit
      if (isListViewRef.current && listViewRef.current) {
        fadeOutListView(listViewRef.current, () => router.push(`/p/${slug}`));
        return;
      }

      // Spiral view exit
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
        (document.getElementById("container") as HTMLElement).style.cursor = isCurrentPost ? 'none' : 'default';
        gsap.to(followerRef.current, { opacity: isCurrentPost ? 1 : 0, duration: 0.3, ease: "power2.out" });
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
    gsap.set(followerRef.current, { xPercent: -50, yPercent: -50, x: -999, y: -999 });
    const onMouseMove = (e: MouseEvent) => {
      gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.4, ease: "power2.out", overwrite: "auto" });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

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
            <div className={`${styles.page__project__item} ${styles.page__project__index}`}>
              {String(posts.findIndex(p => p._id === currentPost._id) + 1).padStart(2, '0')}
            </div>
          </div>
        </>
      )}


      <div ref={followerRef} className={styles.page__follower}>[VIEW PROJECT]</div>

      <div id="container" className={styles.page__container} />

      <ProjectList 
        ref={listViewRef} 
        posts={posts} 
        onProjectClick={handleViewMore} 
      />
    </div>
  );
}