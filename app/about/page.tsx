"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { aboutQueries } from "@/lib/queries/about.queries";
import { About } from "@/lib/types";
import { PortableText } from "@portabletext/react";
import styles from "./page.module.scss";

// Importa tus funciones de animación
import { aboutPageIntro, aboutPageExit } from "@/app/animations"; 

export default function AboutPage() {
  const router = useRouter();
  const [about, setAbout] = useState<About | null>(null);

  const bgRef = useRef<HTMLDivElement>(null);
  const stackColRef = useRef<HTMLDivElement>(null);
  const descColRef = useRef<HTMLDivElement>(null);
  const achievementsColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAbout = async () => {
      const data = await client.fetch(aboutQueries.all);
      console.log(data);
      setAbout(data);
    };
    fetchAbout();
  }, []);

  // Disparamos la intro cuando 'about' ya tiene datos
  useEffect(() => {
    if (about && bgRef.current && stackColRef.current && descColRef.current && achievementsColRef.current) {
      aboutPageIntro(
        bgRef.current,
        stackColRef.current,
        descColRef.current,
        achievementsColRef.current
      );
    }
  }, [about]);

  const handleBack = () => {
    if (bgRef.current && stackColRef.current && descColRef.current && achievementsColRef.current) {
      aboutPageExit(
        [stackColRef.current, descColRef.current, achievementsColRef.current],
        bgRef.current,
        () => router.push("/")
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.page__wrapper}>
        <div 
          ref={bgRef} 
          className={styles.page__wrapper__bg} 
          style={{ backgroundImage: `url('/path-to-your-about-bg.jpg')` }} 
        />
        <div className={styles.page__wrapper__overlay} />
      </div>

      <div className={styles.page__content}>
        
        {/* IZQUIERDA: BACK + TITLE + STACK */}
        <div ref={stackColRef} className={styles.page__content__stack}>
          <button onClick={handleBack} className={styles.page__content__back}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="white"/>
            </svg>
            Go back
          </button>

          <h1 className={styles.page__content__title}>About.</h1>

          <div className={styles.page__content__group}>
            <h3 className={styles.page__content__label}>Tech Stack</h3>
            <ul className={styles.page__content__list}>
              {about?.stack?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CENTRO: BIO (MÁS ANCHA) */}
        <div ref={descColRef} className={styles.page__content__info}>
          <div className={styles.page__content__info__description}>
            <PortableText value={about?.description || []} />
          </div>
        </div>

        {/* DERECHA: ACHIEVEMENTS + (CONTACT & SOCIAL) */}
        <div ref={achievementsColRef} className={styles.page__content__details}>
          
          {/* Achievements Section */}
          <div className={styles.page__content__group}>
            <h2 className={`${styles.page__content__label} ${styles.page__content__details__title}`}>Achievements</h2>
            <table className={styles.page__content__details__table}>
              <tbody>
                {about?.achievements?.map((item, i) => (
                  <tr key={i} className={styles.page__content__details__table__row}>
                    <td className={styles.page__content__details__table__cell}>{item.award}</td>
                    <td className={styles.page__content__details__table__cell} style={{ textAlign: 'right', opacity: 0.5 }}>
                      {item.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NEW WRAPPER: Contact & Social en dos columnas */}
          <div className={styles.page__content__details__footer}>
            
            {/* <div className={styles.page__content__group}>
              <h3 className={styles.page__content__label}>Contact</h3>
              <div className={styles.page__content__contact}>
                <a href={`mailto:${about?.email}`} className={styles.page__content__contact__item}>
                  {about?.email}
                </a>
                <a href={`tel:${about?.phone}`} className={styles.page__content__contact__item}>
                  {about?.phone}
                </a>
              </div>
            </div> */}

            <div className={styles.page__content__group}>
              <h3 className={styles.page__content__label}>Social</h3>
              <div className={styles.page__content__social}>
                {about?.social?.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.page__content__social__item}>
                    {item.name}
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="white"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}