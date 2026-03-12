"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Work", href: "/" },
  { label: "LAB", href: "/lab" },
  { label: "About", href: "/about" },
];

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation}>
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
  );
};

export default Navigation;