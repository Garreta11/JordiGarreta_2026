"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { About } from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { aboutQueries } from "@/lib/queries/about.queries";
import { useState, useEffect } from "react";
// Import your exit animations
import { fadeOutHomeText, aboutPageExit, slideOutPostContent, labExit } from "@/app/animations"; 

const links = [
  { label: "Work", href: "/" },
  { label: "LAB", href: "/lab" },
  { label: "About", href: "/about" },
];

const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [about, setAbout] = useState<About | null>(null);

  useEffect(() => {
    const fetchAbout = async () => {
      const data = await client.fetch(aboutQueries.all);
      setAbout(data);
    };
    fetchAbout();
  }, []);

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (pathname === href) return;

    
    let exitTimeline;

    // 1. Identify current page and grab its specific elements
    // Note: You'll need to use document.querySelector or data-attributes 
    // since these elements live in the Page components, not the Nav.
    if (pathname === "/") {
      const project = document.querySelector('[data-anim="project"]') as HTMLElement;
      const description = document.querySelector('[data-anim="description"]') as HTMLElement;
      const bgs = Array.from(document.querySelectorAll('[data-anim="bg"]')) as HTMLElement[];
    
      if (project && description) {
        const tl = fadeOutHomeText(project, description, bgs);
        
        tl.eventCallback("onComplete", () => {
          // TypeScript ya no se queja aquí
          if (window.exitHomeSketch) {
            window.exitHomeSketch(() => {
              router.push(href);
            });
          } else {
            router.push(href);
          }
        });
        return;
      }
    } else if (pathname === "/about") {
      exitTimeline = aboutPageExit(
        Array.from(document.querySelectorAll('[data-anim="about-el"]')) as HTMLElement[],
        () => router.push("/")
      );
    } else if (pathname.startsWith("/p/")) {
       exitTimeline = slideOutPostContent(
         document.querySelector('[data-anim="post-info"]')!,
         Array.from(document.querySelectorAll('[data-anim="post-media"]')),
         document.querySelector('[data-anim="post-details"]')!,
         document.querySelector('[data-anim="post-bg"]')!
       );
    } else if (pathname === "/lab") {
      exitTimeline = labExit(
        Array.from(document.querySelectorAll('[data-anim="lab-el"]')) as HTMLElement[],
        () => router.push("/")
      );
    }

    // 2. Wait for the animation to finish, then route
    if (exitTimeline) {
      exitTimeline.eventCallback("onComplete", () => {
        router.push(href);
      });
    } else {
      router.push(href);
    }
  };

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
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavigation(e, link.href)}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.bracket}>
                <span className={styles.bracketLeft}>[</span>
                <span className={styles.dot}>{isActive ? `·` : ` `}</span>
                <span className={styles.bracketRight}>]</span>
              </span>
              <span className={styles.label}> {link.label}</span>
            </a>
          );
        })}
      </nav>
      <div className={styles.navigation__contact}>
        <a href={`tel:${about?.phone}`} className={styles.navigation__contact__item}>
          {about?.phone}
        </a>
        <a href={`mailto:${about?.email}`} className={styles.navigation__contact__item}>
          {about?.email}
        </a>
         {/* ── COPYRIGHT ── */}
        <div className={`${styles.navigation__contact__item} ${styles.navigation__contact__item__copyright}`} data-anim="about-el">
          <p>© 2026 Jordi Garreta. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default Navigation;