declare module "@redisrupt/svg-morpheus" {
  export default class SVGMorpheus {
    constructor(
      element: Element | string,
      options?: {
        iconId?: string;
        duration?: number;
        easing?: string;
        rotation?: string;
      },
      callback?: () => void
    );
    to(
      iconId: string,
      options?: {
        duration?: number;
        easing?: string;
        rotation?: string;
      },
      callback?: () => void
    ): void;
  }
}
