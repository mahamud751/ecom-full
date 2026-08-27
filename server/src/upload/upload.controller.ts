import { promises as fs } from "fs";
import path from "path";
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const PUBLIC_MAX = 6 * 1024 * 1024;
const PUBLIC_ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const PUBLIC_FOLDERS = [
  "prescriptions",
  "refunds",
  "misc",
  "search",
  "avatars",
];

const ADMIN_MAX = 5 * 1024 * 1024;
const ADMIN_ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ADMIN_FOLDERS = new Set([
  "products",
  "doctors",
  "brands",
  "categories",
  "lab",
  "banners",
  "vendors",
  "misc",
]);

function extFromType(type: string, name: string): string {
  const fromName = path.extname(name).toLowerCase();
  if (
    fromName &&
    [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(fromName)
  ) {
    return fromName;
  }
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    default:
      return ".jpg";
  }
}

const fileField = {
  file: { type: "string", format: "binary" },
  folder: { type: "string" },
};

@ApiTags("upload")
@Controller()
export class UploadController {
  /** Public upload for prescriptions / refund proof (not admin-gated) */
  @Post("upload")
  @ApiOperation({ summary: "Public upload (prescriptions / refunds / misc)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: fileField } })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: PUBLIC_MAX } }),
  )
  async publicUpload(
    @UploadedFile() file: Express.Multer.File,
    // multer leaves extra form fields on req.body
    @Body() body: Record<string, any>,
  ) {
    try {
      if (!file) throw new ApiError(400, "No file");
      if (!PUBLIC_ALLOWED.has(file.mimetype)) {
        throw new ApiError(400, "Only images or PDF allowed");
      }
      if (file.size > PUBLIC_MAX) {
        throw new ApiError(400, "File too large (max 6MB)");
      }

      const folderRaw = String(body?.folder || "misc");
      const folder = PUBLIC_FOLDERS.includes(folderRaw) ? folderRaw : "misc";

      const ext =
        path.extname(file.originalname || "").toLowerCase() ||
        (file.mimetype.includes("pdf") ? ".pdf" : ".jpg");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const dir = path.join(UPLOAD_ROOT, folder);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), file.buffer);

      return {
        success: true,
        url: `/uploads/${folder}/${filename}`,
      };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Upload failed");
    }
  }

  /** Admin image upload for catalog assets */
  @Post("admin/upload")
  @ApiTags("admin")
  @ApiOperation({ summary: "Admin image upload (catalog assets)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: fileField } })
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: ADMIN_MAX } }))
  async adminUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, any>,
  ) {
    try {
      if (!file) throw new ApiError(400, "No file provided");
      if (!ADMIN_ALLOWED.has(file.mimetype)) {
        throw new ApiError(
          400,
          "Only JPG, PNG, WebP, GIF or AVIF images allowed",
        );
      }
      if (file.size > ADMIN_MAX) {
        throw new ApiError(400, "Image must be under 5MB");
      }

      const folderRaw = String(body?.folder || "misc");
      const folder = ADMIN_FOLDERS.has(folderRaw) ? folderRaw : "misc";

      const ext = extFromType(file.mimetype, file.originalname || "");
      const safeBase = (file.originalname || "")
        .replace(ext, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase || "img"}${ext}`;

      const dir = path.join(UPLOAD_ROOT, folder);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), file.buffer);

      return {
        success: true,
        url: `/uploads/${folder}/${filename}`,
        filename,
        size: file.size,
        type: file.mimetype,
      };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error("Upload error:", e);
      throw new ApiError(500, "Upload failed");
    }
  }
}
