"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { createClient } from "@/utils/supabase/client";

// ============================================================
// TYPES
// ============================================================

type MessageType = "text" | "image";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  messageType?: MessageType;
  imagePath?: string | null;
  imageUrl?: string | null;
};

type Conversation = {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type DatabaseMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  message_type: string | null;
  image_url: string | null;
};

type ImageApiResponse = {
  success?: boolean;
  messageId?: string | null;
  imagePath?: string;
  imageUrl?: string;
  prompt?: string;
  error?: string;
};

// ============================================================
// STARTER QUESTIONS
// ============================================================

const starterQuestions = [
  "Help me validate a business idea",
  "Help me identify a problem worth solving",
  "Help me develop my innovation project",
  "Help me create a business model",
];

// ============================================================
// WELCOME MESSAGE
// ============================================================

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to **Bokhoni Assistant**. Tell me about the problem, idea, project or business you are working on, and I will help you move it forward.",
  messageType: "text",
};

// ============================================================
// CONVERSATION TITLE
// ============================================================

function createConversationTitle(message: string) {
  const cleaned = message
    .replace(/[#*_`>|[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New conversation";
  }

  if (cleaned.length <= 55) {
    return cleaned;
  }

  return `${cleaned.slice(0, 55).trim()}...`;
}

// ============================================================
// HYDRATION-SAFE DATE FORMATTER
// Uses UTC instead of browser locale formatting.
// ============================================================

function formatConversationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const year =
    date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// SMART IMAGE REQUEST DETECTION
// ============================================================

function looksLikeImageRequest(message: string) {
  const text =
    message.toLowerCase();

  const actionWords = [
    "generate",
    "create",
    "make",
    "draw",
    "design",
    "visualize",
    "visualise",
    "render",
    "illustrate",
    "produce",
  ];

  const imageWords = [
    "image",
    "picture",
    "photo",
    "poster",
    "logo",
    "illustration",
    "mockup",
    "mock-up",
    "prototype image",
    "diagram",
    "visual",
    "flyer",
    "banner",
    "artwork",
    "graphic",
  ];

  const hasAction =
    actionWords.some((word) =>
      text.includes(word)
    );

  const hasImageWord =
    imageWords.some((word) =>
      text.includes(word)
    );

  return (
    hasAction &&
    hasImageWord
  );
}

// ============================================================
// MARKDOWN
// ============================================================

function MarkdownContent({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm,
      ]}
      components={{
        h1: ({
          children,
        }) => (
          <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-slate-950 first:mt-0">
            {children}
          </h1>
        ),

        h2: ({
          children,
        }) => (
          <h2 className="mb-3 mt-7 text-xl font-bold tracking-tight text-slate-950 first:mt-0">
            {children}
          </h2>
        ),

        h3: ({
          children,
        }) => (
          <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-950 first:mt-0">
            {children}
          </h3>
        ),

        p: ({
          children,
        }) => (
          <p className="mb-4 leading-7 last:mb-0">
            {children}
          </p>
        ),

        strong: ({
          children,
        }) => (
          <strong className="font-semibold text-slate-950">
            {children}
          </strong>
        ),

        ul: ({
          children,
        }) => (
          <ul className="mb-5 ml-5 list-disc space-y-2 marker:text-slate-400">
            {children}
          </ul>
        ),

        ol: ({
          children,
        }) => (
          <ol className="mb-5 ml-5 list-decimal space-y-2 marker:font-semibold marker:text-slate-500">
            {children}
          </ol>
        ),

        li: ({
          children,
        }) => (
          <li className="pl-1 leading-7">
            {children}
          </li>
        ),

        blockquote: ({
          children,
        }) => (
          <blockquote className="my-5 border-l-4 border-slate-300 bg-slate-50 px-5 py-3 text-slate-600">
            {children}
          </blockquote>
        ),

        hr: () => (
          <hr className="my-7 border-slate-200" />
        ),

        a: ({
          href,
          children,
        }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900"
          >
            {children}
          </a>
        ),

        code: ({
          children,
        }) => (
          <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800">
            {children}
          </code>
        ),

        pre: ({
          children,
        }) => (
          <pre className="my-5 overflow-x-auto rounded-xl bg-[#101827] p-4 text-sm leading-6 text-slate-100">
            {children}
          </pre>
        ),

        table: ({
          children,
        }) => (
          <div className="my-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        ),

        thead: ({
          children,
        }) => (
          <thead className="bg-slate-100 text-slate-900">
            {children}
          </thead>
        ),

        th: ({
          children,
        }) => (
          <th className="border-b border-slate-200 px-4 py-3 font-semibold">
            {children}
          </th>
        ),

        td: ({
          children,
        }) => (
          <td className="border-b border-slate-100 px-4 py-3 align-top">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AssistantPage() {
  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  // =========================================================
  // HYDRATION
  // =========================================================

  const [
    mounted,
    setMounted,
  ] = useState(false);

  // =========================================================
  // USER
  // =========================================================

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );

  // =========================================================
  // CONVERSATIONS
  // =========================================================

  const [
    conversations,
    setConversations,
  ] =
    useState<Conversation[]>(
      []
    );

  const [
    currentConversationId,
    setCurrentConversationId,
  ] =
    useState<string | null>(
      null
    );

  // =========================================================
  // MESSAGES
  // =========================================================

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>([
      welcomeMessage,
    ]);

  const [
    input,
    setInput,
  ] = useState("");

  // =========================================================
  // UI STATE
  // =========================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    initializing,
    setInitializing,
  ] = useState(true);

  const [
    loadingConversation,
    setLoadingConversation,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] =
    useState<string | null>(
      null
    );

  const [
    mode,
    setMode,
  ] =
    useState<
      "chat" | "image"
    >("chat");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  // =========================================================
  // MOUNT
  // =========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // =========================================================
  // CURRENT CONVERSATION
  // =========================================================

  const currentConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        currentConversationId
    ) ?? null;

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    if (!mounted) {
      return;
    }

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [
    messages,
    loading,
    mounted,
  ]);

  // =========================================================
  // PREPARE DATABASE MESSAGES
  // =========================================================

  async function prepareMessages(
    rows: DatabaseMessage[]
  ): Promise<Message[]> {
    const prepared =
      await Promise.all(
        rows
          .filter(
            (row) =>
              row.role ===
                "user" ||
              row.role ===
                "assistant"
          )
          .map(
            async (
              row
            ): Promise<Message> => {
              const isImage =
                row.message_type ===
                "image";

              let signedImageUrl:
                | string
                | null = null;

              if (
                isImage &&
                row.image_url
              ) {
                const {
                  data,
                  error,
                } =
                  await supabase.storage
                    .from(
                      "assistant-images"
                    )
                    .createSignedUrl(
                      row.image_url,
                      60 * 60
                    );

                if (
                  !error &&
                  data?.signedUrl
                ) {
                  signedImageUrl =
                    data.signedUrl;
                }
              }

              return {
                id: row.id,

                role:
                  row.role as
                    | "user"
                    | "assistant",

                content:
                  row.content,

                createdAt:
                  row.created_at,

                messageType:
                  isImage
                    ? "image"
                    : "text",

                imagePath:
                  row.image_url,

                imageUrl:
                  signedImageUrl,
              };
            }
          )
      );

    return prepared;
  }

  // =========================================================
  // INITIALIZE USER + CONVERSATIONS
  // =========================================================

  useEffect(() => {
    if (!mounted) {
      return;
    }

    let active =
      true;

    async function initialize() {
      setInitializing(
        true
      );

      setErrorMessage(
        ""
      );

      try {
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
          throw new Error(
            "Your Bokhoni session could not be verified."
          );
        }

        if (!active) {
          return;
        }

        setUserId(
          user.id
        );

        const {
          data:
            conversationData,
          error:
            conversationError,
        } =
          await supabase
            .from(
              "conversations"
            )
            .select(
              `
                id,
                user_id,
                title,
                archived,
                created_at,
                updated_at
              `
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "archived",
              false
            )
            .order(
              "updated_at",
              {
                ascending:
                  false,
              }
            );

        if (
          conversationError
        ) {
          throw conversationError;
        }

        if (!active) {
          return;
        }

        const list =
          (
            conversationData ??
            []
          ) as Conversation[];

        setConversations(
          list
        );

        if (
          list.length === 0
        ) {
          setMessages([
            welcomeMessage,
          ]);

          return;
        }

        const latest =
          list[0];

        const {
          data:
            messageData,
          error:
            messageError,
        } =
          await supabase
            .from(
              "messages"
            )
            .select(
              `
                id,
                role,
                content,
                created_at,
                message_type,
                image_url
              `
            )
            .eq(
              "conversation_id",
              latest.id
            )
            .eq(
              "user_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (
          messageError
        ) {
          throw messageError;
        }

        const history =
          await prepareMessages(
            (
              messageData ??
              []
            ) as DatabaseMessage[]
          );

        if (!active) {
          return;
        }

        setCurrentConversationId(
          latest.id
        );

        setMessages(
          history.length > 0
            ? history
            : [
                welcomeMessage,
              ]
        );
      } catch (
        error
      ) {
        console.error(
          "Bokhoni initialization error:",
          error
        );

        if (active) {
          setErrorMessage(
            "Bokhoni could not load your conversation history."
          );
        }
      } finally {
        if (active) {
          setInitializing(
            false
          );
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [
    mounted,
    supabase,
  ]);

  // =========================================================
  // LOAD CONVERSATION
  // =========================================================

  async function loadConversation(
    conversationId: string
  ) {
    if (
      !userId ||
      loading
    ) {
      return;
    }

    setLoadingConversation(
      true
    );

    setErrorMessage(
      ""
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "messages"
          )
          .select(
            `
              id,
              role,
              content,
              created_at,
              message_type,
              image_url
            `
          )
          .eq(
            "conversation_id",
            conversationId
          )
          .eq(
            "user_id",
            userId
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          );

      if (error) {
        throw error;
      }

      const loaded =
        await prepareMessages(
          (
            data ??
            []
          ) as DatabaseMessage[]
        );

      setCurrentConversationId(
        conversationId
      );

      setMessages(
        loaded.length > 0
          ? loaded
          : [
              welcomeMessage,
            ]
      );

      setMode("chat");
    } catch (
      error
    ) {
      console.error(
        "Load conversation error:",
        error
      );

      setErrorMessage(
        "Bokhoni could not load this conversation."
      );
    } finally {
      setLoadingConversation(
        false
      );
    }
  }

  // =========================================================
  // CREATE CONVERSATION
  // =========================================================

  async function createConversation(
    firstMessage: string
  ) {
    if (!userId) {
      throw new Error(
        "Your Bokhoni account is not ready."
      );
    }

    const title =
      createConversationTitle(
        firstMessage
      );

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "conversations"
        )
        .insert({
          user_id:
            userId,

          title,

          archived:
            false,
        })
        .select(
          `
            id,
            user_id,
            title,
            archived,
            created_at,
            updated_at
          `
        )
        .single();

    if (
      error ||
      !data
    ) {
      console.error(
        "Create conversation error:",
        error
      );

      throw new Error(
        "Bokhoni could not create this conversation."
      );
    }

    const conversation =
      data as Conversation;

    setCurrentConversationId(
      conversation.id
    );

    setConversations(
      (current) => [
        conversation,

        ...current.filter(
          (item) =>
            item.id !==
            conversation.id
        ),
      ]
    );

    return conversation;
  }

  // =========================================================
  // SAVE TEXT MESSAGE
  // =========================================================

  async function saveTextMessage(
    conversationId: string,
    role:
      | "user"
      | "assistant",
    content: string
  ) {
    if (!userId) {
      throw new Error(
        "Your Bokhoni account is not ready."
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "messages"
        )
        .insert({
          conversation_id:
            conversationId,

          user_id:
            userId,

          role,

          content,

          message_type:
            "text",

          model:
            role ===
            "assistant"
              ? "gpt-6-luna"
              : null,
        })
        .select(
          `
            id,
            created_at
          `
        )
        .single();

    if (
      error ||
      !data
    ) {
      console.error(
        "Save message error:",
        error
      );

      throw new Error(
        "Bokhoni could not save this message."
      );
    }

    return data;
  }

  // =========================================================
  // UPDATE CONVERSATION TIME
  // =========================================================

  async function touchConversation(
    conversationId: string
  ) {
    if (!userId) {
      return;
    }

    const now =
      new Date()
        .toISOString();

    const {
      error,
    } =
      await supabase
        .from(
          "conversations"
        )
        .update({
          updated_at:
            now,
        })
        .eq(
          "id",
          conversationId
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "Conversation update error:",
        error
      );

      return;
    }

    setConversations(
      (current) => {
        const selected =
          current.find(
            (
              conversation
            ) =>
              conversation.id ===
              conversationId
          );

        if (!selected) {
          return current;
        }

        const updated: Conversation = {
          ...selected,
          updated_at: now,
        };

        return [
          updated,

          ...current.filter(
            (
              conversation
            ) =>
              conversation.id !==
              conversationId
          ),
        ];
      }
    );
  }

  // =========================================================
  // TEXT CHAT
  // =========================================================

  async function sendMessage(
    messageText?: string
  ) {
    const cleanMessage =
      (
        messageText ??
        input
      ).trim();

    if (
      !cleanMessage ||
      loading
    ) {
      return;
    }

    if (!userId) {
      setErrorMessage(
        "Your Bokhoni account is still loading."
      );

      return;
    }

    setErrorMessage("");
    setLoading(true);

    let conversationId =
      currentConversationId;

    let assistantId =
      crypto.randomUUID();

    let fullResponse =
      "";

    try {
      if (
        !conversationId
      ) {
        const conversation =
          await createConversation(
            cleanMessage
          );

        conversationId =
          conversation.id;
      }

      const previous =
        messages.filter(
          (message) =>
            message.id !==
            "welcome"
        );

      const localUser: Message = {
        id:
          crypto.randomUUID(),

        role:
          "user",

        content:
          cleanMessage,

        messageType:
          "text",

        createdAt:
          new Date()
            .toISOString(),
      };

      const apiMessages = [
        ...previous,
        localUser,
      ];

      const savedUser =
        await saveTextMessage(
          conversationId,
          "user",
          cleanMessage
        );

      localUser.id =
        savedUser.id;

      localUser.createdAt =
        savedUser.created_at;

      setMessages([
        ...previous,

        localUser,

        {
          id:
            assistantId,

          role:
            "assistant",

          content:
            "",

          messageType:
            "text",

          createdAt:
            new Date()
              .toISOString(),
        },
      ]);

      setInput("");

      const response =
        await fetch(
          "/api/assistant",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                messages:
                  apiMessages.map(
                    (
                      message
                    ) => ({
                      role:
                        message.role,

                      content:
                        message.content,
                    })
                  ),
              }),
          }
        );

      if (
        !response.ok
      ) {
        const data =
          await response
            .json()
            .catch(
              () => null
            );

        throw new Error(
          data?.error ||
            "Bokhoni Assistant could not respond."
        );
      }

      if (
        !response.body
      ) {
        throw new Error(
          "Bokhoni did not return a response stream."
        );
      }

      const reader =
        response.body
          .getReader();

      const decoder =
        new TextDecoder();

      while (true) {
        const {
          value,
          done,
        } =
          await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream:
                true,
            }
          );

        if (!chunk) {
          continue;
        }

        fullResponse +=
          chunk;

        setMessages(
          (current) =>
            current.map(
              (message) =>
                message.id ===
                assistantId
                  ? {
                      ...message,

                      content:
                        fullResponse,
                    }
                  : message
            )
        );
      }

      const finalChunk =
        decoder.decode();

      if (finalChunk) {
        fullResponse +=
          finalChunk;

        setMessages(
          (current) =>
            current.map(
              (message) =>
                message.id ===
                assistantId
                  ? {
                      ...message,
                      content:
                        fullResponse,
                    }
                  : message
            )
        );
      }

      if (
        !fullResponse.trim()
      ) {
        throw new Error(
          "Bokhoni returned an empty response."
        );
      }

      const savedAssistant =
        await saveTextMessage(
          conversationId,
          "assistant",
          fullResponse
        );

      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              assistantId
                ? {
                    ...message,

                    id:
                      savedAssistant.id,

                    createdAt:
                      savedAssistant.created_at,

                    content:
                      fullResponse,
                  }
                : message
          )
      );

      assistantId =
        savedAssistant.id;

      await touchConversation(
        conversationId
      );
    } catch (
      error
    ) {
      console.error(
        "Bokhoni text error:",
        error
      );

      if (
        !fullResponse.trim()
      ) {
        setMessages(
          (current) =>
            current.filter(
              (message) =>
                message.id !==
                assistantId
            )
        );
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // IMAGE GENERATION
  // =========================================================

  async function generateImage(
    promptText?: string
  ) {
    const cleanPrompt =
      (
        promptText ??
        input
      ).trim();

    if (
      !cleanPrompt ||
      loading
    ) {
      return;
    }

    if (!userId) {
      setErrorMessage(
        "Your Bokhoni account is still loading."
      );

      return;
    }

    setErrorMessage("");
    setLoading(true);

    let conversationId =
      currentConversationId;

    const temporaryImageId =
      crypto.randomUUID();

    try {
      // ------------------------------------------------------
      // CREATE CONVERSATION IF NEEDED
      // ------------------------------------------------------

      if (
        !conversationId
      ) {
        const conversation =
          await createConversation(
            cleanPrompt
          );

        conversationId =
          conversation.id;
      }

      const previous =
        messages.filter(
          (message) =>
            message.id !==
            "welcome"
        );

      // ------------------------------------------------------
      // SAVE USER IMAGE REQUEST
      // ------------------------------------------------------

      const localUser: Message = {
        id:
          crypto.randomUUID(),

        role:
          "user",

        content:
          cleanPrompt,

        messageType:
          "text",

        createdAt:
          new Date()
            .toISOString(),
      };

      const savedUser =
        await saveTextMessage(
          conversationId,
          "user",
          cleanPrompt
        );

      localUser.id =
        savedUser.id;

      localUser.createdAt =
        savedUser.created_at;

      // ------------------------------------------------------
      // DISPLAY GENERATING CARD
      // ------------------------------------------------------

      setMessages([
        ...previous,

        localUser,

        {
          id:
            temporaryImageId,

          role:
            "assistant",

          content:
            cleanPrompt,

          messageType:
            "image",

          imageUrl:
            null,

          imagePath:
            null,

          createdAt:
            new Date()
              .toISOString(),
        },
      ]);

      setInput("");

      // ------------------------------------------------------
      // IMAGE API
      // ------------------------------------------------------

      const response =
        await fetch(
          "/api/assistant/image",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                prompt:
                  cleanPrompt,

                conversationId,
              }),
          }
        );

      const data =
        (
          await response.json()
        ) as ImageApiResponse;

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Bokhoni could not generate the image."
        );
      }

      if (
        !data.imageUrl ||
        !data.imagePath
      ) {
        throw new Error(
          "Bokhoni generated no usable image."
        );
      }

      const finalMessageId =
        data.messageId ??
        temporaryImageId;

      // ------------------------------------------------------
      // SHOW GENERATED IMAGE
      // ------------------------------------------------------

      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              temporaryImageId
                ? {
                    ...message,

                    id:
                      finalMessageId,

                    content:
                      `Generated image: ${cleanPrompt}`,

                    messageType:
                      "image",

                    imagePath:
                      data.imagePath,

                    imageUrl:
                      data.imageUrl,
                  }
                : message
          )
      );

      await touchConversation(
        conversationId
      );

      setMode("chat");
    } catch (
      error
    ) {
      console.error(
        "Bokhoni image error:",
        error
      );

      setMessages(
        (current) =>
          current.filter(
            (message) =>
              message.id !==
              temporaryImageId
          )
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Bokhoni could not generate the image."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // SMART SUBMIT
  // =========================================================

  function submitCurrentInput() {
    const clean =
      input.trim();

    if (
      !clean ||
      loading
    ) {
      return;
    }

    // Manual image mode OR
    // automatic image request detection.
    if (
      mode === "image" ||
      looksLikeImageRequest(
        clean
      )
    ) {
      void generateImage(
        clean
      );

      return;
    }

    void sendMessage(
      clean
    );
  }

  // =========================================================
  // FORM
  // =========================================================

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    submitCurrentInput();
  }

  // =========================================================
  // KEYBOARD
  // =========================================================

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      submitCurrentInput();
    }
  }

  // =========================================================
  // NEW CONVERSATION
  // =========================================================

  function startNewConversation() {
    if (loading) {
      return;
    }

    setCurrentConversationId(
      null
    );

    setMessages([
      {
        ...welcomeMessage,

        content:
          "New conversation started. What problem, idea, project or business would you like to work on?",
      },
    ]);

    setMode("chat");
    setInput("");
    setErrorMessage("");
    setCopiedMessageId(
      null
    );
  }

  // =========================================================
  // DELETE CONVERSATION
  // =========================================================

  async function deleteConversation(
    conversationId: string
  ) {
    if (
      !userId ||
      loading
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this conversation? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    try {
      // ------------------------------------------------------
      // FIND IMAGES
      // ------------------------------------------------------

      const {
        data:
          imageMessages,
        error:
          imageLookupError,
      } =
        await supabase
          .from(
            "messages"
          )
          .select(
            "image_url"
          )
          .eq(
            "conversation_id",
            conversationId
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "message_type",
            "image"
          );

      if (
        imageLookupError
      ) {
        console.error(
          "Image lookup error:",
          imageLookupError
        );
      }

      const imagePaths =
        (
          imageMessages ??
          []
        )
          .map(
            (item) =>
              item.image_url
          )
          .filter(
            (
              path
            ): path is string =>
              typeof path ===
                "string" &&
              path.length > 0
          );

      // ------------------------------------------------------
      // REMOVE STORAGE IMAGES
      // ------------------------------------------------------

      if (
        imagePaths.length >
        0
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              "assistant-images"
            )
            .remove(
              imagePaths
            );

        if (
          storageError
        ) {
          console.error(
            "Image cleanup error:",
            storageError
          );
        }
      }

      // ------------------------------------------------------
      // DELETE CONVERSATION
      // messages cascade-delete.
      // ------------------------------------------------------

      const {
        error,
      } =
        await supabase
          .from(
            "conversations"
          )
          .delete()
          .eq(
            "id",
            conversationId
          )
          .eq(
            "user_id",
            userId
          );

      if (error) {
        throw error;
      }

      const remaining =
        conversations.filter(
          (
            conversation
          ) =>
            conversation.id !==
            conversationId
        );

      setConversations(
        remaining
      );

      if (
        currentConversationId ===
        conversationId
      ) {
        if (
          remaining.length >
          0
        ) {
          await loadConversation(
            remaining[0].id
          );
        } else {
          startNewConversation();
        }
      }
    } catch (
      error
    ) {
      console.error(
        "Delete conversation error:",
        error
      );

      setErrorMessage(
        "Bokhoni could not delete this conversation."
      );
    }
  }

  // =========================================================
  // COPY
  // =========================================================

  async function copyMessage(
    messageId: string,
    content: string
  ) {
    if (!content.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopiedMessageId(
        messageId
      );

      window.setTimeout(
        () => {
          setCopiedMessageId(
            null
          );
        },
        2000
      );
    } catch {
      console.error(
        "Could not copy Bokhoni response."
      );
    }
  }

  // =========================================================
  // HYDRATION-SAFE FIRST RENDER
  // =========================================================

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
        <div className="min-h-screen" />
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="flex min-h-screen">

        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white md:flex">

          {/* BRAND */}

          <div className="border-b border-slate-200 p-5">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
                B
              </div>

              <div>
                <p className="font-semibold text-slate-950">
                  Bokhoni AI
                </p>

                <p className="text-xs text-slate-500">
                  From Ideas to Impact
                </p>
              </div>
            </Link>
          </div>

          {/* NEW CONVERSATION */}

          <div className="p-4">
            <button
              type="button"
              onClick={
                startNewConversation
              }
              disabled={
                loading
              }
              className="w-full rounded-xl bg-[#101827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1c2738] disabled:cursor-not-allowed disabled:opacity-50"
            >
              + New conversation
            </button>
          </div>

          {/* CONVERSATIONS */}

          <div className="flex-1 overflow-y-auto px-4 pb-4">

            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Conversations
            </p>

            {initializing ? (
              <div className="mt-3 px-2 text-sm text-slate-400">
                Loading conversations...
              </div>
            ) : conversations.length ===
              0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-400">
                Your conversations will appear here.
              </div>
            ) : (
              <div className="mt-3 space-y-1">

                {conversations.map(
                  (
                    conversation
                  ) => {
                    const active =
                      conversation.id ===
                      currentConversationId;

                    return (
                      <div
                        key={
                          conversation.id
                        }
                        className={`group flex items-center gap-1 rounded-xl transition ${
                          active
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >

                        <button
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            void loadConversation(
                              conversation.id
                            )
                          }
                          className="min-w-0 flex-1 px-3 py-3 text-left"
                        >
                          <p
                            className={`truncate text-sm ${
                              active
                                ? "font-semibold text-slate-950"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {
                              conversation.title
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatConversationDate(
                              conversation.updated_at
                            )}
                          </p>
                        </button>

                        <button
                          type="button"
                          title="Delete conversation"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            void deleteConversation(
                              conversation.id
                            )
                          }
                          className="mr-2 rounded-lg px-2 py-1 text-xs text-slate-400 opacity-0 transition hover:bg-white hover:text-red-600 group-hover:opacity-100"
                        >
                          Delete
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* WORKSPACE */}

          <div className="border-t border-slate-200 p-4">
            <Link
              href="/"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              ← Back to workspace
            </Link>
          </div>

        </aside>

        {/* ===================================================
            MAIN
        ==================================================== */}

        <section className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}

          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">

            <div className="flex items-center justify-between px-5 py-4 md:px-8">

              <div className="flex min-w-0 items-center gap-3">

                <Link
                  href="/"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101827] font-bold text-white md:hidden"
                >
                  B
                </Link>

                <div className="min-w-0">

                  <h1 className="font-semibold text-slate-950">
                    Bokhoni Assistant
                  </h1>

                  <p className="max-w-lg truncate text-xs text-slate-500">
                    {currentConversation
                      ? currentConversation.title
                      : "Innovation and enterprise intelligence"}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  startNewConversation
                }
                disabled={
                  loading
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 md:hidden"
              >
                New
              </button>

            </div>

          </header>

          {/* =================================================
              CHAT
          ================================================== */}

          <div className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-8">

              {loadingConversation && (
                <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                  Loading conversation...
                </div>
              )}

              {/* START SCREEN */}

              {!loadingConversation &&
                messages.length ===
                  1 &&
                messages[0].id ===
                  "welcome" && (
                  <section className="mb-10">

                    <p className="text-sm font-medium text-slate-500">
                      Bokhoni AI
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      What are you working on?
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      Explore a problem, validate an idea, develop a project, build a business or create a visual with Bokhoni.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                      {starterQuestions.map(
                        (
                          question
                        ) => (
                          <button
                            key={
                              question
                            }
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              void sendMessage(
                                question
                              )
                            }
                            className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:opacity-50"
                          >
                            {
                              question
                            }
                          </button>
                        )
                      )}

                    </div>

                  </section>
                )}

              {/* MESSAGES */}

              <div className="space-y-7">

                {messages.map(
                  (
                    message
                  ) => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.role ===
                        "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >

                      {/* USER */}

                      {message.role ===
                      "user" ? (
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#101827] px-5 py-4 text-sm leading-7 text-white shadow-sm md:max-w-[75%]">
                          {
                            message.content
                          }
                        </div>
                      ) : (

                        /* ASSISTANT */

                        <div className="w-full max-w-[92%] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:max-w-[88%]">

                          {/* ASSISTANT HEADER */}

                          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">

                            <div className="flex items-center gap-2">

                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#101827] text-xs font-bold text-white">
                                B
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-slate-950">
                                  Bokhoni
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  {message.messageType ===
                                  "image"
                                    ? "Image generation"
                                    : "AI Assistant"}
                                </p>

                              </div>

                            </div>

                            {/* COPY */}

                            {message.messageType !==
                              "image" &&
                              message.id !==
                                "welcome" &&
                              message.content.trim() && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyMessage(
                                      message.id,
                                      message.content
                                    )
                                  }
                                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                  {copiedMessageId ===
                                  message.id
                                    ? "Copied"
                                    : "Copy"}
                                </button>
                              )}

                          </div>

                          {/* =================================
                              IMAGE MESSAGE
                          ================================== */}

                          {message.messageType ===
                          "image" ? (
                            <div>

                              {message.imageUrl ? (
                                <>

                                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        message.imageUrl
                                      }
                                      alt={
                                        message.content
                                      }
                                      className="h-auto w-full object-contain"
                                    />

                                  </div>

                                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-sm leading-6 text-slate-500">
                                      {
                                        message.content
                                      }
                                    </p>

                                    <a
                                      href={
                                        message.imageUrl
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Open image
                                    </a>

                                  </div>

                                </>
                              ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200">

                                  <div className="aspect-square animate-pulse bg-slate-100" />

                                  <div className="border-t border-slate-200 p-4">

                                    <p className="text-sm font-medium text-slate-900">
                                      Creating image...
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      Bokhoni is generating your visual.
                                    </p>

                                  </div>

                                </div>
                              )}

                            </div>
                          ) : (

                            /* ===============================
                                TEXT MESSAGE
                            ================================ */

                            <>
                              {!message.content.trim() &&
                              loading ? (

                                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">

                                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />

                                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />

                                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />

                                  <span className="ml-1">
                                    Starting response...
                                  </span>

                                </div>

                              ) : (

                                <div className="text-[15px] leading-7 text-slate-700">

                                  <MarkdownContent
                                    content={
                                      message.content
                                    }
                                  />

                                  {/* STREAM CURSOR */}

                                  {loading &&
                                    message.id ===
                                      messages[
                                        messages.length -
                                          1
                                      ]?.id &&
                                    message.content.trim() && (
                                      <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-sm bg-slate-500 align-middle" />
                                    )}

                                </div>

                              )}
                            </>

                          )}

                        </div>
                      )}

                    </div>
                  )
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />

              </div>

            </div>

          </div>

          {/* =================================================
              INPUT
          ================================================== */}

          <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">

            <div className="mx-auto max-w-4xl px-5 py-4 md:px-8">

              {/* ERROR */}

              {errorMessage && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {
                    errorMessage
                  }
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={
                  handleSubmit
                }
                className={`rounded-2xl border bg-white p-2 shadow-sm transition focus-within:ring-2 ${
                  mode ===
                  "image"
                    ? "border-violet-300 focus-within:border-violet-500 focus-within:ring-violet-100"
                    : "border-slate-300 focus-within:border-slate-500 focus-within:ring-slate-100"
                }`}
              >

                {/* IMAGE MODE NOTICE */}

                {mode ===
                  "image" && (
                  <div className="mx-2 mt-1 flex flex-wrap items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">

                    <span>
                      Image mode
                    </span>

                    <span className="font-normal text-violet-500">
                      Describe the picture, logo, poster, prototype or visual you want.
                    </span>

                  </div>
                )}

                {/* TEXTAREA */}

                <textarea
                  value={
                    input
                  }
                  onChange={(
                    event
                  ) =>
                    setInput(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  placeholder={
                    mode ===
                    "image"
                      ? "Describe the image, logo, poster, prototype or visual you want..."
                      : "Ask Bokhoni about your idea, problem, research or project..."
                  }
                  rows={2}
                  disabled={
                    loading
                  }
                  className="max-h-40 min-h-16 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />

                <div className="flex items-center justify-between gap-2 px-2 pb-1">

                  <div className="flex min-w-0 items-center gap-2">

                    {/* IMAGE BUTTON */}

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setMode(
                          (
                            current
                          ) =>
                            current ===
                            "image"
                              ? "chat"
                              : "image"
                        )
                      }
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                        mode ===
                        "image"
                          ? "bg-violet-100 text-violet-700"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="3"
                        />

                        <circle
                          cx="8.5"
                          cy="8.5"
                          r="1.5"
                        />

                        <path d="m21 15-5-5L5 21" />
                      </svg>

                      Image
                    </button>

                    <p className="hidden truncate text-xs text-slate-400 sm:block">
                      Enter to send · Shift + Enter for new line
                    </p>

                  </div>

                  {/* SEND / GENERATE */}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !input.trim()
                    }
                    className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      mode ===
                      "image"
                        ? "bg-violet-700 hover:bg-violet-800"
                        : "bg-[#101827] hover:bg-[#1c2738]"
                    }`}
                  >
                    {loading
                      ? mode ===
                        "image"
                        ? "Generating..."
                        : "Responding..."
                      : mode ===
                        "image"
                        ? "Generate"
                        : "Send"}
                  </button>

                </div>

              </form>

              {/* DISCLAIMER */}

              <p className="mt-2 text-center text-[11px] text-slate-400">
                Bokhoni can make mistakes. Validate important information before making decisions.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}