// Type definitions for libheif-js
declare module "libheif-js" {
  export interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      buffer: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
      },
      callback: (displayData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
      }) => void
    ): void;
  }

  export class HeifDecoder {
    constructor();
    decode(data: Uint8Array): HeifImage[];
  }

  const libheif: {
    HeifDecoder: typeof HeifDecoder;
  };

  export default libheif;
}

