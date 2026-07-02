import { NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadUrl = formData.get("uploadUrl");
    const fieldsRaw = formData.get("fields");
    const file = formData.get("file");

    if (typeof uploadUrl !== "string" || !uploadUrl) {
      return NextResponse.json({ detail: "Missing uploadUrl." }, { status: 400 });
    }

    if (typeof fieldsRaw !== "string" || !fieldsRaw) {
      return NextResponse.json({ detail: "Missing serialized upload fields." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "Missing file." }, { status: 400 });
    }

    const parsedFields = JSON.parse(fieldsRaw) as unknown;
    if (!isRecord(parsedFields)) {
      return NextResponse.json({ detail: "Upload fields were invalid." }, { status: 400 });
    }

    const upstreamBody = new FormData();
    for (const [field, value] of Object.entries(parsedFields)) {
      upstreamBody.append(field, String(value));
    }
    upstreamBody.append("file", file, file.name);

    const upstreamResponse = await fetch(uploadUrl, {
      method: "POST",
      body: upstreamBody,
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        {
          detail: `Upstream upload failed with status ${upstreamResponse.status}.`,
          upstream: errorText,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Upload proxy failed." },
      { status: 500 },
    );
  }
}
