import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Trash2, Save, Download, Undo, Repeat, Image as ImageIcon, CheckCircle, RotateCw, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

// Use universal imports for touch events support (mobile + desktop)
import HammerJS from "hammerjs";
import { isMobile, isTablet } from "react-device-detect";

// Define interfaces for properly typed hammer.js usage
interface HammerEvent {
  scale: number;
  rotation: number;
}

// Use the imported HammerJS directly rather than trying to redefine its types
// This avoids type conflicts with the actual Hammer.js library

export interface SignatureData {
  id: string;
  type: "draw" | "type";
  imageData?: string;
  textContent?: string;
  font?: string;
  color: string;
  createdAt: Date;
  name?: string;
  creatorId?: string;
}

interface EnhancedSignaturePadProps {
  onSave?: (signatureData: SignatureData) => void;
  defaultSignature?: SignatureData | null;
  signerId?: string;
  signerName?: string;
  readOnly?: boolean;
  signaturePosition?: { pageNumber: number; x: number; y: number; width: number; height: number };
}

export function EnhancedSignaturePad({ onSave, defaultSignature = null, signerId, signerName, readOnly = false, signaturePosition }: EnhancedSignaturePadProps) {
  // Refs
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureHistory = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  // State
  const [signatureType, setSignatureType] = useState<"draw" | "type">(defaultSignature?.type || "draw");
  const [typedSignature, setTypedSignature] = useState<string>(defaultSignature?.textContent || "");
  const [signatureFont, setSignatureFont] = useState<string>(defaultSignature?.font || "Dancing Script");
  const [signatureColor, setSignatureColor] = useState<string>(defaultSignature?.color || "#000000");
  const [signatureName, setSignatureName] = useState<string>(defaultSignature?.name || signerName || "");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isEmpty, setIsEmpty] = useState<boolean>(!defaultSignature);
  const [isSaved, setIsSaved] = useState<boolean>(!!defaultSignature);
  const [useTimestamp, setUseTimestamp] = useState<boolean>(true);
  const [signatureTimestamp, setSignatureTimestamp] = useState<Date>(new Date());

  // Available fonts
  const availableFonts = [
    { name: "Dancing Script", className: "font-dancing-script" },
    { name: "Pacifico", className: "font-pacifico" },
    { name: "Satisfy", className: "font-satisfy" },
    { name: "Alex Brush", className: "font-alex-brush" },
    { name: "Great Vibes", className: "font-great-vibes" },
    { name: "Sacramento", className: "font-sacramento" },
  ];

  // Device detection for touch capabilities
  const isTouchDevice = isMobile || isTablet;

  // Load default signature if provided
  useEffect(() => {
    if (defaultSignature) {
      if (defaultSignature.type === "draw" && defaultSignature.imageData && signaturePadRef.current) {
        // Load image data into signature pad
        const image = document.createElement("img");
        image.src = defaultSignature.imageData;
        image.onload = () => {
          const canvas = signaturePadRef.current?.getCanvas();
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(image, 0, 0);
              setIsEmpty(false);
              setIsSaved(true);
              // Save initial state to history
              if (defaultSignature.imageData) {
                signatureHistory.current = [defaultSignature.imageData];
              }
            }
          }
        };
      } else if (defaultSignature.type === "type" && defaultSignature.textContent) {
        setTypedSignature(defaultSignature.textContent);
        setSignatureFont(defaultSignature.font || "Dancing Script");
        setIsEmpty(false);
        setIsSaved(true);
      }

      setSignatureColor(defaultSignature.color || "#000000");
      setSignatureName(defaultSignature.name || signerName || "");
    }
  }, [defaultSignature, signerName]);

  // Set up touch handling for mobile devices
  useEffect(() => {
    if (signaturePadRef.current && canvasRef.current) {
      // Initialize Hammer.js manager for touch gestures
      const hammerManager = new HammerJS.Manager(canvasRef.current);

      // Add recognizers
      const pinch = new HammerJS.Pinch();
      const rotate = new HammerJS.Rotate();
      pinch.recognizeWith(rotate);
      hammerManager.add([pinch, rotate]);

      // Handle pinch and rotation
      hammerManager.on("pinchrotate", (e) => {
        // Handle pinch for zoom
        setScale((prevScale) => Math.min(Math.max(prevScale * e.scale, 0.5), 3));

        // Handle rotation
        const rotation = e.rotation;
        if (Math.abs(rotation) > 15) {
          // Threshold to avoid accidental rotation
          setRotation((prev) => (prev + Math.sign(rotation) * 90) % 360);
        }
      });

      return () => {
        hammerManager.destroy();
      };
    }
  }, [isTouchDevice]);

  // Setup signature pad options
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      if (defaultSignature?.imageData && defaultSignature.type === "draw") {
        // Load the image into the canvas
        const img = document.createElement("img");
        img.onload = () => {
          if (signaturePadRef.current) {
            const canvas = signaturePadRef.current.getCanvas();
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          }
        };
        img.src = defaultSignature.imageData;
      }

      // Set signature pad options using the direct canvas approach
      const canvas = signaturePadRef.current.getCanvas();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = signatureColor;
        ctx.lineWidth = strokeWidth;
      }
    }
  }, [signatureColor, strokeWidth, defaultSignature]);

  // Save current state to history when drawing
  const handleBeginStroke = () => {
    if (signaturePadRef.current) {
      // Save current state before new stroke
      const currentState = signaturePadRef.current.toDataURL("image/png");
      signatureHistory.current.push(currentState);
      redoStack.current = []; // Clear redo stack when new stroke begins
    }
  };

  const handleEndStroke = () => {
    // Mark as not empty when a stroke is completed
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setIsEmpty(false);
      setIsSaved(false);
    }
  };

  // Undo/Redo functionality
  const handleUndo = () => {
    if (signaturePadRef.current && signatureHistory.current.length > 0) {
      // Save current state to redo stack
      const currentState = signaturePadRef.current.toDataURL("image/png");
      redoStack.current.push(currentState);

      // Pop the last state
      signatureHistory.current.pop();

      // Clear canvas
      signaturePadRef.current.clear();

      // If history isn't empty, restore the previous state
      if (signatureHistory.current.length > 0) {
        const previousState = signatureHistory.current[signatureHistory.current.length - 1];
        const img = document.createElement("img");
        img.src = previousState;
        img.onload = () => {
          const canvas = signaturePadRef.current?.getCanvas();
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
            }
          }
        };
      } else {
        // If history is empty, canvas is empty
        setIsEmpty(true);
      }

      setIsSaved(false);
    }
  };

  const handleRedo = () => {
    if (signaturePadRef.current && redoStack.current.length > 0) {
      // Get last redo state
      const redoState = redoStack.current.pop()!;

      // Save current state to history
      const currentState = signaturePadRef.current.toDataURL("image/png");
      signatureHistory.current.push(currentState);

      // Apply redo state
      signaturePadRef.current.clear();
      const img = document.createElement("img");
      img.src = redoState;
      img.onload = () => {
        const canvas = signaturePadRef.current?.getCanvas();
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
      };

      setIsEmpty(false);
      setIsSaved(false);
    }
  };

  // Clear signature
  const handleClear = () => {
    if (signatureType === "draw") {
      if (signaturePadRef.current) {
        // Save current state to history before clearing
        if (!signaturePadRef.current.isEmpty()) {
          const currentState = signaturePadRef.current.toDataURL("image/png");
          signatureHistory.current.push(currentState);
        }
        signaturePadRef.current.clear();
        redoStack.current = [];
      }
    } else {
      setTypedSignature("");
    }

    setIsEmpty(true);
    setIsSaved(false);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Handle rotation
  const handleRotate = (direction: "cw" | "ccw") => {
    setRotation((prev) => (direction === "cw" ? (prev + 90) % 360 : (prev - 90 + 360) % 360));
  };

  // Create typed signature canvas
  const createTypedSignatureImage = (): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    if (ctx && typedSignature) {
      // Create transparent background
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      ctx.font = `48px ${signatureFont}`;
      ctx.fillStyle = signatureColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Apply rotation if needed
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

      // Draw timestamp if enabled
      if (useTimestamp) {
        ctx.font = "12px Arial";
        const timestamp = signatureTimestamp.toISOString().split("T")[0];
        ctx.fillText(timestamp, canvas.width / 2, canvas.height / 2 + 60);
      }

      return canvas.toDataURL("image/png");
    }

    return "";
  };

  // Save signature
  const handleSaveSignature = () => {
    if (onSave) {
      let imageData = "";

      if (signatureType === "draw" && signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        imageData = signaturePadRef.current.toDataURL("image/png");
      } else if (signatureType === "type" && typedSignature.trim()) {
        imageData = createTypedSignatureImage();
      }

      if (imageData) {
        const signatureData: SignatureData = {
          id: defaultSignature?.id || `signature-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: signatureType,
          imageData,
          textContent: signatureType === "type" ? typedSignature : undefined,
          font: signatureType === "type" ? signatureFont : undefined,
          color: signatureColor,
          createdAt: new Date(),
          name: signatureName || signerName || "",
          creatorId: signerId,
        };

        onSave(signatureData);
        setIsSaved(true);
      }
    }
  };

  // Download signature as image
  const handleDownloadSignature = () => {
    let imageData = "";

    if (signatureType === "draw" && signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      imageData = signaturePadRef.current.toDataURL("image/png");
    } else if (signatureType === "type" && typedSignature.trim()) {
      imageData = createTypedSignatureImage();
    }

    if (imageData) {
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `signature-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Import image as signature
  const handleImportImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (signaturePadRef.current && event.target?.result) {
            // Clear current signature
            signaturePadRef.current.clear();

            // Create image from file
            const img = document.createElement("img");
            img.onload = () => {
              const canvas = signaturePadRef.current?.getCanvas();
              if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  // Resize image to fit canvas while maintaining aspect ratio
                  const hRatio = canvas.width / img.width;
                  const vRatio = canvas.height / img.height;
                  const ratio = Math.min(hRatio, vRatio);

                  const centerShiftX = (canvas.width - img.width * ratio) / 2;
                  const centerShiftY = (canvas.height - img.height * ratio) / 2;

                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);

                  // Update state
                  setIsEmpty(false);
                  setIsSaved(false);
                  setSignatureType("draw");

                  // Save to history
                  if (signaturePadRef.current) {
                    // Add null check
                    const currentState = signaturePadRef.current.toDataURL("image/png");
                    signatureHistory.current.push(currentState);
                    redoStack.current = [];
                  }
                }
              }
            };
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <Card className="w-full max-w-[600px] mx-auto bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Signature Pad</span>
          {readOnly && <Badge variant="outline">Read Only</Badge>}
          {isSaved && (
            <Badge variant="success" className="bg-green-500 text-white">
              Saved
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{readOnly ? "View the signature below" : `${defaultSignature ? "Edit your signature" : "Draw or type your signature"}`}</CardDescription>
      </CardHeader>

      <CardContent>
        {!readOnly && (
          <Tabs defaultValue={signatureType} value={signatureType} onValueChange={(value) => setSignatureType(value as "draw" | "type")} className="mb-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="draw" disabled={readOnly}>
                Draw
              </TabsTrigger>
              <TabsTrigger value="type" disabled={readOnly}>
                Type
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="mt-4">
              <div
                ref={containerRef}
                className="signature-container border rounded-md bg-white p-2 relative"
                style={{
                  transform: `scale(${scale})${rotation ? ` rotate(${rotation}deg)` : ""}`,
                  transformOrigin: "center",
                  transition: "transform 0.3s ease",
                }}
              >
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: `signature-canvas w-full border border-dashed rounded ${readOnly ? "pointer-events-none" : ""}`,
                    width: 500,
                    height: 200,
                    style: { width: "100%", height: 200 },
                  }}
                  backgroundColor={readOnly ? "rgba(230, 230, 230, 0.2)" : "rgba(255, 255, 255, 0)"}
                  penColor={signatureColor}
                  minWidth={strokeWidth}
                  maxWidth={strokeWidth * 2}
                  onBegin={handleBeginStroke}
                  onEnd={handleEndStroke}
                  clearOnResize={false}
                  dotSize={strokeWidth * 2}
                />
              </div>

              {!readOnly && (
                <div className="mt-4 space-y-4">
                  {/* Pen settings */}
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: signatureColor }} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <HexColorPicker color={signatureColor} onChange={setSignatureColor} />
                              <div className="grid grid-cols-8 gap-1 mt-2">
                                {["#000000", "#2563EB", "#9333EA", "#16A34A", "#DC2626", "#CA8A04", "#78716C", "#a37136"].map((color) => (
                                  <button key={color} className="w-5 h-5 rounded border cursor-pointer" style={{ backgroundColor: color }} onClick={() => setSignatureColor(color)} />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TooltipTrigger>
                        <TooltipContent>Ink Color</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select value={strokeWidth.toString()} onValueChange={(value) => setStrokeWidth(Number(value))}>
                            <SelectTrigger className="w-[80px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Thin</SelectItem>
                              <SelectItem value="2">Medium</SelectItem>
                              <SelectItem value="3">Thick</SelectItem>
                              <SelectItem value="4">Bold</SelectItem>
                              <SelectItem value="5">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>Pen Width</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Zoom controls */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="px-2 h-7 flex items-center">
                            {Math.round(scale * 100)}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Current Zoom</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Rotation controls */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleRotate("ccw")} className="h-8 w-8">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rotate Counter-Clockwise</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleRotate("cw")} className="h-8 w-8">
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rotate Clockwise</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Undo/Redo controls */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleUndo} disabled={signatureHistory.current.length === 0} className="flex items-center gap-1">
                      <Undo className="h-4 w-4" /> Undo
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleRedo} disabled={redoStack.current.length === 0} className="flex items-center gap-1">
                      <Repeat className="h-4 w-4" /> Redo
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleImportImage} className="flex items-center gap-1 ml-auto">
                      <ImageIcon className="h-4 w-4" /> Import
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="type" className="mt-4 space-y-4">
              {/* Typed signature input */}
              <div className="space-y-2">
                <Label htmlFor="typed-signature">Type your signature</Label>
                <Input
                  id="typed-signature"
                  value={typedSignature}
                  onChange={(e) => {
                    setTypedSignature(e.target.value);
                    setIsEmpty(e.target.value.trim() === "");
                    setIsSaved(false);
                  }}
                  placeholder="Type your name here"
                  className={`text-2xl h-16 text-center ${signatureFont}`}
                  style={{
                    color: signatureColor,
                    fontFamily: signatureFont,
                    transform: rotation ? `rotate(${rotation}deg)` : "none",
                    transformOrigin: "center",
                    transition: "transform 0.3s ease",
                    scale: scale.toString(),
                  }}
                  disabled={readOnly}
                  maxLength={50}
                />
              </div>

              {!readOnly && (
                <div className="space-y-3">
                  {/* Font selection */}
                  <div className="space-y-2">
                    <Label>Choose Font</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableFonts.map((font) => (
                        <Button key={font.name} variant={signatureFont === font.name ? "default" : "outline"} className="h-10 text-sm overflow-hidden" onClick={() => setSignatureFont(font.name)}>
                          <span style={{ fontFamily: font.name }}>{font.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Font color */}
                  <div className="space-y-2">
                    <Label>Choose Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full flex justify-between items-center">
                          <span>Text Color</span>
                          <div className="w-5 h-5 rounded" style={{ backgroundColor: signatureColor }} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={signatureColor} onChange={setSignatureColor} />
                        <div className="grid grid-cols-8 gap-1 mt-2">
                          {["#000000", "#2563EB", "#9333EA", "#16A34A", "#DC2626", "#CA8A04", "#78716C", "#a37136"].map((color) => (
                            <button key={color} className="w-5 h-5 rounded border cursor-pointer" style={{ backgroundColor: color }} onClick={() => setSignatureColor(color)} />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Include timestamp */}
                  <div className="flex items-center space-x-2">
                    <Switch id="use-timestamp" checked={useTimestamp} onCheckedChange={setUseTimestamp} />
                    <Label htmlFor="use-timestamp">Include Date Stamp</Label>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Signature display for read-only mode */}
        {readOnly && defaultSignature && (
          <div className="border rounded-md bg-white p-4 flex justify-center items-center min-h-[200px]">
            {defaultSignature.type === "draw" && defaultSignature.imageData ? (
              <img src={defaultSignature.imageData} alt="Signature" className="max-w-full max-h-[180px]" />
            ) : defaultSignature.type === "type" && defaultSignature.textContent ? (
              <div
                className="text-center text-3xl py-4"
                style={{
                  fontFamily: defaultSignature.font || "Dancing Script",
                  color: defaultSignature.color,
                }}
              >
                {defaultSignature.textContent}
              </div>
            ) : (
              <div className="text-muted-foreground">No signature available</div>
            )}
          </div>
        )}

        {/* Name label for signature */}
        {!readOnly && (
          <div className="mt-4">
            <Label htmlFor="signature-name">Name</Label>
            <Input id="signature-name" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Your name" className="mt-1" disabled={readOnly} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {!readOnly && (
          <>
            <Button variant="outline" onClick={handleClear} disabled={isEmpty} className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" /> Clear
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadSignature} disabled={isEmpty} className="flex items-center gap-1">
                <Download className="h-4 w-4" /> Download
              </Button>

              <Button onClick={handleSaveSignature} disabled={isEmpty || isSaved} className="flex items-center gap-1">
                {isSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {readOnly && (
          <Button variant="outline" onClick={handleDownloadSignature} disabled={!defaultSignature} className="flex items-center gap-1 ml-auto">
            <Download className="h-4 w-4" /> Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
