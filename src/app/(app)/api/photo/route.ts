import OpenAI from "openai";
import { z } from "zod";
import { getPayloadHMR } from "@payloadcms/next/utilities";
import configPromise from "@payload-config";

export const maxDuration = 50;

export const dynamic = "force-dynamic"; // static by default, unless reading the request

const openai = new OpenAI();

async function* makeIterator(text: string, imageBase64: string) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: [
          { type: "text", text },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],

    stream: true,
  });

  for await (const message of stream) {
    console.log(message);
    if (message.choices[0].delta.content) {
      yield message.choices[0].delta.content;
    }
  }
}

function iteratorToStream(iterator: AsyncIterator<string>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export async function POST(request: Request) {
  try {
    console.log("POST request received");

    const body = await request.json();
    const bodySchema = z.object({
      imageBase64: z.string(),
    });

    const payload = await getPayloadHMR({ config: configPromise });

    const data = await payload.find({
      collection: "prompts",
      where: {
        title: { equals: "image-description" },
      },
      limit: 1,
    });
    const text =
      data.docs.at(0)?.prompt ?? "Please say 'Something went wrong.'";

    const { imageBase64 } = bodySchema.parse(body);

    const iterator = makeIterator(text, imageBase64);
    const stream = iteratorToStream(iterator);

    return new Response(stream);
  } catch (error: unknown) {
    let message = "Unknown error";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    console.error(message);

    return new Response(message, {
      status: 400,
      statusText: "Bad Request",
    });
  }
}

export async function GET(request: Request) {
  return new Response("API Server is up. GET request is not supported");
}
