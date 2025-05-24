"use client";

import { useRef, useState, useEffect } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eraser, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSignatureChange } from "@/actions/signature-capture-actions";

interface SignatureCaptureProps {
  defaultValue?: string;
  onChangeAction?: typeof handleSignatureChange;
  height?: number;
  width?: number;
  readOnly?: boolean;
  className?: string;
  label?: string;
  type?: "signature" | "initial";
}

// Augment the original react-signature-canvas module
declare module "react-signature-canvas" {
  interface SignatureCanvasProps {
    readOnly?: boolean;
  }
}

const fontOptions = [
  { value: "Homemade Apple", label: "Signature" },
  { value: "Sacramento", label: "Handwriting" },
  { value: "Roboto", label: "Regular" },
  { value: "Times New Roman", label: "Classic" },
];

export function SignatureCapture({
  defaultValue,
  onChangeAction = handleSignatureChange,
  height = 200,
  width = 400,
  readOnly = false,
  className,
  label = "Signature",
  type = "signature",
}: SignatureCaptureProps) {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState("Homemade Apple");
  const [isEmpty, setIsEmpty] = useState(true);

  const signatureRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for responsive canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState(width);
  const [canvasHeight, setCanvasHeight] = useState(height);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update canvas dimensions on window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setCanvasWidth(Math.min(containerWidth - 32, width)); // -32 for padding

        // Adjust height proportionally if needed
        if (containerWidth < width) {
          const ratio = (containerWidth - 32) / width;
          setCanvasHeight(height * ratio);
        } else {
          setCanvasHeight(height);
        }
      }
    };

    handleResize(); // Initial call

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height, width]);

  // Initialize with default value if provided
  useEffect(() => {
    if (defaultValue && signatureRef.current) {
      if (defaultValue.startsWith("data:image")) {
        const img = new Image();
        img.onload = () => {
          const canvas = signatureRef.current?.getCanvas();
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              setIsEmpty(false);
            }
          }
        };
        img.src = defaultValue;
      } else if (mode === "type") {
        setTypedName(defaultValue);
      }
    }
  }, [defaultValue, mode]);

  // Reset when mode changes
  useEffect(() => {
    if (mode === "draw" && signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    } else if (mode === "type") {
      setTypedName("");
    }
  }, [mode]);

  // Handle drawn signature changes
  const handleDrawEnd = () => {
    if (signatureRef.current) {
      const isEmpty = signatureRef.current.isEmpty();
      setIsEmpty(isEmpty);

      if (!isEmpty) {
        const dataURL = signatureRef.current.toDataURL();
        // Asynchronously call the action without awaiting
        onChangeAction(dataURL);
      }
    }
  };
  // Handle typed signature changes
  const handleTypedChange = async (value: string) => {
    setTypedName(value);
    if (value.trim()) {
      // Generate a canvas with the typed signature
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate font size based on canvas dimensions and text length
        const fontSize = Math.min(
          40,
          Math.max(20, (canvas.width / value.length) * 1.5),
        );
        ctx.font = `${fontSize}px "${selectedFont}"`;
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(value, canvas.width / 2, canvas.height / 2);

        const dataURL = canvas.toDataURL();
        await onChangeAction(dataURL);
        setIsEmpty(false);
      }
    } else {
      setIsEmpty(true);
    }
  };

  // Handle font changes
  const handleFontChange = async (value: string) => {
    setSelectedFont(value);
    if (typedName) {
      await handleTypedChange(typedName);
    }
  };
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Fill with white background for transparent images
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate aspect ratio to fit image in canvas
            const scale =
              Math.min(canvas.width / img.width, canvas.height / img.height) *
              0.9; // 90% of max size for padding

            const x = canvas.width / 2 - (img.width / 2) * scale;
            const y = canvas.height / 2 - (img.height / 2) * scale;

            // Improve image rendering quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Draw with white background for transparent PNGs
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            const dataURL = canvas.toDataURL();
            await onChangeAction(dataURL);
            setIsEmpty(false);

            // Also set in the signature canvas if we're in draw mode
            if (mode === "draw" && signatureRef.current) {
              const sigCanvas = signatureRef.current.getCanvas();
              const sigCtx = sigCanvas.getContext("2d");
              if (sigCtx) {
                sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                sigCtx.drawImage(
                  img,
                  x,
                  y,
                  img.width * scale,
                  img.height * scale,
                );
              }
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear signature
  const handleClear = async () => {
    if (mode === "draw" && signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    } else if (mode === "type") {
      setTypedName("");
      setIsEmpty(true);
    } else if (mode === "upload") {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsEmpty(true);
    }
    await onChangeAction("");
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col space-y-4", className)}
    >
      <Tabs
        defaultValue={mode}
        value={mode}
        onValueChange={(value) => setMode(value as "draw" | "type" | "upload")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="draw" className="w-full">
          <div className="border rounded-md bg-background">
            <div className="w-full flex justify-center">
              <SignatureCanvasLib
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  className: "rounded-md",
                  height: canvasHeight,
                  width: canvasWidth,
                  style: {
                    touchAction: "none",
                    cursor: readOnly ? "default" : "crosshair",
                    backgroundColor: "#ffffff", // Ensure white background
                  },
                }}
                onEnd={handleDrawEnd}
                readOnly={readOnly}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="type" className="w-full space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {type === "signature" ? "Full Name" : "Initials"}
              </Label>
              <Input
                id="name"
                value={typedName}
                onChange={(e) => handleTypedChange(e.target.value)}
                placeholder={
                  type === "signature"
                    ? "Type your full name"
                    : "Type your initials"
                }
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font">Font Style</Label>
              <Select
                value={selectedFont}
                onValueChange={handleFontChange}
                disabled={readOnly}
              >
                <SelectTrigger id="font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className="border rounded-md p-4 flex items-center justify-center bg-background"
            style={{
              height: canvasHeight,
              width: "100%",
              fontFamily: selectedFont,
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: "40px" }}>{typedName || "Preview"}</span>
          </div>
        </TabsContent>
        <TabsContent value="upload" className="w-full space-y-4">
          <div className="flex items-center justify-center border-2 border-dashed rounded-md p-8 bg-background h-48">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upload signature image (PNG, JPG)
              </span>
              <p className="text-xs text-muted-foreground">
                For best results, use a dark signature on white background
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                disabled={readOnly}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={readOnly}
              >
                Choose File
              </Button>
            </div>
          </div>
          {!isEmpty && (
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Image uploaded successfully
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty || readOnly}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Clear
        </Button>

        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mode === "draw" && signatureRef.current) {
                const dataURL = signatureRef.current.toDataURL();
                const link = document.createElement("a");
                link.download = `${label.toLowerCase()}.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            disabled={isEmpty}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
