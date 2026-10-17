const targets = [
  ["대조군", "https://example.com/"],
  [
    "대전 구 API",
    "http://openapitraffic.daejeon.go.kr/api/rest/" +
      "busRouteInfo/getRouteInfoAll?reqPage=1"
  ]
];

async function check([name, url]) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(25000)
    });
    const body = await response.text();
    return {
      name,
      httpStatus: response.status,
      elapsedMs: Date.now() - start,
      headerCode: body.match(/<headerCd>([^<]+)<\/headerCd>/i)?.[1] ?? null,
      preview: body.slice(0, 200)
    };
  } catch (error) {
    return {
      name,
      elapsedMs: Date.now() - start,
      error: String(error),
      causeCode: error.cause?.code ?? null
    };
  }
}

export default async (request, context) => {
  if (request.method !== "GET") {
    return new Response("GET required", {status: 405});
  }
  if (new URL(request.url).search) {
    return new Response("Query parameters are not used", {status: 400});
  }
  return new Response(JSON.stringify({
    region: context.server?.region ?? process.env.AWS_REGION ?? "unknown",
    testedAt: new Date().toISOString(),
    results: await Promise.all(targets.map(check))
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
};
