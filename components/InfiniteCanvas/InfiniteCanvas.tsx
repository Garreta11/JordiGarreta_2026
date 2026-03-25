'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import imageUrlBuilder from '@sanity/image-url';
import { Lab } from '@/lib/types';
import { client } from '@/sanity/lib/client';
import { videoUrlFor } from '@/lib/sanity.video';
import styles from './InfiniteCanvas.module.scss';
import Loader from '@/components/Loader/Loader';

gsap.registerPlugin(Draggable, InertiaPlugin);

const imageBuilder = imageUrlBuilder(client);

interface InfiniteCanvasProps {
  labs: Lab[];
}

interface ExpandedItem {
  lab: Lab;
  media: { type: string; url: string };
  rect: DOMRect;
  aspect: number; // intrinsic width / height
}

function getLabMedia(lab: Lab, seed: number) {
  if (lab.mediaType === 'video' && lab.video) {
    return { type: 'video', url: videoUrlFor(lab.video) };
  }
  if (lab.image) {
    return { type: 'image', url: imageBuilder.image(lab.image).width(600).height(600).url() };
  }
  return { type: 'image', url: `https://picsum.photos/600/600?random=${seed}` };
}

const InfiniteCanvas = ({ labs }: InfiniteCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<ExpandedItem | null>(null);
  const hasDraggedRef = useRef(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  function closeExpanded() {
    if (!expandedItem || !lightboxRef.current || !overlayRef.current || isClosingRef.current) return;
    isClosingRef.current = true;

    const { rect } = expandedItem;
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(lightboxRef.current, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      borderRadius: '5px',
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        setExpandedItem(null);
        isClosingRef.current = false;
      },
    });
  }

  // Animate open whenever expandedItem is set
  useLayoutEffect(() => {
    if (!expandedItem || !lightboxRef.current || !overlayRef.current) return;

    const { rect, aspect } = expandedItem;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Fit the intrinsic aspect ratio within 85vw × 85vh
    const maxW = vw * 0.85;
    const maxH = vh * 0.85;
    let targetW = maxW;
    let targetH = targetW / aspect;
    if (targetH > maxH) {
      targetH = maxH;
      targetW = targetH * aspect;
    }
    const targetLeft = (vw - targetW) / 2;
    const targetTop = (vh - targetH) / 2;

    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(
      lightboxRef.current,
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: '5px' },
      { left: targetLeft, top: targetTop, width: targetW, height: targetH, borderRadius: '12px', duration: 0.65, ease: 'power3.inOut' }
    );
  }, [expandedItem]);

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeExpanded(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedItem]);

  useEffect(() => {
    if (!labs.length || !containerRef.current) return;

    // Use a proxy object for smooth coordinate tracking
    const rowNum = 5;
    const imgNum = 9;
    const totalCells = rowNum * imgNum;
    const imageSelector = `.${styles.sliderImage}`;

    const cellMedia = Array.from({ length: totalCells }, (_, i) =>
      getLabMedia(labs[i % labs.length], i)
    );

    let rowArray: HTMLDivElement[] = [];
    let imgRep: HTMLDivElement[][] = [];
    let boxWidth: number, boxHeight: number, gutter: number, horizSpacing: number, vertSpacing: number;
    let startX: number, startY: number;
    let lastCenteredElem: HTMLElement | null = null;

    const imgMidIndex = Math.floor(imgNum / 2);
    const rowMidIndex = Math.floor(rowNum / 2);

    function onMediaLoaded() {
      setIsLoading(false);
    }

    function createImageGrid() {
      const container = containerRef.current!;
      container.innerHTML = '';
      rowArray = [];
      imgRep = [];

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      for (let y = 0; y < rowNum; y++) {
        const row = document.createElement('div');
        row.className = styles.row;
        row.dataset.offset = y % 2 === 0 ? 'false' : 'true';
        const rowImgs: HTMLDivElement[] = [];

        for (let x = 0; x < imgNum; x++) {
          const media = cellMedia[y * imgNum + x];
          const lab = labs[(y * imgNum + x) % labs.length];
          const cell = document.createElement('div');
          cell.className = styles.sliderImage;
          cell.dataset.anim = 'lab-el';

          if (media.type === 'video') {
            const video = document.createElement('video');
            video.src = media.url;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';

            if (isMobile) {
              cell.addEventListener('touchstart', () => {
                containerRef.current?.querySelectorAll('video').forEach((v) => {
                  if (v !== video) v.pause();
                });
                video.play();
              }, { passive: true });
            } else {
              cell.addEventListener('mouseenter', () => {
                containerRef.current?.querySelectorAll('video').forEach((v) => {
                  if (v !== video) v.pause();
                });
                video.play();
              });
              cell.addEventListener('mouseleave', () => video.pause());
            }

            video.addEventListener('canplay', onMediaLoaded, { once: true });
            video.addEventListener('loadedmetadata', () => {
              cell.dataset.mediaW = String(video.videoWidth);
              cell.dataset.mediaH = String(video.videoHeight);
            }, { once: true });
            cell.appendChild(video);
          } else {
            const img = new Image();
            img.onload = () => {
              cell.dataset.mediaW = String(img.naturalWidth);
              cell.dataset.mediaH = String(img.naturalHeight);
            };
            img.src = media.url;
            cell.style.backgroundImage = `url(${media.url})`;
            onMediaLoaded();
          }

          // Click to expand
          cell.addEventListener('click', () => {
            if (hasDraggedRef.current) return;
            const rect = cell.getBoundingClientRect();
            const mw = parseFloat(cell.dataset.mediaW ?? '0');
            const mh = parseFloat(cell.dataset.mediaH ?? '0');
            // Fall back to cell aspect ratio if metadata not yet loaded
            const aspect = mw && mh ? mw / mh : rect.width / rect.height;
            setExpandedItem({ lab, media, rect, aspect });
          });

          cell.dataset.offsetX = String((Math.random() - 0.5) * 2);
          cell.dataset.offsetY = String((Math.random() - 0.5) * 2);

          const title = document.createElement('div');
          title.className = styles.cellTitle;
          title.textContent = `${lab.title}  [${lab.tech ?? ''}]`;
          cell.appendChild(title);
          row.appendChild(cell);
          rowImgs.push(cell);
        }
        container.appendChild(row);
        rowArray.push(row);
        imgRep.push(rowImgs);
      }
    }

    function moveArrayIndex<T>(array: T[], oldIndex: number, newIndex: number) {
      if (newIndex >= array.length) { let k = newIndex - array.length + 1; while (k--) { array.push(undefined as unknown as T); } }
      array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    }

    function recycleRowsUp(steps: number) {
      for (let i = 0; i < steps; i++) {
        const firstRowY = gsap.getProperty(rowArray[0], "y") as number;
        const last = rowArray[rowArray.length - 1];
        const firstIsOffset = rowArray[0].dataset.offset === "true";
        const newIsOffset = !firstIsOffset;
        gsap.set(last, {
          y: firstRowY - vertSpacing,
          x: newIsOffset ? startX - boxWidth / 2 : startX,
        });
        last.dataset.offset = String(newIsOffset);
        moveArrayIndex(rowArray, rowArray.length - 1, 0);
        moveArrayIndex(imgRep, imgRep.length - 1, 0);
      }
    }

    function recycleRowsDown(steps: number) {
      for (let i = 0; i < steps; i++) {
        const lastRowY = gsap.getProperty(rowArray[rowArray.length - 1], "y") as number;
        const first = rowArray[0];
        const lastIsOffset = rowArray[rowArray.length - 1].dataset.offset === "true";
        const newIsOffset = !lastIsOffset;
        gsap.set(first, {
          y: lastRowY + vertSpacing,
          x: newIsOffset ? startX - boxWidth / 2 : startX,
        });
        first.dataset.offset = String(newIsOffset);
        moveArrayIndex(rowArray, 0, rowArray.length - 1);
        moveArrayIndex(imgRep, 0, imgRep.length - 1);
      }
    }

    function recycleColsLeft(steps: number) {
      imgRep.forEach(row => {
        for (let i = 0; i < steps; i++) {
          const firstX = gsap.getProperty(row[0], "x") as number;
          const last = row[row.length - 1];
          gsap.set(last, { x: firstX - horizSpacing });
          moveArrayIndex(row, row.length - 1, 0);
        }
      });
    }

    function recycleColsRight(steps: number) {
      imgRep.forEach(row => {
        for (let i = 0; i < steps; i++) {
          const lastX = gsap.getProperty(row[row.length - 1], "x") as number;
          const first = row[0];
          gsap.set(first, { x: lastX + horizSpacing });
          moveArrayIndex(row, 0, row.length - 1);
        }
      });
    }

    function updateCenterElem() {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const containerX = gsap.getProperty(containerRef.current, "x") as number;
      const containerY = gsap.getProperty(containerRef.current, "y") as number;

      let bestCell: HTMLDivElement | null = null;
      let bestRow = -1, bestCol = -1;
      let bestDist = Infinity;

      imgRep.forEach((row, r) => {
        const rowEl = rowArray[r];
        const rowX = containerX + (gsap.getProperty(rowEl, "x") as number);
        const rowY = containerY + (gsap.getProperty(rowEl, "y") as number);

        row.forEach((cell, c) => {
          const cellCX = rowX + (gsap.getProperty(cell, "x") as number) + boxWidth / 2;
          const cellCY = rowY + boxHeight / 2;
          const dist = Math.abs(cellCX - cx) + Math.abs(cellCY - cy);
          if (dist < bestDist) {
            bestDist = dist;
            bestCell = cell;
            bestRow = r;
            bestCol = c;
          }
        });
      });

      if (bestCell && bestCell !== lastCenteredElem) {
        lastCenteredElem = bestCell;

        const rDiff = bestRow - rowMidIndex;
        const cDiff = bestCol - imgMidIndex;

        if (rDiff > 0) recycleRowsDown(rDiff);
        else if (rDiff < 0) recycleRowsUp(Math.abs(rDiff));

        if (cDiff > 0) recycleColsRight(cDiff);
        else if (cDiff < 0) recycleColsLeft(Math.abs(cDiff));
      }
    }

    function resize() {
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      if (vh > vw) {
        boxHeight = vh * 0.1;
        boxWidth = boxHeight / 0.7;
        gutter = vw * 0.2;
      } else {
        boxWidth = vw * 0.1;
        boxHeight = boxWidth * 0.7;
        gutter = vw * 0.1;
      }
      horizSpacing = boxWidth + gutter;
      vertSpacing = boxHeight + gutter;

      startX = (vw / 2) - (imgMidIndex * horizSpacing) - (boxWidth / 2);
      startY = (vh / 2) - (rowMidIndex * vertSpacing) - (boxHeight / 2);

      gsap.set(containerRef.current, { x: 0, y: 0 });

      rowArray.forEach((row, i) => {
        const isOdd = i % 2 !== 0;
        gsap.set(row, {
          x: isOdd ? startX - (boxWidth / 2) : startX,
          y: startY + (i * vertSpacing)
        });

        const cells = row.querySelectorAll<HTMLElement>(imageSelector);
        cells.forEach((cell, idx) => {
          const ox = parseFloat(cell.dataset.offsetX ?? '0');
          const oy = parseFloat(cell.dataset.offsetY ?? '0');
          gsap.set(cell, {
            width: boxWidth,
            height: boxHeight,
            x: idx * horizSpacing,
            y: 0,
          });
          cell.style.left = `${ox * boxWidth * 0.2}px`;
          cell.style.top  = `${oy * boxHeight * 0.3}px`;
        });
      });
    }

    createImageGrid();
    resize();

    const dragger = Draggable.create(containerRef.current, {
      type: 'x,y',
      trigger: containerRef.current.parentElement!,
      inertia: true,
      onPress: () => {
        hasDraggedRef.current = false;
        gsap.killTweensOf(containerRef.current);
      },
      onDrag: () => {
        hasDraggedRef.current = true;
        updateCenterElem();
      },
      onThrowUpdate: updateCenterElem,
    });

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      gsap.killTweensOf(containerRef.current);

      const curX = gsap.getProperty(containerRef.current, "x") as number;
      const curY = gsap.getProperty(containerRef.current, "y") as number;

      gsap.set(containerRef.current, {
        x: curX - e.deltaX,
        y: curY - e.deltaY,
      });

      updateCenterElem();
    };

    const containerWrapper = containerRef.current.parentElement;
    if (containerWrapper) {
      containerWrapper.addEventListener('wheel', handleWheel, { passive: false });
    }

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (containerWrapper) {
        containerWrapper.removeEventListener('wheel', handleWheel);
      }
      dragger[0].kill();
    };
  }, [labs]);

  return (
    <div className={styles.wrapper} style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
      <Loader isLoading={isLoading} />
      <div ref={containerRef} className={styles.container} style={{ willChange: 'transform' }} />

      {expandedItem && (
        <>
          <div ref={overlayRef} className={styles.overlay} onClick={closeExpanded} />
          <div ref={lightboxRef} className={styles.lightbox}>
            {expandedItem.media.type === 'video' ? (
              <video
                src={expandedItem.media.url}
                autoPlay
                loop
                playsInline
              />
            ) : (
              <div
                className={styles.lightboxImage}
                style={{ backgroundImage: `url(${expandedItem.media.url})` }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InfiniteCanvas;
