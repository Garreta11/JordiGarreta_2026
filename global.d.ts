export {};

declare global {
  interface Window {
    exitHomeSketch?: (callback: () => void) => void;
  }
}