// Custom type definitions for react-signature-canvas
// Since the original package doesn't have proper TypeScript types for refs

declare module "react-signature-canvas" {
  import * as React from "react";

  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    penColor?: string;
    backgroundColor?: string;
    dotSize?: number;
    minWidth?: number;
    maxWidth?: number;
    throttle?: number;
    velocityFilterWeight?: number;
    readOnly?: boolean;
    onEnd?: () => void;
  }

  export interface SignatureCanvasMethods {
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: (type?: string, encoderOptions?: number) => string;
    fromDataURL: (dataURL: string) => void;
    toData: () => any;
    fromData: (data: any) => void;
    on: () => void;
    off: () => void;
    getCanvas: () => HTMLCanvasElement;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromDataURL(dataURL: string): void;
    toData(): any;
    fromData(data: any): void;
    on(): void;
    off(): void;
    getCanvas(): HTMLCanvasElement;
  }
}
