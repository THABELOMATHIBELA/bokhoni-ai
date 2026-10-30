import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  connection,
} from "next/server";

import OpenAI from "openai";

import {
  createClient,
} from "@/utils/supabase/server";

const IMAGE_BUCKET =
  "assistant-images";

export async function POST(
  request: NextRequest
) {
  await connection();

  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to generate images.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // OPENAI KEY
    // ========================================================
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // READ REQUEST
    // ========================================================
    const body =
      await request.json();

    const prompt =
      typeof body?.prompt ===
      "string"
        ? body.prompt.trim()
        : "";

    const conversationId =
      typeof body?.conversationId ===
      "string"
        ? body.conversationId
        : null;

    if (!prompt) {
      return NextResponse.json(
        {
          error:
            "Please describe the image you want Bokhoni to create.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      prompt.length >
      10000
    ) {
      return NextResponse.json(
        {
          error:
            "The image description is too long.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // OPENAI
    // ========================================================
    const openai =
      new OpenAI({
        apiKey,
      });

    // ========================================================
    // GENERATE IMAGE
    // ========================================================
    const result =
      await openai.images.generate({
        model:
          "gpt-image-2.5-flare",

        prompt: `
Create a high-quality image for a Bokhoni AI user.

User request:
${prompt}

Make the result visually clear, professional,
useful and appropriate for the user's request.

If this is:
- a business concept, make it presentation-ready;
- a prototype, clearly show the concept;
- a poster, use a strong professional layout;
- a product concept, make the product clearly visible;
- an innovation concept, make the idea easy to understand.

Do not add unnecessary text unless the user specifically requests text.
        `.trim(),

        size:
          "1024x1024",

        quality:
          "medium",

        output_format:
          "png",

        n: 1,
      });

    // ========================================================
    // GET BASE64 IMAGE
    // ========================================================
    const imageBase64 =
      result.data?.[0]
        ?.b64_json;

    if (
      !imageBase64
    ) {
      return NextResponse.json(
        {
          error:
            "Bokhoni could not generate the image.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // CONVERT TO FILE
    // ========================================================
    const imageBuffer =
      Buffer.from(
        imageBase64,
        "base64"
      );

    const imageId =
      crypto.randomUUID();

    const storagePath =
      `${user.id}/${imageId}.png`;

    // ========================================================
    // UPLOAD TO SUPABASE
    // ========================================================
    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          IMAGE_BUCKET
        )
        .upload(
          storagePath,
          imageBuffer,
          {
            contentType:
              "image/png",

            upsert:
              false,

            cacheControl:
              "3600",
          }
        );

    if (
      uploadError
    ) {
      console.error(
        "Image storage error:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            "The image was generated but could not be saved.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // CREATE SIGNED URL
    // ========================================================
    const {
      data:
        signedData,
      error:
        signedError,
    } =
      await supabase.storage
        .from(
          IMAGE_BUCKET
        )
        .createSignedUrl(
          storagePath,
          60 * 60
        );

    if (
      signedError ||
      !signedData
        ?.signedUrl
    ) {
      console.error(
        "Signed URL error:",
        signedError
      );

      return NextResponse.json(
        {
          error:
            "The image was saved but could not be displayed.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // SAVE IMAGE MESSAGE IF CONVERSATION EXISTS
    // ========================================================
    let messageId:
      | string
      | null = null;

    if (
      conversationId
    ) {
      // Make sure the conversation belongs to this user.
      const {
        data:
          conversation,
      } =
        await supabase
          .from(
            "conversations"
          )
          .select("id")
          .eq(
            "id",
            conversationId
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (
        conversation
      ) {
        const {
          data:
            savedMessage,
          error:
            messageError,
        } =
          await supabase
            .from(
              "messages"
            )
            .insert({
              conversation_id:
                conversationId,

              user_id:
                user.id,

              role:
                "assistant",

              content:
                `Generated image: ${prompt}`,

              message_type:
                "image",

              model:
                "gpt-image-2.5-flare",

              image_url:
                storagePath,
            })
            .select(
              "id"
            )
            .single();

        if (
          messageError
        ) {
          console.error(
            "Save image message error:",
            messageError
          );
        } else {
          messageId =
            savedMessage.id;
        }

        await supabase
          .from(
            "conversations"
          )
          .update({
            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            conversationId
          )
          .eq(
            "user_id",
            user.id
          );
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================
    return NextResponse.json({
      success:
        true,

      messageId,

      prompt,

      imagePath:
        storagePath,

      imageUrl:
        signedData
          .signedUrl,
    });
  } catch (
    error
  ) {
    console.error(
      "BOKHONI IMAGE ERROR:",
      error
    );

    if (
      error instanceof
      OpenAI.APIError
    ) {
      if (
        error.status ===
        401
      ) {
        return NextResponse.json(
          {
            error:
              "OpenAI rejected the API key.",
          },
          {
            status:
              401,
          }
        );
      }

      if (
        error.status ===
        403
      ) {
        return NextResponse.json(
          {
            error:
              "Your OpenAI account does not currently have permission to generate images.",
          },
          {
            status:
              403,
          }
        );
      }

      if (
        error.status ===
        429
      ) {
        return NextResponse.json(
          {
            error:
              "The Bokhoni image service has reached its API usage limit.",
          },
          {
            status:
              429,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            process.env
              .NODE_ENV ===
            "development"
              ? `Image generation error: ${error.message}`
              : "Bokhoni could not generate the image.",
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

    return NextResponse.json(
      {
        error:
          "Bokhoni could not generate the image.",
      },
      {
        status: 500,
      }
    );
  }
}