import { NextResponse } from "next/server";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  // Only show the prefix for security
  const urlPrefix = databaseUrl ? databaseUrl.split("://")[0] : "NOT_SET";

  return NextResponse.json({
    databaseUrlPrefix: urlPrefix,
    isCorrectFormat: urlPrefix === "postgresql" || urlPrefix === "postgres",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
