import { NextRequest, NextResponse } from "next/server";
import {
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectOutput,
  S3Client
} from "@aws-sdk/client-s3";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";

export const config = {
  runtime: "edge"
};

const fileSchema = z
  .custom<File>((val) => val instanceof File, "Please upload a file")
  .refine(
    (file) => file.size < 10 * 1024 * 1024,
    "File size must be less than 10MB"
  )
  .refine(
    (file) => file.type.match(/^image\/(png|jpeg|jpg|webp)$/),
    "File type must be png, jpeg, jpg or webp"
  )
  .refine((file) => file.name.length != 0, "File name must not be empty");

const reqSchema = z.object({
  files: z.array(fileSchema),
  repairId: z.string().uuid()
});

export default async function handler(req: NextRequest) {
  switch (req.method) {
    case "POST":
      try {
        const { userId } = getAuth(req);
        if (!userId) {
          return NextResponse.json({
            status: 401,
            error: "Unauthorised"
          });
        }
        const contentType = req.headers.get("content-type");
        if (!contentType || !contentType.startsWith("multipart/form-data")) {
          return NextResponse.json({
            status: 400,
            error: "Request must be multipart/form-data"
          });
        }

        const data = await req.formData();
        const rawFiles = data.getAll("files");

        const { files, repairId } = reqSchema.parse(rawFiles);

        const responses: PutObjectOutput[] = [];
        files.map(async (file, index) => {
          const response = await sendToBucket(
            file,
            userId,
            repairId,
            index.toString()
          );
          responses.push(response);
        });

        return NextResponse.json({
          status: 200,
          message: "Images uploaded successfully",
          responds: responses
        });
      } catch (err) {
        return NextResponse.json({
          status: 400,
          error: `Error in uploading images!, ${err}`
        });
      }
    default:
      return NextResponse.json({
        status: 405,
        error: "POST requests only"
      });
  }
}

async function sendToBucket(
  file: File,
  userId: string,
  repaidId: string,
  filename: string
) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileParams: PutObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: `users/${userId}/repair_items/${repaidId}/${filename}`,
    ContentType: file.type,
    Body: buffer
  };
  const s3 = new S3Client({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY as string,
      secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
  });
  const command = new PutObjectCommand(fileParams);
  const respond = await s3.send(command);
  return respond;
}
