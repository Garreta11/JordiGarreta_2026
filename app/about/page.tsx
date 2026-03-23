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

export default function AboutPage() {
  const [about, setAbout] = useState<About | null>(null);
  const [bgUrl, setBgUrl] = useState("");

  const infoRef = useRef<HTMLDivElement>(null);
  const stackColRef = useRef<HTMLDivElement>(null);
  const achievementsColRef = useRef<HTMLDivElement>(null);

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
    if (about && infoRef.current && stackColRef.current && achievementsColRef.current) {
      aboutPageIntro(stackColRef.current, infoRef.current, achievementsColRef.current);
    }
  }, [about]);

  return (
    <div className={styles.page}>

      <div className={styles.page__bg}>
        <div
          className={styles.page__bg__image}
          data-anim="bg"
          style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : "none" }}
        />
        <div className={styles.page__bg__overlay} />
      </div>

      <div className={styles.page__content}>

        {/* ── INFORMATION ── */}
        <div className={styles.page__info} ref={infoRef} data-anim="about-el">
          <p className={styles.label}>INFORMATION</p>
          <div className={styles.page__info__text}>
            <PortableText value={about?.description || []} />
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div className={styles.page__grid}>

          {/* Services */}
          <div className={styles.page__grid__col} ref={stackColRef} data-anim="about-el">
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
          <div className={styles.page__grid__col} ref={achievementsColRef} data-anim="about-el">
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
                  <Link href={item.url} target="_blank">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
