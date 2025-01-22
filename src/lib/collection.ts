import type { BunFile } from "bun";
import matter from "gray-matter";
import path from "node:path";
import * as prod from "react/jsx-runtime";
import rehypeReact from "rehype-react";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { parse, type GenericSchema, type InferOutput } from "valibot";
import { components } from "../components";
import { LocaleContext } from "./context";

export type QueryResult<TMeta> = {
  meta: TMeta;
  content: React.ReactNode;
};

export function queryCollection<TMeta extends GenericSchema>(
  pattern: string,
  meta?: TMeta
): {
  first(): Promise<QueryResult<InferOutput<TMeta>> | null>;
  all(): Promise<Array<QueryResult<InferOutput<TMeta>>>>;
} {
  const glob = new Bun.Glob(pattern);

  const locale = LocaleContext.use();

  const basePath = path.join(import.meta.dir, "content", locale);

  const files = glob.scan(basePath);

  async function getFile(str: string) {
    return Bun.file(path.join(basePath, str));
  }

  return {
    async first() {
      const result = await files.next();

      if (result.done) {
        return null;
      }

      return parseMarkdown(await getFile(result.value), meta);
    },

    async all() {
      const result = [];

      for await (const file of files) {
        result.push(parseMarkdown(await getFile(file), meta));
      }

      return Promise.all(result);
    },
  };
}

async function parseMarkdown<TMeta extends GenericSchema>(
  file: BunFile,
  meta?: TMeta
) {
  const { data, content } = matter(await file.text());
  const parsedMeta = meta ? parse(meta, data) : data;

  const { result } = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeReact, {
      ...production,
      components,
    })
    .process(content);

  return {
    meta: parsedMeta ?? {},
    content: result as React.ReactNode,
  };
}

const production = {
  Fragment: prod.Fragment,
  jsx: prod.jsx,
  jsxs: prod.jsxs,
};
