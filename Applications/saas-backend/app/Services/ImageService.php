<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Optimiza una imagen: redimensiona (si es necesario) y convierte a WebP.
     *
     * @param UploadedFile $file
     * @param int $maxWidth
     * @param int $maxHeight
     * @param int $quality
     * @return array ['path' => string, 'extension' => string]
     */
    public function optimize(UploadedFile $file, int $maxWidth = 1200, int $maxHeight = 1200, int $quality = 80): array
    {
        $imagePath = $file->getRealPath();
        $mimeType = $file->getMimeType();
        $originalExtension = $file->getClientOriginalExtension() ?: 'jpg';

        // Si es HEIC o similar y no tenemos soporte garantizado, devolvemos el original
        if (str_contains($mimeType, 'heic')) {
            return ['path' => $imagePath, 'extension' => $originalExtension];
        }

        try {
            // Crear recurso de imagen según el tipo
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($imagePath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($imagePath);
                // Mantener transparencia si es necesario, aunque WebP lo maneja bien
                imagealphablending($image, true);
                imagesavealpha($image, true);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($imagePath);
                break;
            default:
                // Intentar cargar por string si es un formato soportado por GD pero no mapeado
                $imageData = file_get_contents($imagePath);
                $image = imagecreatefromstring($imageData);
                break;
        }

        if (!$image) {
            // Fallback total: si no se pudo procesar, devolvemos el original sin optimizar
            return ['path' => $imagePath, 'extension' => $originalExtension];
        }

        // Obtener dimensiones originales
        $width = imagesx($image);
        $height = imagesy($image);

        // Calcular nuevas dimensiones manteniendo el ratio
        if ($width > $maxWidth || $height > $maxHeight) {
            $ratio = $width / $height;
            if ($ratio > 1) {
                $newWidth = $maxWidth;
                $newHeight = (int)($maxWidth / $ratio);
            } else {
                $newHeight = $maxHeight;
                $newWidth = (int)($maxHeight * $ratio);
            }

            $newImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Manejar transparencia para WebP
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
            
            imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $newImage;
        }

        // Ruta temporal para guardar el WebP antes de subir a S3
        $tempPath = tempnam(sys_get_temp_dir(), 'webp_') . '.webp';
        
        // Convertir y guardar como WebP
        imagewebp($image, $tempPath, $quality);
        imagedestroy($image);

        return ['path' => $tempPath, 'extension' => 'webp'];
    }
}
