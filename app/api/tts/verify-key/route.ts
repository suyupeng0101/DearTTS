import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-mimo-api-key")?.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "请先填写 MiMo v2.5 API Key。" }, { status: 400 });
  }

  const endpoint = process.env.MIMO_VERIFY_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({
      ok: true,
      mode: "local",
      message: "已保存 API Key。MiMo 官方未提供独立校验接口，真实有效性会在合成时校验。",
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, message: "API Key 校验失败，请检查后重试。" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, mode: "remote", message: "API Key 校验通过。" });
  } catch {
    return NextResponse.json({ ok: false, message: "校验服务暂时不可用。" }, { status: 502 });
  }
}
