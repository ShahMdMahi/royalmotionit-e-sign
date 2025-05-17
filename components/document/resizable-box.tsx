"use client";

import { useEffect, useState } from "react";
import { useResizeDetector, OnResizeCallback } from "react-resize-detector";
import { cn } from "@/lib/utils";
import { handleResizeAction } from "@/actions/resizable-box-actions";

interface ResizableBoxProps {
  width: number;
  height: number;
  children: React.ReactNode;
  onResizeAction?: typeof handleResizeAction;
  minConstraints?: [number, number];
  maxConstraints?: [number, number];
  isResizable?: boolean;
  className?: string;
}

export function ResizableBox({
  width,
  height,
  children,
  onResizeAction = handleResizeAction,
  minConstraints = [50, 30],
  maxConstraints = [1000, 500],
  isResizable = true,
  className,
}: ResizableBoxProps) {
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false); // Resize detector ref
  const { ref } = useResizeDetector({
    handleWidth: true,
    handleHeight: true,
    onResize: function (payload) {
      const width = payload?.width;
      const height = payload?.height;
      if (width && height && isResizing) {
        // Constrain dimensions
        const constrainedWidth = Math.max(
          minConstraints[0],
          Math.min(maxConstraints[0], width),
        );
        const constrainedHeight = Math.max(
          minConstraints[1],
          Math.min(maxConstraints[1], height),
        );

        setCurrentWidth(constrainedWidth);
        setCurrentHeight(constrainedHeight);
      }
    } as OnResizeCallback,
  });

  // Apply dimensions from props
  useEffect(() => {
    if (!isResizing) {
      setCurrentWidth(width);
      setCurrentHeight(height);
    }
  }, [width, height, isResizing]); // Handle resize end
  useEffect(() => {
    const handleResizeEnd = async () => {
      if (isResizing) {
        setIsResizing(false);
        if (onResizeAction) {
          await onResizeAction(currentWidth, currentHeight);
        }
      }
    };

    window.addEventListener("mouseup", handleResizeEnd);
    window.addEventListener("touchend", handleResizeEnd);

    return () => {
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing, currentWidth, currentHeight, onResizeAction]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isResizable) {
      setIsResizing(true);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full select-none",
        isResizing && "cursor-nwse-resize",
        className,
      )}
      style={{
        minWidth: minConstraints[0],
        minHeight: minConstraints[1],
        maxWidth: maxConstraints[0],
        maxHeight: maxConstraints[1],
      }}
    >
      {children}

      {isResizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className="text-muted-foreground"
          >
            <path
              d="M0 10H2V8H0V10ZM0 7H2V5H0V7ZM3 10H5V8H3V10ZM6 10H8V8H6V10ZM3 7H5V5H3V7Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
