"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { About } from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { aboutQueries } from "@/lib/queries/about.queries";
import { useState, useEffect } from "react";

const links = [
  { label: "Work", href: "/" },
  { label: "LAB", href: "/lab" },
  { label: "About", href: "/about" },
];

const Navigation = () => {
  const pathname = usePathname();
  const [about, setAbout] = useState<About | null>(null);
  
  useEffect(() => {
    const fetchAbout = async () => {
      const data = await client.fetch(aboutQueries.all);
      setAbout(data);
    };
    fetchAbout();
  }, []);

  if (pathname.includes("/studio")) return null;

  return (
    <div className={styles.navigation}>
      <nav className={styles.navigation__nav}>
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/" || pathname.startsWith("/p/")
              : pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.bracket}>
                <span className={styles.bracketLeft}>[</span>
                <span className={styles.dot}>{isActive ? `·` : ` `}</span>
                <span className={styles.bracketRight}>]</span>
              </span>
              <span className={styles.label}> {link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.navigation__contact}>
        <a href={`tel:${about?.phone}`} className={styles.page__content__contact__item}>
          {about?.phone}
        </a>
        <a href={`mailto:${about?.email}`} className={styles.page__content__contact__item}>
          {about?.email}
        </a>

      </div>
    </div>
  );
};

export default Navigation;