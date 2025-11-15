"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DeleteConfirmationProps {
  open: boolean;
  filename: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmation({ open, filename, onConfirm, onCancel }: DeleteConfirmationProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Delete Document</CardTitle>
          <CardDescription>
            Are you sure you want to delete "{filename}"? This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}