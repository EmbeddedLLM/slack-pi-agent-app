# Files in and out

## Files people send

Attach files to the message where you mention the bot. The bot downloads them, converts them, and puts them in front of the model.

| Kind | Extensions | How the model sees it |
|---|---|---|
| Images | `.png .jpg .jpeg .gif .webp` | As images (needs a model with image input) |
| Office and PDF | `.pdf .docx .pptx .xlsx .odt .odp .ods` | Extracted text; images inside become images too |
| Web pages | `.html .htm` | Text, with scripts and styles removed |
| Text and code | `.md .txt .csv .tsv .json .yaml .xml .log .sql .py .js .ts .go .rs …` | As is |

**Which files:**

- First, files on your own message, then the newest files posted earlier in the thread.
- At most `MAX_INPUT_FILES` (default 5) files, each up to `MAX_INPUT_FILE_BYTES` (20 MB).
- At most `MAX_INPUT_IMAGES` (8) images, counting uploaded images and images inside documents.

**How much text:** up to `ATTACHMENT_CHAR_BUDGET` characters of extracted text (default 40,000) go straight into the prompt, shared across the files. The full text is saved next to the file, and the model can read the rest with its `read` tool. The guard allows exactly that folder for that one request.

**Afterwards:** each request's files live in their own folder under `INPUT_FILES_DIR`, deleted when the request finishes. Leftovers from a crash are removed on the next start.

**Who:** roles with `readUploads: true` (member and admin by default). For others, the bot tells the model that files were shared but may not be read, so the answer can say so.

If a download fails, the reply says why, for example a missing `files:read` scope or the bot not being in the channel. `check-files.js` diagnoses it; see [Slack app](/setup/slack-app#changing-scopes-later-reinstall).

## Files the bot sends

Ask for a file and the bot attaches it:

```
@assistant turn this thread into a one-page PDF summary
```

The model wraps each file in a marked block. The bot takes it out of the chat text and uploads it:

| Asked for | Delivered as |
|---|---|
| PDF | Rendered from Markdown with headless Chromium (`md-to-pdf`): headings, lists, tables, code |
| Markdown, CSV, JSON, text, YAML, … | As written |

- **Limits:** at most `MAX_FILES_PER_REPLY` files (3), each up to `MAX_FILE_BYTES` (10 MB).
- **Safe file names:** names are cleaned, and unknown extensions get `.txt`.
- **Safe PDFs:** raw HTML in a PDF's source is shown as text, and images are dropped, so a document can't make the renderer load local files.
- **Who:** roles with `createFiles: true` (member and admin by default). Others get the answer in chat and a private note.
- **Long answers:** an answer longer than `REPLY_FILE_THRESHOLD` characters (12,000) is also attached as `reply.md`, with the start shown in chat.
