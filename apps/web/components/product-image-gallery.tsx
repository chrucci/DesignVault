"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProductImage {
  id: string
  product_id: string
  image_url: string
  is_primary: boolean
  sort_order: number
}

interface ProductImageGalleryProps {
  productId: string
  productName: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
}

export function ProductImageGallery({
  productId,
  productName,
  images,
  onImagesChange,
}: ProductImageGalleryProps) {
  const [selectedImageId, setSelectedImageId] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const supabase = React.useMemo(() => createClient(), [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${productId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        // Fallback: use a data URL or object URL if storage isn't configured
        const url = URL.createObjectURL(file)
        const isPrimary = images.length === 0

        const { data: imgRow, error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: url,
            is_primary: isPrimary,
            sort_order: images.length,
          })
          .select()
          .single()

        if (insertError) {
          console.error("Insert error:", insertError)
          return
        }

        onImagesChange([...images, imgRow])
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)

      const imageUrl = publicUrlData.publicUrl
      const isPrimary = images.length === 0

      const { data: imgRow, error: insertError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          is_primary: isPrimary,
          sort_order: images.length,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError)
        return
      }

      onImagesChange([...images, imgRow])
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const handleSetPrimary = async () => {
    if (!selectedImageId) return

    // Unset all primaries
    for (const img of images) {
      if (img.is_primary) {
        await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("id", img.id)
      }
    }

    // Set selected as primary
    await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", selectedImageId)

    const updated = images.map((img) => ({
      ...img,
      is_primary: img.id === selectedImageId,
    }))

    onImagesChange(updated)
    setSelectedImageId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        {selectedImageId && (
          <Button onClick={handleSetPrimary} variant="outline" size="sm">
            Set as Primary
          </Button>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${
                selectedImageId === image.id
                  ? "border-primary"
                  : "border-transparent"
              }`}
              onClick={() => setSelectedImageId(image.id)}
            >
              <img
                src={image.image_url}
                alt={productName}
                className="w-full aspect-square object-cover"
              />
              {image.is_primary && (
                <Badge className="absolute top-1 left-1" variant="default">
                  Primary
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
