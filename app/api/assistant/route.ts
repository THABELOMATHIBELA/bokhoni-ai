import {
  NextRequest,
  NextResponse,
} from "next/server";

import OpenAI from "openai";

import {
  createClient,
} from "@/utils/supabase/server";

// ============================================================
// TYPES
// ============================================================

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequestBody = {
  messages?: unknown;
};

// ============================================================
// LIMITS
// ============================================================

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 6000;
const MAX_OUTPUT_TOKENS = 1600;

// ============================================================
// BOKHONI SYSTEM INSTRUCTIONS
// ============================================================

const BOKHONI_INSTRUCTIONS = `
You are Bokhoni AI, an intelligent innovation,
entrepreneurship, research and project-development assistant.

Your purpose is to help students, innovators,
entrepreneurs, researchers and organisations turn
problems and ideas into practical, validated and
impactful solutions.

BOKHONI INNOVATION JOURNEY

Guide users through these stages when relevant:

1. Problem
2. Research
3. Idea
4. Validation
5. Solution
6. Design
7. Prototype
8. Testing
9. Business Model
10. Market
11. Growth
12. Impact

WHEN HELPING USERS:

- understand the problem first
- identify who experiences the problem
- identify customers or beneficiaries
- identify assumptions
- separate assumptions from evidence
- recommend useful research
- suggest validation activities
- identify risks
- recommend practical next actions

FOR BUSINESS IDEAS CONSIDER:

- customer segment
- value proposition
- problem
- solution
- competitors
- revenue
- costs
- pricing
- channels
- partnerships
- resources
- market validation
- financial viability
- scalability
- impact

FOR INNOVATION PROJECTS CONSIDER:

- problem definition
- research evidence
- stakeholders
- requirements
- proposed solution
- technical feasibility
- design
- prototype
- testing
- implementation
- impact measurement

STYLE:

Be clear, practical and structured.

Use Markdown properly:
- headings
- numbered steps
- bullet points
- bold text
- tables when useful

Use simple language whenever possible.

Respond in the language the user uses unless
the user clearly requests another language.

If the user writes in Sesotho, respond naturally
in Sesotho.

If the user writes in English, respond in English.

Do not present assumptions as facts.

When evidence is missing, explain what should
be researched or validated.

Give practical recommendations rather than
generic advice.

For simple questions, answer directly and briefly.

For complex tasks, provide enough detail to help
the user complete the task.

Do not unnecessarily repeat information.

When useful, finish with one clear next action.

Do not say that you are ChatGPT or OpenAI.

You are Bokhoni AI.
`.trim();

// ============================================================
// VALIDATE A CHAT MESSAGE
// ============================================================

function isChatMessage(
  value: unknown
): value is ChatMessage {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Partial<ChatMessage>;

  const validRole =
    candidate.role === "user" ||
    candidate.role === "assistant";

  const validContent =
    typeof candidate.content === "string";

  return (
    validRole &&
    validContent
  );
}

// ============================================================
// CLEAN MESSAGES
// ============================================================

function cleanMessages(
  rawMessages: unknown[]
): ChatMessage[] {
  return rawMessages
    .filter(
      (
        message: unknown
      ): message is ChatMessage =>
        isChatMessage(message)
    )
    .map(
      (
        message: ChatMessage
      ): ChatMessage => ({
        role: message.role,

        content:
          message.content
            .trim()
            .slice(
              0,
              MAX_MESSAGE_LENGTH
            ),
      })
    )
    .filter(
      (
        message: ChatMessage
      ) =>
        message.content.length > 0
    )
    .slice(-MAX_MESSAGES);
}

// ============================================================
// POST /api/assistant
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ========================================================
    // 1. VERIFY SIGNED-IN USER
    // ========================================================

    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to use Bokhoni Assistant.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // 2. CHECK OPENAI API KEY
    // ========================================================

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error(
        "OPENAI_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "The Bokhoni AI service is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 3. READ JSON BODY
    // ========================================================

    let body:
      AssistantRequestBody;

    try {
      body =
        (await request.json()) as AssistantRequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "The request body could not be read.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. VALIDATE MESSAGES ARRAY
    // ========================================================

    if (
      !Array.isArray(
        body.messages
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation messages are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. CLEAN MESSAGES
    // ========================================================

    const messages =
      cleanMessages(
        body.messages
      );

    if (
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a message.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 6. LATEST MESSAGE MUST BE FROM USER
    // ========================================================

    const latestMessage =
      messages[
        messages.length - 1
      ];

    if (
      latestMessage.role !==
      "user"
    ) {
      return NextResponse.json(
        {
          error:
            "The latest message must come from the user.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 7. OPENAI CLIENT
    // ========================================================

    const openai =
      new OpenAI({
        apiKey,

        // Avoid long retry delays.
        maxRetries: 1,

        timeout: 60_000,
      });

    // ========================================================
    // 8. START STREAMING RESPONSE
    // ========================================================

    const openAIStream =
      await openai.responses.create(
        {
          model:
            "gpt-6-luna",

          reasoning: {
            effort: "low",
          },

          instructions:
            BOKHONI_INSTRUCTIONS,

          input:
            messages.map(
              (
                message: ChatMessage
              ) => ({
                role:
                  message.role,

                content:
                  message.content,
              })
            ),

          max_output_tokens:
            MAX_OUTPUT_TOKENS,

          store: false,

          stream: true,
        },
        {
          signal:
            request.signal,
        }
      );

    // ========================================================
    // 9. CONVERT OPENAI EVENTS TO SIMPLE TEXT STREAM
    // ========================================================

    const encoder =
      new TextEncoder();

    const readableStream =
      new ReadableStream<Uint8Array>(
        {
          async start(
            controller
          ) {
            try {
              for await (
                const event of
                openAIStream
              ) {
                if (
                  event.type ===
                  "response.output_text.delta"
                ) {
                  if (
                    event.delta
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        event.delta
                      )
                    );
                  }
                }

                // Stop cleanly if OpenAI reports
                // a failed response.
                if (
                  event.type ===
                  "response.failed"
                ) {
                  console.error(
                    "BOKHONI OPENAI RESPONSE FAILED:",
                    event
                  );
                }
              }

              controller.close();
            } catch (
              streamError: unknown
            ) {
              console.error(
                "BOKHONI STREAM ERROR:",
                streamError
              );

              try {
                controller.error(
                  streamError
                );
              } catch {
                // Stream may already be closed.
              }
            }
          },

          async cancel() {
            // Request cancellation is already
            // forwarded through request.signal.
          },
        }
      );

    // ========================================================
    // 10. RETURN STREAM TO THE BROWSER
    // ========================================================

    return new Response(
      readableStream,
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",

          "Cache-Control":
            "no-cache, no-store, must-revalidate",

          "X-Content-Type-Options":
            "nosniff",

          "X-Accel-Buffering":
            "no",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    // ========================================================
    // OPENAI API ERRORS
    // ========================================================

    if (
      error instanceof
      OpenAI.APIError
    ) {
      console.error(
        "OPENAI API ERROR:",
        {
          status:
            error.status,

          message:
            error.message,

          requestId:
            error.requestID,
        }
      );

      // ------------------------------------------------------
      // 400 - BAD REQUEST
      // ------------------------------------------------------

      if (
        error.status === 400
      ) {
        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV ===
              "development"
                ? `OpenAI request error: ${error.message}`
                : "Bokhoni could not process that request.",
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // 401 - BAD KEY
      // ------------------------------------------------------

      if (
        error.status === 401
      ) {
        return NextResponse.json(
          {
            error:
              "OpenAI rejected the Bokhoni API key.",
          },
          {
            status: 401,
          }
        );
      }

      // ------------------------------------------------------
      // 403 - PERMISSION
      // ------------------------------------------------------

      if (
        error.status === 403
      ) {
        return NextResponse.json(
          {
            error:
              "The Bokhoni AI service does not currently have permission to use this model.",
          },
          {
            status: 403,
          }
        );
      }

      // ------------------------------------------------------
      // 404 - MODEL NOT FOUND
      // ------------------------------------------------------

      if (
        error.status === 404
      ) {
        return NextResponse.json(
          {
            error:
              "The selected Bokhoni AI model is currently unavailable.",
          },
          {
            status: 404,
          }
        );
      }

      // ------------------------------------------------------
      // 409 - CONFLICT
      // ------------------------------------------------------

      if (
        error.status === 409
      ) {
        return NextResponse.json(
          {
            error:
              "The AI service could not complete the request. Please try again.",
          },
          {
            status: 409,
          }
        );
      }

      // ------------------------------------------------------
      // 422 - INVALID INPUT
      // ------------------------------------------------------

      if (
        error.status === 422
      ) {
        return NextResponse.json(
          {
            error:
              "Bokhoni could not process the supplied conversation.",
          },
          {
            status: 422,
          }
        );
      }

      // ------------------------------------------------------
      // 429 - BILLING / RATE LIMIT
      // ------------------------------------------------------

      if (
        error.status === 429
      ) {
        return NextResponse.json(
          {
            error:
              "The Bokhoni AI service has reached its API usage or billing limit.",
          },
          {
            status: 429,
          }
        );
      }

      // ------------------------------------------------------
      // OTHER OPENAI ERRORS
      // ------------------------------------------------------

      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV ===
            "development"
              ? `OpenAI error: ${error.message}`
              : "The Bokhoni AI service could not complete the request.",
        },
        {
          status:
            typeof error.status ===
            "number"
              ? error.status
              : 500,
        }
      );
    }

    // ========================================================
    // REQUEST ABORTED
    // ========================================================

    if (
      error instanceof Error &&
      error.name ===
        "AbortError"
    ) {
      return NextResponse.json(
        {
          error:
            "The request was cancelled.",
        },
        {
          status: 499,
        }
      );
    }

    // ========================================================
    // UNKNOWN SERVER ERROR
    // ========================================================

    console.error(
      "BOKHONI ASSISTANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV ===
            "development" &&
          error instanceof Error
            ? `Bokhoni error: ${error.message}`
            : "Bokhoni Assistant could not generate a response.",
      },
      {
        status: 500,
      }
    );
  }
}