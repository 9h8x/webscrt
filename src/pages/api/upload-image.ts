import { supabase } from "@/lib/supabase";
import sharp from "sharp";

// Simple in-memory rate limiter
const rateLimiter = {
  uploads: {}, // { ip: { count: number, resetTime: number } }

  // Check if the IP has exceeded the rate limit
  checkLimit(ip, limit = 10, windowMs = 5 * 60 * 1000) {
    const now = Date.now();

    // Initialize or reset expired entries
    if (!this.uploads[ip] || now > this.uploads[ip].resetTime) {
      this.uploads[ip] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (this.uploads[ip].count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.uploads[ip].resetTime,
      };
    }

    // Increment count
    this.uploads[ip].count++;

    return {
      allowed: true,
      remaining: limit - this.uploads[ip].count,
      resetTime: this.uploads[ip].resetTime,
    };
  },

  // Clean up old entries (call this periodically if server runs for a long time)
  cleanup() {
    const now = Date.now();
    for (const ip in this.uploads) {
      if (now > this.uploads[ip].resetTime) {
        delete this.uploads[ip];
      }
    }
  },
};

export async function POST({ request, clientAddress }) {
  try {
    // Check rate limit
    const ip = clientAddress || "unknown";
    const rateLimit = rateLimiter.checkLimit(ip, 10, 5 * 60 * 1000);

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetTime.toString(),
          },
        }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const secretId = formData.get("secret_id");

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: "No image file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Allowed MIME types
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/heif",
      "image/heic",
    ];

    // Check if the MIME type is allowed
    if (!allowedMimeTypes.includes(image.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid file type. Only images are allowed.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert the image Blob to ArrayBuffer
    const arrayBuffer = await image.arrayBuffer();

    // Prepare output format based on input
    let outputFormat = "jpeg";
    let outputOptions = { quality: 80 }; // Default JPEG quality

    if (image.type === "image/png") {
      outputFormat = "png";
      outputOptions = { compressionLevel: 9 }; // Max PNG compression
    } else if (image.type === "image/webp") {
      outputFormat = "webp";
      outputOptions = { quality: 80 };
    }

    // Skip resizing for SVG images
    let processedImageBuffer;
    if (image.type === "image/svg+xml") {
      processedImageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Resize and optimize the image
      processedImageBuffer = await sharp(Buffer.from(arrayBuffer))
        .resize({
          width: 1200, // Max width
          height: 1200, // Max height
          fit: "inside", // Maintain aspect ratio
          withoutEnlargement: true, // Don't enlarge small images
        })
        .toFormat(outputFormat, outputOptions)
        .toBuffer();
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = outputFormat === "jpeg" ? "jpg" : outputFormat;
    const filename = `public/${timestamp}_${secretId}.${fileExtension}`;

    // Upload the resized image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filename, processedImageBuffer, {
        contentType: `image/${outputFormat}`,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL of the uploaded image
    const { data: publicURL } = supabase.storage
      .from("attachments")
      .getPublicUrl(uploadData.path);

    // Insert image metadata into the secret_images table
    const { data: insertData, error: insertError } = await supabase
      .from("secret_images")
      .insert([
        {
          secret_id: secretId,
          urls: publicURL,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: new Date(rateLimit.resetTime).toISOString(),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
