import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import ErrorHandler from "../middlewares/error.js";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const removeTempFile = async (file) => {
  if (file?.tempFilePath) {
    await fs.unlink(file.tempFilePath).catch(() => {});
  }
};

/** Throws an ErrorHandler if the uploaded file is missing or not an allowed image. */
export const validateImage = (file, label = "Image") => {
  if (!file || Array.isArray(file)) {
    throw new ErrorHandler(`${label} is required (one file).`, 400);
  }
  if (file.truncated) {
    throw new ErrorHandler(
      `${label} is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`,
      413
    );
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ErrorHandler(`${label} must be a PNG, JPEG or WEBP image.`, 400);
  }
};

export const uploadImage = async (file, folder) => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      resource_type: "image",
    });
    return { public_id: result.public_id, url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary upload failed:", error?.message || error);
    throw new ErrorHandler("Failed to upload image. Please try again.", 502);
  } finally {
    await removeTempFile(file);
  }
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete Cloudinary image ${publicId}:`, error?.message);
  }
};

export const discardUploads = async (files) => {
  if (!files) return;
  await Promise.all(Object.values(files).flat().map(removeTempFile));
};
