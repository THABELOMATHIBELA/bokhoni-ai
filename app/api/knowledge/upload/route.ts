import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractPdfText } from "@/utils/pdf/extract-text";

const BUCKET_NAME = "knowledge-documents";
const DEFAULT_DOMAIN_SLUG = "general-knowledge";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
  "md",
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    /*
     * STEP 1:
     * Confirm that the user is authenticated.
     */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * STEP 2:
     * Confirm that the user is an active
     * Bokhoni administrator.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "ADMIN PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Your administrator profile could not be verified.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !profile ||
      !["admin", "super_admin"].includes(
        profile.role
      ) ||
      profile.account_status !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access is required.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * STEP 3:
     * Read the uploaded document.
     */
    const formData =
      await request.formData();

    const uploaded =
      formData.get("file");

    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please select a document.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * STEP 4:
     * Validate file size.
     */
    if (uploaded.size === 0) {
      return NextResponse.json(
        {
          error:
            "The selected document is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      uploaded.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "The document must not exceed 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * STEP 5:
     * Determine and validate the extension.
     */
    const extension =
      uploaded.name
        .split(".")
        .pop()
        ?.trim()
        .toLowerCase();

    if (
      !extension ||
      !ALLOWED_EXTENSIONS.includes(
        extension
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only PDF, DOCX, TXT and MD documents are currently supported.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * STEP 6:
     * Convert the browser File into a
     * Node.js Buffer.
     */
    const arrayBuffer =
      await uploaded.arrayBuffer();

    const fileBuffer =
      Buffer.from(arrayBuffer);

    /*
     * STEP 7:
     * Automatically create the document title
     * from the uploaded filename.
     *
     * Example:
     *
     * Research Report.pdf
     *
     * becomes:
     *
     * Research Report
     */
    const documentTitle =
      uploaded.name
        .replace(/\.[^.]+$/, "")
        .trim();

    if (!documentTitle) {
      return NextResponse.json(
        {
          error:
            "The uploaded document does not have a valid filename.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * STEP 8:
     * Extract readable text where supported.
     */
    let extractedText:
      | string
      | null = null;

    if (extension === "pdf") {
      try {
        const pdfText =
          await extractPdfText(
            fileBuffer
          );

        extractedText =
          pdfText.trim();

        if (!extractedText) {
          console.warn(
            "PDF contains no extractable text:",
            uploaded.name
          );
        }
      } catch (pdfError) {
        /*
         * Do not reject the original document
         * simply because text extraction failed.
         *
         * The original PDF can still be stored
         * and processed later.
         */
        console.error(
          "PDF EXTRACTION ERROR:",
          pdfError
        );

        extractedText = null;
      }
    }

    if (
      extension === "txt" ||
      extension === "md"
    ) {
      extractedText =
        fileBuffer
          .toString("utf8")
          .trim();
    }

    /*
     * DOCX extraction is not connected yet.
     *
     * DOCX therefore uploads successfully,
     * but remains pending for later processing.
     */
    const processingStatus =
      extractedText
        ? "completed"
        : "pending";

    /*
     * STEP 9:
     * Find the default General Knowledge domain.
     *
     * Every newly uploaded document can start
     * here before later classification into
     * specialised Bokhoni domains.
     */
    const {
      data: defaultDomain,
      error: domainError,
    } = await supabase
      .from("knowledge_domains")
      .select("id, name, slug")
      .eq(
        "slug",
        DEFAULT_DOMAIN_SLUG
      )
      .maybeSingle();

    if (domainError) {
      console.error(
        "KNOWLEDGE DOMAIN ERROR:",
        domainError
      );

      return NextResponse.json(
        {
          error:
            "Bokhoni could not access the General Knowledge domain.",
        },
        {
          status: 500,
        }
      );
    }

    if (!defaultDomain) {
      console.error(
        "GENERAL KNOWLEDGE DOMAIN NOT FOUND"
      );

      return NextResponse.json(
        {
          error:
            'The "General Knowledge" domain has not been created yet.',
        },
        {
          status: 500,
        }
      );
    }

    const defaultDomainId =
      defaultDomain.id;

    /*
     * STEP 10:
     * Automatically find or create the
     * knowledge source.
     *
     * The administrator DOES NOT need to
     * manually create a knowledge source.
     */
    let sourceId:
      | string
      | null = null;

    let sourceWasCreated =
      false;

    /*
     * Check whether an appropriate source
     * already exists.
     */
    const {
      data: existingSources,
      error: existingSourceError,
    } = await supabase
      .from("knowledge_sources")
      .select("id")
      .eq(
        "title",
        documentTitle
      )
      .eq(
        "domain_id",
        defaultDomainId
      )
      .limit(1);

    if (existingSourceError) {
      console.error(
        "KNOWLEDGE SOURCE LOOKUP ERROR:",
        existingSourceError
      );

      return NextResponse.json(
        {
          error:
            "Bokhoni could not check the knowledge-source database.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Reuse an existing source when one exists.
     */
    if (
      existingSources &&
      existingSources.length > 0
    ) {
      sourceId =
        existingSources[0].id;
    }

    /*
     * Otherwise create the source automatically.
     */
    if (!sourceId) {
      const {
        data: newSource,
        error: sourceCreateError,
      } = await supabase
        .from("knowledge_sources")
        .insert({
          domain_id:
            defaultDomainId,

          title:
            documentTitle,

          source_type:
            "document",

          description:
            `Automatically created from uploaded document: ${uploaded.name}`,

          verification_status:
            "draft",

          is_published:
            false,
        })
        .select("id")
        .single();

      if (
        sourceCreateError ||
        !newSource
      ) {
        console.error(
          "KNOWLEDGE SOURCE CREATION ERROR:",
          sourceCreateError
        );

        return NextResponse.json(
          {
            error:
              "Bokhoni could not automatically register the document source. Check the server terminal.",
          },
          {
            status: 500,
          }
        );
      }

      sourceId =
        newSource.id;

      sourceWasCreated =
        true;
    }

    /*
     * STEP 11:
     * Generate a private unique Storage path.
     */
    const filePath =
      `${user.id}/${crypto.randomUUID()}.${extension}`;

    /*
     * STEP 12:
     * Upload the original document to
     * Supabase Storage.
     */
    const {
      data: storageData,
      error: uploadError,
    } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(
        filePath,
        fileBuffer,
        {
          contentType:
            uploaded.type ||
            "application/octet-stream",

          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        "KNOWLEDGE STORAGE ERROR:",
        uploadError
      );

      /*
       * If Bokhoni created a new source during
       * this upload, remove it when storage fails.
       */
      if (
        sourceWasCreated &&
        sourceId
      ) {
        const {
          error:
            sourceCleanupError,
        } = await supabase
          .from(
            "knowledge_sources"
          )
          .delete()
          .eq(
            "id",
            sourceId
          );

        if (
          sourceCleanupError
        ) {
          console.error(
            "SOURCE CLEANUP ERROR:",
            sourceCleanupError
          );
        }
      }

      return NextResponse.json(
        {
          error:
            uploadError.message ||
            "The document could not be uploaded to storage.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * STEP 13:
     * Register the uploaded document in
     * knowledge_documents.
     */
    const {
      data: documentData,
      error: documentError,
    } = await supabase
      .from(
        "knowledge_documents"
      )
      .insert({
        source_id:
          sourceId,

        title:
          documentTitle,

        file_name:
          uploaded.name,

        file_url:
          storageData.path,

        mime_type:
          uploaded.type ||
          "application/octet-stream",

        extracted_text:
          extractedText,

        processing_status:
          processingStatus,

        language:
          "en",
      })
      .select("id")
      .single();

    /*
     * STEP 14:
     * Roll back Storage and newly-created
     * source if document registration fails.
     */
    if (
      documentError ||
      !documentData
    ) {
      console.error(
        "KNOWLEDGE DOCUMENT ERROR:",
        documentError
      );

      const {
        error:
          storageCleanupError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([
          storageData.path,
        ]);

      if (
        storageCleanupError
      ) {
        console.error(
          "STORAGE CLEANUP ERROR:",
          storageCleanupError
        );
      }

      if (
        sourceWasCreated &&
        sourceId
      ) {
        const {
          error:
            sourceCleanupError,
        } = await supabase
          .from(
            "knowledge_sources"
          )
          .delete()
          .eq(
            "id",
            sourceId
          );

        if (
          sourceCleanupError
        ) {
          console.error(
            "SOURCE CLEANUP ERROR:",
            sourceCleanupError
          );
        }
      }

      return NextResponse.json(
        {
          error:
            "The document could not be registered in the Bokhoni knowledge database.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * STEP 15:
     * Return successful upload information.
     */
    return NextResponse.json(
      {
        success: true,

        message:
          "Document uploaded successfully.",

        documentId:
          documentData.id,

        sourceId,

        sourceCreated:
          sourceWasCreated,

        domainId:
          defaultDomainId,

        domain:
          defaultDomain.name,

        fileName:
          uploaded.name,

        filePath:
          storageData.path,

        bucket:
          BUCKET_NAME,

        fileType:
          extension,

        processingStatus,

        textExtracted:
          Boolean(
            extractedText
          ),

        extractedCharacters:
          extractedText?.length ??
          0,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "KNOWLEDGE UPLOAD FAILED:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    console.error(
      "KNOWLEDGE UPLOAD ERROR MESSAGE:",
      errorMessage
    );

    return NextResponse.json(
      {
        error:
          "The document could not be uploaded. Check the server terminal for details.",
      },
      {
        status: 500,
      }
    );
  }
}