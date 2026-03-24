export {};

declare global {
  interface Window {
    exitHomeSketch?: (callback: () => void) => void;
  }
}

declare module '*.glsl' { const value: string; export default value; }
declare module '*.vert' { const value: string; export default value; }
declare module '*.frag' { const value: string; export default value; }