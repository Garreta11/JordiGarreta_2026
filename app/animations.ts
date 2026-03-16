import gsap from "gsap";

gsap.defaults({
  ease: "expo.inOut",
});

/* ----------------------------------
   HOME EXIT
   ---------------------------------- */

export const fadeOutHomeText = (
  projectEl: HTMLElement,
  descriptionEl: HTMLElement,
  bgEls: HTMLElement[]
) => {
  const tl = gsap.timeline();
  tl.to([projectEl, descriptionEl], {
    opacity: 0,
    y: -20,
    duration: 0.5,
    ease: "power2.out",
    stagger: 0.05,
  })
  .to(bgEls, {
    opacity: 0,
    scale: 1.05,
    duration: 0.6,
    ease: "power2.out",
  }, "-=0.2");
  return tl;
};

/* ----------------------------------
   HOME INTRO
   ---------------------------------- */

export const slideInSlider = (containerEl: HTMLElement) => {
  return gsap.fromTo(
    containerEl,
    { y: "120vh", rotateX: -45, opacity: 0, transformOrigin: "center bottom" },
    { y: "0vh", rotateX: 0, opacity: 1, duration: 1.4, ease: "expo.out" }
  );
};

export const staggerInHomeText = (
  projectEl: HTMLElement,
  descriptionEl: HTMLElement
) => {
  return gsap.fromTo(
    [descriptionEl, projectEl],
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.1 }
  );
};

export const homePageIntro = (
  containerEl: HTMLElement,
  projectEl: HTMLElement,
  descriptionEl: HTMLElement
) => {
  const tl = gsap.timeline();
  tl.add(slideInSlider(containerEl)).add(
    staggerInHomeText(projectEl, descriptionEl),
    "-=0.6"
  );
  return tl;
};

/* ----------------------------------
   POST PAGE EXIT
   ---------------------------------- */

export const slideOutPostContent = (
  infoEl: HTMLElement,
  mediaItems: HTMLElement[],
  detailsEl: HTMLElement,
  bgEl: HTMLElement
) => {
  const tl = gsap.timeline();

  tl.to([infoEl, detailsEl], {
    opacity: 0,
    y: -30,
    duration: 0.5,
    ease: "power2.in",
    stagger: 0.05,
  })
    .to(mediaItems, {
      opacity: 0,
      y: -40,
      duration: 0.5,
      ease: "power2.in",
      stagger: 0.04,
    }, "<")
    .to(bgEl, {
      opacity: 0,
      scale: 1.05,
      duration: 0.6,
      ease: "power2.in",
    }, "-=0.2");

  return tl;
};

/* ----------------------------------
   POST PAGE INTRO
   ---------------------------------- */

export const fadeInBg = (bgEl: HTMLElement) => {
  return gsap.fromTo(
    bgEl,
    { opacity: 0, scale: 0 },
    { opacity: 1, scale: 1.05, duration: 0.9, ease: "expo.out" }
  );
};

export const fadeInInfo = (infoEl: HTMLElement) => {
  return gsap.fromTo(
    infoEl,
    { opacity: 0, translateX: -40 },
    { opacity: 1, translateX: 0, duration: 0.9, ease: "expo.out" }
  );
};

export const fadeInMedia = (mediaItems: HTMLElement[]) => {
  return gsap.fromTo(
    mediaItems,
    { opacity: 0, translateY: 60 },
    { opacity: 1, translateY: 0, duration: 0.9, ease: "expo.out", stagger: 0.12 }
  );
};

export const fadeInDetails = (detailsEl: HTMLElement) => {
  return gsap.fromTo(
    detailsEl,
    { opacity: 0, translateX: -40 },
    { opacity: 1, translateX: 0, duration: 0.9, ease: "expo.out" }
  );
};

export const postPageIntro = (
  bgEl: HTMLElement,
  infoEl: HTMLElement,
  mediaItems: HTMLElement[],
  detailsEl: HTMLElement
) => {
  const tl = gsap.timeline();
  tl.add(fadeInBg(bgEl))
    .add(fadeInInfo(infoEl))
    .add(fadeInMedia(mediaItems), "-=0.5")
    .add(fadeInDetails(detailsEl), "-=0.6");
  return tl;
};

/* ----------------------------------
   ABOUT PAGE INTRO
   ---------------------------------- */

   export const aboutPageIntro = (
    stackEl: HTMLElement,
    descEl: HTMLElement,
    achievementsEl: HTMLElement
  ) => {
    const tl = gsap.timeline();
    tl.fromTo(stackEl, 
      { opacity: 0, x: -40 }, 
      { opacity: 1, x: 0, duration: 0.9, ease: "expo.out" }, 
    )
    .fromTo(descEl, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" }, 
      "-=0.7"
    )
    .fromTo(achievementsEl, 
      { opacity: 0, x: 40 }, 
      { opacity: 1, x: 0, duration: 0.9, ease: "expo.out" }, 
      "-=0.8"
    );
  
    return tl;
  };
  
  /* ----------------------------------
     ABOUT PAGE EXIT
     ---------------------------------- */
  
  export const aboutPageExit = (
    els: HTMLElement[],
    onComplete: () => void
  ) => {
    const tl = gsap.timeline({ onComplete });
  
    tl.to(els, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.inOut"
    })
  
    return tl;
  };

  /* ----------------------------------
     LAB EXIT
     ---------------------------------- */

  export const labExit = (
    els: HTMLElement[],
    onComplete: () => void
  ) => {
    const tl = gsap.timeline({ onComplete });
    tl.to(els, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      stagger: 0.01,
      ease: "power2.inOut"
    })
    return tl;
  };