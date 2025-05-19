"use client";

import {
  forwardRef,
  useRef,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from "react";
import dynamic from "next/dynamic";

// Import SignatureCanvas with SSR disabled
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      Loading signature pad...
    </div>
  ),
});

export interface ClientSignatureCanvasProps {
  canvasProps: {
    className?: string;
    style?: React.CSSProperties;
  };
  penColor?: string;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
}

const ClientSignatureCanvas: ForwardRefRenderFunction<
  SignatureCanvasRef,
  ClientSignatureCanvasProps
> = ({ canvasProps, penColor }, ref) => {
  const sigCanvas = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (sigCanvas.current) {
        sigCanvas.current.clear();
      }
    },
    isEmpty: () => {
      if (sigCanvas.current) {
        return sigCanvas.current.isEmpty();
      }
      return true;
    },
    toDataURL: (type?: string, encoderOptions?: number) => {
      if (sigCanvas.current) {
        return sigCanvas.current.toDataURL(type, encoderOptions);
      }
      return "";
    },
  }));
  // @ts-ignore - react-signature-canvas typing issue with refs  // TypeScript doesn't understand how to properly type the ref for SignatureCanvas
  // Using the dynamic import with custom typing makes this challenging
  // @ts-ignore - This is a valid usage, the component accepts these props
  return (
    <SignatureCanvas
      ref={sigCanvas}
      canvasProps={canvasProps}
      penColor={penColor}
    />
  );
};

// Add display name for better debugging
const ForwardedClientSignatureCanvas = forwardRef(ClientSignatureCanvas);
ForwardedClientSignatureCanvas.displayName = "ClientSignatureCanvas";

export default ForwardedClientSignatureCanvas;
