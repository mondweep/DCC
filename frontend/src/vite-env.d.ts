/// <reference types="vite/client" />

// Declare JSON modules
declare module '*.json' {
  const value: any;
  export default value;
}
