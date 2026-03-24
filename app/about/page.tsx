"use client";
import { useEffect, useRef, useState } from "react";
import { client } from "@/sanity/lib/client";
import { aboutQueries } from "@/lib/queries/about.queries";
import { About } from "@/lib/types";
import { PortableText } from "@portabletext/react";
import styles from "./page.module.scss";
import { urlFor } from "@/lib/sanity.image";
import Link from "next/link";
import { aboutPageIntro } from "@/app/animations";
import AboutBg from "@/components/AboutBg/AboutBg";

export default function AboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [bgUrl, setBgUrl] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    client.fetch(aboutQueries.all).then((data) => setAbout(data as About));
  }, []);

  useEffect(() => {
    if (!about) return;
    const url = urlFor(about.bgImage).url();
    const img = new window.Image();
    img.onload = () => setBgUrl(url);
    img.src = url;
  }, [about]);

  useEffect(() => {
    if (!about || !contentRef.current || !bgUrl) return;
    const els = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>("[data-anim='about-el']")
    );
    aboutPageIntro(els, bgRef.current ?? undefined);
  }, [about, bgUrl]);

  return (
    <div className={styles.page}>

      {bgUrl !== "" && (
        <>
          <div className={styles.page__wrapper}>
            <div
              ref={bgRef}
              className={styles.page__wrapper__bg}
              style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : "none" }}
              data-anim="post-bg"
            />
          </div>
          {/* <div className={styles.page__bg}>
            <AboutBg ref={bgCanvasRef} src={bgUrl} />
          </div> */}
        </>

      )}
      <div className={styles.page__overlay} />

      <div className={styles.page__content} ref={contentRef}>

        {/* ── INFORMATION ── */}
        <div className={styles.page__info} data-anim="about-el">
          <p className={styles.label}>INFORMATION</p>
          <div className={styles.page__info__text}>
            <PortableText value={about?.description || []} />
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div className={styles.page__grid}>

          {/* Services */}
          <div className={styles.page__grid__col} data-anim="about-el">
            <p className={styles.label}>SERVICES</p>
            <ul className={styles.list}>
              {about?.stack?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* Clients + Agencies */}
          <div className={styles.page__grid__col} data-anim="about-el">
            <p className={styles.label}>CLIENTS & AGENCIES</p>
            <ul className={styles.list}>
              {about?.clients?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* Achievements */}
          <div className={styles.page__grid__col} data-anim="about-el">
            <p className={styles.label}>ACHIEVEMENTS</p>
            <ul className={styles.list}>
              {about?.achievements?.map((item, i) => (
                <li key={i}>{item.award} · {item.result}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.page__grid__col} data-anim="about-el">
            <p className={styles.label}>CONTACT</p>
            <ul className={styles.list}>
              <li>M. {about?.email}</li>
              <li>P. {about?.phone}</li>
            </ul>
            <p className={`${styles.label} ${styles.label__gap}`}>SOCIAL</p>
            <ul className={styles.list}>
              {about?.social?.map((item, i) => (
                <li key={i}>
                  <Link href={item.url} target="_blank">
                    ↳ {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
