import { renderResumeStream } from "./resume";
import { LocaleContext } from "./lib/context";

Bun.serve({
  fetch: async (req) => {
    return LocaleContext.with("en", async () => {
      const stream = await renderResumeStream();

      return new Response(stream, {
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    });
  },
  port: 3000,
});
