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
    } else {
      setVisible(true);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${!isLoading ? styles.exit : ""}`}>
      <div className={styles.bracket}>
        <span className={styles.bracketLeft}>[</span>
        <span className={styles.dot}>·</span>
        <span className={styles.bracketRight}>]</span>
      </div>
    </div>
  );
};

export default Loader;