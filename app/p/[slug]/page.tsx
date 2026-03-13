"use client";
import { useEffect, useState, use, useRef, useCallback } from "react";
import { Post } from "@/lib/types";
import { postQueries } from "@/lib/queries/post.queries";
import { client } from "@/sanity/lib/client";
import styles from "./page.module.scss";
import { urlFor } from "@/lib/sanity.image";
import { videoUrlFor } from "@/lib/sanity.video";
import Image from "next/image";
import { SanityFileSource } from "@/lib/sanity.video";
import { PortableText } from "@portabletext/react";
import { useRouter } from "next/navigation";
import { postPageIntro, slideOutPostContent } from "@/app/animations";
import Link from "next/link";
import gsap from "gsap";

export default function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params as Promise<{ slug: string }>);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [bgUrl, setBgUrl] = useState("");
  const [bgLoaded, setBgLoaded] = useState(false);

  const bgRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const mediaItemsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      const data = await client.fetch(postQueries.bySlug, { slug });
      setPost(data as Post);
    };
    fetchPost();
  }, [slug]);

  // Preload bg image
  // This will resolve from cache immediately — no blink
  useEffect(() => {
    if (!post) return;
    const url = urlFor(post.mainImage).url();
    const img = new window.Image();
    img.onload = () => {
      setBgUrl(url);
      setBgLoaded(true);
    };
    img.src = url; // already cached, fires synchronously
  }, [post]);

  // Run intro animation once bg is loaded and refs are ready
  useEffect(() => {
    if (
      !bgLoaded ||
      !bgRef.current ||
      !infoRef.current ||
      !detailsRef.current ||
      mediaItemsRef.current.length === 0
    ) return;

    
    // Set initial states before animating in
    gsap.set(bgRef.current, { opacity: 0, scale: 1.05 });
    gsap.set(infoRef.current, { opacity: 0, translateX: -40 });
    gsap.set(detailsRef.current, { opacity: 0, translateX: -40 });
    gsap.set(mediaItemsRef.current, { opacity: 0, translateY: 60 });

    postPageIntro(
      bgRef.current,
      infoRef.current,
      mediaItemsRef.current,
      detailsRef.current
    );
  }, [bgLoaded]);

  /* ----------------------------------
     Go back exit animation
     ---------------------------------- */

  const handleGoBack = useCallback(() => {
    if (
      !bgRef.current ||
      !infoRef.current ||
      !detailsRef.current ||
      mediaItemsRef.current.length === 0
    ) {
      router.push("/");
      return;
    }

    slideOutPostContent(
      infoRef.current,
      mediaItemsRef.current,
      detailsRef.current,
      bgRef.current
    ).eventCallback("onComplete", () => router.push("/"));
  }, [router]);

  /* ---------------------------------- */
  /* Render                              */
  /* ---------------------------------- */

  return (
    <div className={styles.page}>
      {post && (
        <>
          <div className={styles.page__wrapper}>
            <div
              ref={bgRef}
              className={styles.page__wrapper__bg}
              style={{
                backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
              }}
            />
          </div>
          <div className={styles.page__overlay} />

          <div className={styles.page__content}>
            {/* Info block */}
            <div
              ref={infoRef}
              className={styles.page__content__info}
              style={{ opacity: 0 }}
            >
              {/* Go back — now a button */}
              <button
                onClick={handleGoBack}
                className={styles.page__content__info__back}
              >
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
                Go back
              </button>

              <h1 className={styles.page__content__info__title}>{post.title}</h1>

              <div className={styles.page__content__info__description} data-lenis-prevent>
                <PortableText value={post.description} />
              </div>

              
            </div>

            {/* Media */}
            <div className={styles.page__content__media}>
              {post.media.map((media, index) => {
                const src =
                  media["_type"] === "image"
                    ? urlFor(media).url()
                    : videoUrlFor(media as unknown as SanityFileSource);
                return (
                  <div
                    className={styles.page__content__media__item}
                    key={index}
                    style={{ opacity: 0 }}
                    ref={(el) => {
                      if (el) mediaItemsRef.current[index] = el;
                    }}
                  >
                    {media["_type"] === "image" ? (
                      <Image
                        src={src}
                        alt={`${post.title} - Image ${index + 1}`}
                        width={800}
                        height={800}
                        className={styles.page__content__media__item__image}
                      />
                    ) : (
                      <video
                        src={src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={styles.page__content__media__item__video}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Details */}
            <div
              ref={detailsRef}
              className={styles.page__content__details}
              style={{ opacity: 0 }}
            >
              <table className={styles.page__content__details__table}>
                <tbody>
                  <tr className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>Client</td>
                    <td className={styles.page__content__details__table__cell}>{post.basicInfo.client}</td>
                  </tr>
                  <tr className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>Type</td>
                    <td className={styles.page__content__details__table__cell}>{post.basicInfo.category}</td>
                  </tr>
                  <tr className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>Role</td>
                    <td className={styles.page__content__details__table__cell}>{post.basicInfo.role}</td>
                  </tr>
                  <tr className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>Year</td>
                    <td className={styles.page__content__details__table__cell}>{post.basicInfo.year}</td>
                  </tr>
                  <tr className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>Tools</td>
                    {post.basicInfo.tools.length > 0 && (
                      <td className={styles.page__content__details__table__cell}>
                        {post.basicInfo.tools.map((tool, i) => (
                          <p key={i}>{tool}</p>
                        ))}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>

              {post.basicInfo.link && (
                <Link
                  href={post.basicInfo.link}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.page__content__details__link}
                >
                  View Project
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
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}