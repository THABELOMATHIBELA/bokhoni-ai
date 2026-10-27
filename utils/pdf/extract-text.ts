import { extractText } from "unpdf";

const MAX_PDF_PAGES = 300;
const EXTRACTION_TIMEOUT_MS = 30_000;

export async function extractPdfText(
  fileBuffer: Buffer
): Promise<string> {
  /*
   * STEP 1:
   * Validate the PDF input.
   */
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new Error(
      "PDF input must be provided as a Buffer."
    );
  }

  if (fileBuffer.length === 0) {
    throw new Error(
      "The PDF file is empty."
    );
  }

  try {
    /*
     * STEP 2:
     * Convert Node.js Buffer to Uint8Array.
     */
    const pdfData = new Uint8Array(fileBuffer);

    /*
     * STEP 3:
     * Extract the PDF text.
     *
     * Passing the raw PDF data directly allows unpdf
     * to create and manage its internal PDF document.
     */
    const extractionPromise = extractText(
      pdfData,
      {
        mergePages: true,
      }
    );

    /*
     * STEP 4:
     * Prevent a malformed or very complex PDF from
     * keeping the server busy indefinitely.
     */
    const timeoutPromise = new Promise<never>(
      (_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "PDF extraction timed out."
            )
          );
        }, EXTRACTION_TIMEOUT_MS);
      }
    );

    const result = await Promise.race([
      extractionPromise,
      timeoutPromise,
    ]);

    /*
     * STEP 5:
     * Check the number of pages.
     */
    if (result.totalPages > MAX_PDF_PAGES) {
      throw new Error(
        `The PDF contains ${result.totalPages} pages. ` +
          `The maximum supported size is ${MAX_PDF_PAGES} pages.`
      );
    }

    /*
     * STEP 6:
     * mergePages normally returns one string.
     *
     * The array fallback makes the function safer
     * if the library response changes.
     */
    const rawText = Array.isArray(result.text)
      ? result.text.join("\n\n")
      : result.text;

    /*
     * STEP 7:
     * Clean the extracted text.
     */
    const cleanedText = rawText
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    /*
     * STEP 8:
     * Image-only/scanned PDFs may not contain
     * selectable text.
     */
    if (!cleanedText) {
      console.warn(
        "PDF contains no extractable text."
      );

      return "";
    }

    /*
     * STEP 9:
     * Return the cleaned PDF text.
     */
    return cleanedText;
  } catch (error) {
    console.error(
      "PDF TEXT EXTRACTION FAILED:",
      error
    );

    if (error instanceof Error) {
      throw new Error(
        `PDF text extraction failed: ${error.message}`
      );
    }

    throw new Error(
      "PDF text extraction failed because of an unknown error."
    );
  }
}