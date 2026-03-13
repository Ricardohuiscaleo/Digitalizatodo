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
     * @return string Path temporal del archivo WebP
     */
    public function optimize(UploadedFile $file, int $maxWidth = 1200, int $maxHeight = 1200, int $quality = 80): string
    {
        $imagePath = $file->getRealPath();
        $mimeType = $file->getMimeType();

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
            throw new \Exception("No se pudo procesar el formato de imagen: {$mimeType}");
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

        return $tempPath;
    }
}
