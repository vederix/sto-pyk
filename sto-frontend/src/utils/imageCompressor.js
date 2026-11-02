/**
 * Utility: Kompresi Gambar Client-Side untuk HP Teknisi Lapangan
 * Mengompres foto kamera beresolusi tinggi (3 - 10 MB) menjadi WebP/JPEG ringan (~150 - 300 KB)
 * dengan resolusi optimal max 1280px sebelum dikirim / disimpan.
 */
export async function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Jika ukuran file sudah sangat kecil (< 200 KB), langsung kembalikan
  if (file.size <= 200 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Hitung skala aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Prioritaskan format modern image/webp jika didukung browser
        const outputType = 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: outputType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}

