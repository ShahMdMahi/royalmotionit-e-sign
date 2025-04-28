import { S3Client } from "@aws-sdk/client-s3";

// Creating the S3Client without "use server" directive for server components
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default r2Client;
