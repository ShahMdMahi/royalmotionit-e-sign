"use client";

import { forwardRef, useRef, useImperativeHandle, ForwardRefRenderFunction } from "react";
import dynamic from "next/dynamic";

// Import SignatureCanvas with SSR disabled and explicitly type it
const SignatureCanvas = dynamic<any>(() => import("react-signature-canvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/20">Loading signature pad...</div>,
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

const ClientSignatureCanvas: ForwardRefRenderFunction<SignatureCanvasRef, ClientSignatureCanvasProps> = ({ canvasProps, penColor }, ref) => {
  // Define a more specific type for the SignatureCanvas instead of 'any'
  const sigCanvas = useRef<{
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: (type?: string, encoderOptions?: number) => string;
  }>(null);

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
  // We're using a callback ref to properly handle the dynamic component
  const setSignatureCanvasRef = (el: any) => {
    sigCanvas.current = el;
  };

  return <SignatureCanvas canvasProps={canvasProps} penColor={penColor} ref={setSignatureCanvasRef} />;
};

// Add display name for better debugging
const ForwardedClientSignatureCanvas = forwardRef(ClientSignatureCanvas);
ForwardedClientSignatureCanvas.displayName = "ClientSignatureCanvas";

export default ForwardedClientSignatureCanvas;
