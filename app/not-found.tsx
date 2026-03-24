'use client';

import styles from "./not-found.module.scss";
import Header from "@/components/Header/Header";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <>
      <Header />

      <main className={styles.not_found}>
        <div className={styles.not_found__wrapper} onClick={handleGoHome}>
          <p className={`${styles.not_found__wrapper__item} ${styles.not_found__wrapper__text}`}>Page not found</p>
          <p className={`${styles.not_found__wrapper__item} ${styles.not_found__wrapper__text}`}>404</p>

          <div
            className={`${styles.not_found__wrapper__item} ${styles.not_found__wrapper__button}`}
            aria-label="Go back to homepage"
          >
            <span className={styles.not_found__wrapper__text}>GO BACK HOME</span>

            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className={styles.not_found__wrapper__svg}
            >
              <path
                className={styles.not_found__wrapper__svg__path}
                d="M15.707 1C15.707 0.4477 15.2593 0 14.707 0H5.707C5.1547 0 4.707 0.4477 4.707 1C4.707 1.5523 5.1547 2 5.707 2H13.707V10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10V1ZM0.707 15L1.414 15.707L15.414 1.707L14.707 1L14 0.293L0 14.293L0.707 15Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </main>
    </>
  );
}