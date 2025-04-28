"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File } from "lucide-react";

interface FileUploadModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export function FileUploadModal({ isOpen, onCloseAction }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" && droppedFile.size <= 10 * 1024 * 1024) {
        setFile(droppedFile);
        // Extract filename without extension as title suggestion
        const fileName = droppedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" && selectedFile.size <= 10 * 1024 * 1024) {
        setFile(selectedFile);
        // Extract filename without extension as title suggestion
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setTitle("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);

      // Simulate upload delay
      // await new Promise(resolve => setTimeout(resolve, 1500));

      //  Here you would normally upload the file to your server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      await fetch("/api/documents", { method: "POST", body: formData });

      setUploading(false);
      resetForm();
      onCloseAction();
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document for signature. Supported format: PDF (max 10MB).</DialogDescription>
          </DialogHeader>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              } flex flex-col items-center justify-center gap-4 my-4 cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium">Click to upload</span> or drag and drop
                <br />
                PDF (max. 10MB)
              </p>
              <Input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="border rounded-lg p-4 my-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Document Title</Label>
              <Input id="title" placeholder="Enter document title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" placeholder="Add a description for this document" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onCloseAction} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || !title || uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
