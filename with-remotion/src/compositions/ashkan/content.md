## !!steps 1

!duration 200

```jsx ! app/api/building-object/route.ts
export async function POST(req: Request) {
    //POST Request
  });
}
```

## !!steps 2

!duration 200

```jsx ! app/api/building-object/route.ts
import { openai } from "@ai-sdk/openai";
import { streamObject } from 'ai';
// !mark[1:55] 55 50
import { z } from 'zod'

export async function POST(req: Request) {
  
  const { messages } = await req.json();
  
  const { partialObjectStream  } = await streamObject({
    model: openai("gpt-4o-2024-05-13",{
    // !mark[/structuredOutputs/] 55 50
    structuredOutputs:true
    }),
    schema: z.object({
    building: z.object({
      unit: z.string(),
      rooms: z.array(z.object({ name: z.string(), area: z.number() })),
      materials: z.array(z.string()),
      }),
    }),
    messages,
  });

  for await (const partialObject of partialObjectStream) {
    console.clear();
    console.log(partialObject);
  }
}
```
