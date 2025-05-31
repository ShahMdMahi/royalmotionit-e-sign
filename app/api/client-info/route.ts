import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get IP address from request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = request.headers.get("x-client-ip");
    const remoteAddress = request.headers.get("x-remote-address");

    // Priority order for IP detection
    let ipAddress =
      forwarded?.split(",")[0]?.trim() ||
      realIp ||
      clientIp ||
      remoteAddress ||
      "127.0.0.1";

    // Clean up IPv6 mapped IPv4 addresses
    if (ipAddress.startsWith("::ffff:")) {
      ipAddress = ipAddress.substring(7);
    }

    return NextResponse.json({
      ipAddress,
      userAgent: request.headers.get("user-agent") || "Unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting client info:", error);
    return NextResponse.json(
      { error: "Failed to get client information" },
      { status: 500 },
    );
  }
}
