"use client";

import { useEffect, useState } from "react";
import styles from "./Loader.module.scss";

interface LoaderProps {
  isLoading: boolean;
}

const Loader = ({ isLoading }: LoaderProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // let the exit animation finish before unmounting
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (!visible && !isLoading) return null;

  return (
    <div className={`${styles.overlay} ${!isLoading ? styles.exit : ""}`}>
      <div className={styles.wrapper}>
        <p className={`${styles.wrapper__item} ${styles.wrapper__text}`}>Loading experience</p>

        <div className={`${styles.wrapper__item} ${styles.bracket}`}>
          <span className={styles.bracketLeft}>[</span>
          <span className={styles.dot}>·</span>
          <span className={styles.bracketRight}>]</span>
        </div>

        <p className={`${styles.wrapper__item} ${styles.wrapper__text} ${styles.wrapper__text_right}`}>it won&apos;t be long</p>
      </div>
    </div>
  );
};

export default Loader;