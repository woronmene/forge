import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type ForgeProxyService = "api" | "media" | "analytics" | "user" | "wallet" | "java";

const defaultServiceTargets: Record<ForgeProxyService, string> = {
  api: "https://szpa00qtp4.execute-api.us-east-1.amazonaws.com",
  media: "https://3bbei9jua5.execute-api.us-east-1.amazonaws.com",
  analytics: "https://q588qlfwkj.execute-api.us-east-1.amazonaws.com",
  user: "https://6z8ym795gc.execute-api.us-east-1.amazonaws.com",
  wallet: "https://zzxxkqpbu6.execute-api.us-east-1.amazonaws.com",
  java: "https://zzxxkqpbu6.execute-api.us-east-1.amazonaws.com",
};

const serviceEnvMap: Record<ForgeProxyService, string | undefined> = {
  api: process.env.NEXT_PUBLIC_FORGE_API_BASE_URL,
  media: process.env.NEXT_PUBLIC_FORGE_MEDIA_BASE_URL,
  analytics: process.env.NEXT_PUBLIC_FORGE_ANALYTICS_BASE_URL,
  user: process.env.NEXT_PUBLIC_FORGE_USER_BASE_URL,
  wallet: process.env.NEXT_PUBLIC_FORGE_WALLET_BASE_URL,
  java: process.env.NEXT_PUBLIC_FORGE_JAVA_BASE_URL,
};

function getServiceTarget(service: string) {
  const normalizedService = service as ForgeProxyService;
  const target = serviceEnvMap[normalizedService] ?? defaultServiceTargets[normalizedService];
  if (!target) {
    return null;
  }

  return target.replace(/\/+$/, "");
}

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[]; service: string }> },
) {
  const { service, path } = await context.params;
  const targetBaseUrl = getServiceTarget(service);

  if (!targetBaseUrl) {
    return NextResponse.json({ detail: `Unknown Forge proxy service "${service}".` }, { status: 404 });
  }

  const upstreamUrl = new URL(`${targetBaseUrl}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[]; service: string }> }) {
  return forwardRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[]; service: string }> }) {
  return forwardRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[]; service: string }> }) {
  return forwardRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[]; service: string }> }) {
  return forwardRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[]; service: string }> }) {
  return forwardRequest(request, context);
}
