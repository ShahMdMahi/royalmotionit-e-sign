"use client";

import { forwardRef, useRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import type {
  SignatureCanvasMethods,
  SignatureCanvasProps,
} from "react-signature-canvas";
import React from "react";

// Create a typed interface for the dynamically imported component
interface DynamicSignatureCanvasProps extends SignatureCanvasProps {
  ref?: React.Ref<SignatureCanvasMethods>;
}

// Dynamically import SignatureCanvas with SSR disabled
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as React.ComponentType<DynamicSignatureCanvasProps>;

// Create types for the signature canvas
export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
}

interface SignatureCanvasWrapperProps {
  penColor?: string;
  canvasProps?: React.DetailedHTMLProps<
    React.CanvasHTMLAttributes<HTMLCanvasElement>,
    HTMLCanvasElement
  >;
}

// Create a forwardRef wrapper component for SignatureCanvas
const SignatureCanvasWrapper = forwardRef<
  SignatureCanvasRef,
  SignatureCanvasWrapperProps
>((props, ref) => {
  const { penColor = "black", canvasProps = {} } = props;
  const signatureRef = useRef<SignatureCanvasMethods>(null);

  // Forward the methods we need from the SignatureCanvas component
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    },
    isEmpty: () => {
      if (signatureRef.current) {
        return signatureRef.current.isEmpty();
      }
      return true;
    },
    toDataURL: (type?: string, encoderOptions?: number) => {
      if (signatureRef.current) {
        return signatureRef.current.toDataURL(type, encoderOptions);
      }
      return "";
    },
  }));

  return (
    <SignatureCanvas
      ref={signatureRef}
      penColor={penColor}
      canvasProps={canvasProps}
    />
  );
});

SignatureCanvasWrapper.displayName = "SignatureCanvasWrapper";

export default SignatureCanvasWrapper;
