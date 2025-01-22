import { Document, Page, renderToStream } from "@react-pdf/renderer";
import { queryCollection } from "./lib/collection";

export async function renderResumeStream(): Promise<ReadableStream> {
  const intro = await queryCollection("intro.md").first();

  return renderToStream(
    <Document>
      <Page>{intro?.content}</Page>
    </Document>
  ) as never;
}
