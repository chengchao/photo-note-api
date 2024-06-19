import { getPayloadHMR } from "@payloadcms/next/utilities";
import configPromise from "@payload-config";

export async function GET(request: Request) {
  const payload = await getPayloadHMR({ config: configPromise });

  const data = await payload.find({
    collection: "prompts",
    where: {
      title: { equals: "image-description" },
    },
    limit: 1,
  });
  const text = data.docs.at(0)?.prompt ?? "Please say 'Something went wrong.'";

  return new Response(text);
}
