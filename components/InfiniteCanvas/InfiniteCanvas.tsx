'use client';
import { useEffect, useRef, useState } from 'react';
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

// Use the existing shared Sanity client — avoids duplicating project config and
// correctly resolves SanityImageSource (a union of SanityReference, asset objects,
// and plain strings) to a concrete CDN URL string via the image URL builder.
const imageBuilder = imageUrlBuilder(client);

interface InfiniteCanvasProps {
  labs: Lab[];
}

function getLabMedia(lab: Lab, seed: number): { type: 'image'; url: string } | { type: 'video'; url: string } {
  if (lab.mediaType === 'video' && lab.video) {
    // videoUrlFor is already typed to accept SanityFileSource and handles the
    // ref → CDN URL conversion — no manual string manipulation needed.
    return { type: 'video', url: videoUrlFor(lab.video) };
  }
  if (lab.image) {
    // imageBuilder.image() accepts SanityImageSource directly, which is the correct
    // fix: lab.image is SanityImageSource, not a plain string, so it cannot be
    // assigned to url: string directly as the original code attempted.
    return { type: 'image', url: imageBuilder.image(lab.image).width(600).height(600).url() };
  }
  return { type: 'image', url: `https://picsum.photos/600/600?random=${seed}` };
}

const toOdd = (n: number) => (n % 2 === 0 ? n - 1 : n);

const InfiniteCanvas = ({ labs }: InfiniteCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!labs.length || !containerRef.current) return;

    gsap.set(containerRef.current, { willChange: 'transform' });

    const rowNum = 7;
    // const rowNum = toOdd(Math.min(5, labs.length));
    const rowClass = styles.row;
    const imageClass = styles.sliderImage;
    const imageSelector = '.' + imageClass;

    const imgNum = 13;
    // const imgNum = toOdd(Math.min(9, labs.length));
    const totalCells = rowNum * imgNum;



    // Pass a stable index as seed so fallback picsum URLs are deterministic
    // and don't change between renders.
    const cellMedia = Array.from({ length: totalCells }, (_, i) =>
      getLabMedia(labs[i % labs.length], i)
    );

    const rowArray: HTMLDivElement[] = [];
    const imgRep: HTMLDivElement[][] = [];
    const containerRows: HTMLDivElement[] = [];

    let boxWidth: number,
      boxHeight: number,
      gutter: number,
      horizSpacing: number,
      vertSpacing: number,
      horizOffset: number,
      vertOffset: number,
      lastCenteredElem: HTMLElement;

    const imgMidIndex = Math.floor(imgNum / 2);
    const rowMidIndex = Math.floor(rowNum / 2);

    const useInertia = true;
    const useCenterGrid = false;

    let loadedCount = 0;
    const loaderTimeout = setTimeout(() => setIsLoading(false), 5000);

    function onMediaLoaded() {
      loadedCount++;
      if (loadedCount >= totalCells) {
        clearTimeout(loaderTimeout);
        setIsLoading(false);
      }
    }

    function createImageGrid() {
      const container = containerRef.current!;

      for (let y = 0; y < rowNum; y++) {
        const row = document.createElement('div');
        row.className = rowClass;
        // Initialize data-offset on the element directly so dataset.offset is always
        // defined when checkPositions reads it. Previously this was set inconsistently
        // via gsap attr:{} only for some rows inside resize().
        row.dataset.offset = y % 2 === 0 ? 'false' : 'true';

        const rowImgs: HTMLDivElement[] = [];

        for (let x = 0; x < imgNum; x++) {
          const cellIndex = y * imgNum + x;
          const media = cellMedia[cellIndex];
          const lab = labs[cellIndex % labs.length];
          const cell = document.createElement('div');
          cell.className = imageClass;
          cell.dataset.cellIndex = String(cellIndex);

          if (media.type === 'video') {
            const video = document.createElement('video');
            video.src = media.url;
            video.autoplay = false;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.className = styles.cellVideo;

            video.addEventListener('canplay', onMediaLoaded, { once: true });
            video.addEventListener('error', onMediaLoaded, { once: true });
            cell.appendChild(video);

            cell.addEventListener('mouseenter', () => video.play());
            cell.addEventListener('mouseleave', () => video.pause());
          } else {
            const img = new Image();
            img.onload = onMediaLoaded;
            img.onerror = onMediaLoaded;
            img.src = media.url;
            cell.style.backgroundImage = `url(${media.url})`;
          }

          // Fixed operator precedence bug: `lab.title + ' - ' + lab.tech || ''`
          // evaluated as `(lab.title + ' - ' + lab.tech) || ''`, making the
          // fallback unreachable. Now uses ?? scoped only to lab.tech.
          const title = document.createElement('div');
          title.className = styles.cellTitle;
          title.textContent = `${lab.title} - ${lab.tech ?? ''}`;
          cell.appendChild(title);

          row.appendChild(cell);
          rowImgs.push(cell);
        }

        container.appendChild(row);
        containerRows.push(row);
        imgRep.push(rowImgs);
      }
    }

    function moveArrayIndex<T>(array: T[], oldIndex: number, newIndex: number): T[] {
      const clamped = Math.min(newIndex, array.length - 1);
      array.splice(clamped, 0, array.splice(oldIndex, 1)[0]);
      return array;
    }

    function recycleRowsUp(steps: number) {
      // BUG FIX: Previously the loop used the original rowIndex to determine iteration
      // count, but moveArrayIndex mutates the array each iteration, making subsequent
      // reads use stale positions. Now we always recycle exactly `steps` times using
      // the current head/tail of the array — no stale index involved.
      for (let i = 0; i < steps; i++) {
        const rowY = gsap.getProperty(rowArray[0], 'y') as number;
        const last = rowArray[rowArray.length - 1];
        const isOffset = last.dataset.offset === 'true';

        if (rowArray.length % 2 === 1) {
          if (isOffset) {
            gsap.set(last, { y: rowY - gutter - boxHeight, x: '+=' + boxWidth / 2 });
            last.dataset.offset = 'false';
          } else {
            gsap.set(last, { y: rowY - gutter - boxHeight, x: '-=' + boxWidth / 2 });
            last.dataset.offset = 'true';
          }
        } else {
          gsap.set(last, { y: rowY - gutter - boxHeight });
        }

        moveArrayIndex(imgRep, imgRep.length - 1, 0);
        moveArrayIndex(rowArray, rowArray.length - 1, 0);
      }
    }

    function recycleRowsDown(steps: number) {
      for (let i = 0; i < steps; i++) {
        const rowY = gsap.getProperty(rowArray[rowArray.length - 1], 'y') as number;
        const first = rowArray[0];
        const isOffset = first.dataset.offset === 'true';

        if (rowArray.length % 2 === 1) {
          if (isOffset) {
            gsap.set(first, { y: rowY + gutter + boxHeight, x: '-=' + boxWidth / 2 });
            first.dataset.offset = 'false';
          } else {
            gsap.set(first, { y: rowY + gutter + boxHeight, x: '+=' + boxWidth / 2 });
            first.dataset.offset = 'true';
          }
        } else {
          gsap.set(first, { y: rowY + gutter + boxHeight });
        }

        moveArrayIndex(imgRep, 0, imgRep.length - 1);
        moveArrayIndex(rowArray, 0, rowArray.length - 1);
      }
    }

    function recycleColsLeft(steps: number) {
      for (let rn = 0; rn < imgRep.length; rn++) {
        const row = imgRep[rn];
        for (let i = 0; i < steps; i++) {
          const imgX = gsap.getProperty(row[0], 'x') as number;
          gsap.set(row[row.length - 1], { x: imgX - gutter - boxWidth });
          moveArrayIndex(row, row.length - 1, 0);
        }
      }
    }

    function recycleColsRight(steps: number) {
      for (let rn = 0; rn < imgRep.length; rn++) {
        const row = imgRep[rn];
        for (let i = 0; i < steps; i++) {
          const imgX = gsap.getProperty(row[imgNum - 1], 'x') as number;
          gsap.set(row[0], { x: imgX + gutter + boxWidth });
          moveArrayIndex(row, 0, row.length - 1);
        }
      }
    }

    function checkPositions(elem: HTMLElement) {
      if (!rowArray.length) return;

      let rowIndex = -1;
      let imgIndex = -1;

      imgRep.forEach((row, i) => {
        row.forEach((img, j) => {
          if (elem.isSameNode(img)) {
            rowIndex = i;
            imgIndex = j;
          }
        });
      });

      if (rowIndex === -1) return;

      // Compute steps once before any mutation so the counts stay correct.
      const rowStepsUp = rowMidIndex - rowIndex;
      const rowStepsDown = rowIndex - rowMidIndex;
      const colStepsLeft = imgMidIndex - imgIndex;
      const colStepsRight = imgIndex - imgMidIndex;

      if (rowStepsUp > 0) recycleRowsUp(rowStepsUp);
      else if (rowStepsDown > 0) recycleRowsDown(rowStepsDown);

      if (colStepsLeft > 0) recycleColsLeft(colStepsLeft);
      else if (colStepsRight > 0) recycleColsRight(colStepsRight);
    }

    function findCenterCell(): HTMLElement | null {
      // BUG FIX: Previously only the exact center pixel was probed. During fast drags
      // the center often lands on a gap between cells, returning nothing and skipping
      // recycling entirely. Now we probe a 3x3 grid of sample points around the center
      // so a cell is found even when the center pixel falls in a gutter.
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const offsets = [-boxWidth * 0.3, 0, boxWidth * 0.3];

      for (const dx of offsets) {
        for (const dy of offsets) {
          const elems = document.elementsFromPoint(cx + dx, cy + dy);
          for (const el of elems) {
            if (el.matches(imageSelector)) return el as HTMLElement;
          }
        }
      }
      return null;
    }

    function updateCenterElem() {
      const cell = findCenterCell();
      if (cell && !lastCenteredElem?.isSameNode(cell)) {
        lastCenteredElem = cell;
        checkPositions(lastCenteredElem);
      }
    }

    function centerGrid() {
      if (!lastCenteredElem) return;
      const bcr = lastCenteredElem.getBoundingClientRect();
      const x = window.innerWidth / 2 - (bcr.x + bcr.width / 2);
      const y = window.innerHeight / 2 - (bcr.y + bcr.height / 2);
      gsap.to(containerRef.current, { ease: 'sine.inOut', duration: 0.7, x: '+=' + x, y: '+=' + y });
    }

    let mouseRaf: number;
    let isDragging = false;
    // Tracks the container's resting position after each drag/throw so that mouse
    // parallax is applied as an offset ON TOP of it. Previously, parallax tweened
    // to absolute values near 0,0, snapping the grid back to its initial position
    // whenever the mouse moved after a drag.
    let dragRestX = 0;
    let dragRestY = 0;

    function onMouseMove(e: MouseEvent) {
      if (isDragging) return;
      cancelAnimationFrame(mouseRaf);
      mouseRaf = requestAnimationFrame(() => {
        const maxDrift = 60;
        const parallaxX = (e.clientX / window.innerWidth - 0.5) * -maxDrift;
        const parallaxY = (e.clientY / window.innerHeight - 0.5) * -maxDrift;

        gsap.to(containerRef.current, {
          x: dragRestX + parallaxX,
          y: dragRestY + parallaxY,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: updateCenterElem,
        });
      });
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      gsap.killTweensOf(containerRef.current);

      const currentX = gsap.getProperty(containerRef.current, 'x') as number;
      const currentY = gsap.getProperty(containerRef.current, 'y') as number;

      dragRestX = currentX - e.deltaX;
      dragRestY = currentY - e.deltaY;

      gsap.to(containerRef.current, {
        x: dragRestX,
        y: dragRestY,
        duration: 0.1,
        ease: 'power1.out',
        onUpdate: updateCenterElem,
      });
    }

    // Store Draggable instance so it can be killed on cleanup and doesn't leak.
    let draggableInstance: Draggable[] | null = null;

    function createDraggable() {
      draggableInstance = Draggable.create(containerRef.current, {
        trigger: '.' + styles.wrapper,
        dragResistance: 0.6,
        resistance: 400,
        onDragStart() {
          isDragging = true;
          cancelAnimationFrame(mouseRaf);
          gsap.killTweensOf(containerRef.current);
        },
        onDrag: updateCenterElem,
        inertia: useInertia,
        onThrowUpdate: useInertia ? updateCenterElem : undefined,
        onThrowComplete() {
          isDragging = false;
          // Capture resting position so mouse parallax offsets from here, not the origin.
          dragRestX = gsap.getProperty(containerRef.current, 'x') as number;
          dragRestY = gsap.getProperty(containerRef.current, 'y') as number;
          if (useInertia && useCenterGrid) centerGrid();
        },
        onDragEnd() {
          if (!useInertia) {
            isDragging = false;
            dragRestX = gsap.getProperty(containerRef.current, 'x') as number;
            dragRestY = gsap.getProperty(containerRef.current, 'y') as number;
            if (useCenterGrid) centerGrid();
          }
        },
      });
    }

    function resize() {
      boxWidth = innerWidth * 0.33;
      boxHeight = boxWidth * 0.8;
      gutter = innerWidth * 0.05;
      horizSpacing = boxWidth + gutter;
      vertSpacing = boxHeight + gutter;
      horizOffset = -(imgMidIndex * horizSpacing + boxWidth / 2) + innerWidth / 2;
      vertOffset = -(rowMidIndex * vertSpacing + boxHeight / 2) + innerHeight / 2;

      gsap.set(containerRef.current, { x: 0, y: 0 });

      containerRows.forEach((row, i) => {
        gsap.set(row, {
          x: i % 2 === 0 ? horizOffset : horizOffset - boxWidth / 2,
          y: i * vertSpacing + vertOffset,
        });
        gsap.set(row.querySelectorAll(imageSelector), {
          width: boxWidth,
          height: boxHeight,
          x: (index: number) => index * horizSpacing,
        });
        rowArray[i] = row;
      });
    }

    function setStyles() {
      gsap.set('body', { margin: 0, overflow: 'hidden' });
      gsap.set('.' + styles.row, { position: 'absolute' });
      gsap.set(imageSelector, { position: 'absolute', top: 0, left: 0 });
    }

    createImageGrid();
    createDraggable();
    setStyles();
    resize();

    const allImages = containerRef.current.querySelectorAll(imageSelector);
    lastCenteredElem = allImages[rowMidIndex * imgNum + imgMidIndex] as HTMLElement;

    const wrapperEl = document.querySelector('.' + styles.wrapper) as HTMLElement;
    wrapperEl?.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      clearTimeout(loaderTimeout);
      cancelAnimationFrame(mouseRaf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      wrapperEl?.removeEventListener('wheel', onWheel);
      draggableInstance?.forEach((d) => d.kill());
      gsap.killTweensOf(containerRef.current);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [labs]);

  return (
    <div className={styles.wrapper}>
      <Loader isLoading={isLoading} />
      <div ref={containerRef} id='imageContainer' className={styles.container} />
    </div>
  );
};

export default InfiniteCanvas;