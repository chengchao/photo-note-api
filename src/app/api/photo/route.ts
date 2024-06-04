import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI();

async function* makeIterator(text: string, imageBase64: string) {
  // Prepare the payload
  const payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: [
          { type: "text", content: text },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],

    stream: true,
  };
  const stream = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
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
    const body = await request.json();
    const bodySchema = z.object({
      text: z.string(),
      imageBase64: z.string(),
    });

    const { text, imageBase64 } = bodySchema.parse(body);

    const iterator = makeIterator(text, imageBase64);
    const stream = iteratorToStream(iterator);

    return new Response(stream);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 400 });
    } else if (typeof error === "string") {
      return new Response(error, { status: 400 });
    } else {
      return new Response("Unknown error", { status: 400 });
    }
  }
}
