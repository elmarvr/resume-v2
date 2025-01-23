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

export type QueryResult<
  TPattern extends string,
  TData
> = TPattern extends `${string}.md`
  ? {
      meta: TData;
      content: React.ReactNode;
    }
  : TData;

export function queryContent<
  TPattern extends string,
  TSchema extends GenericSchema,
  TReturn = QueryResult<TPattern, InferOutput<TSchema>>
>(
  pattern: TPattern,
  opts?: {
    schema?: TSchema;
    transform?: (
      data: QueryResult<TPattern, InferOutput<TSchema>>
    ) => Promise<TReturn> | TReturn;
  }
): {
  first(): Promise<TReturn>;
  all(): Promise<Array<TReturn>>;
} {
  const { schema, transform = (data: any) => data } = opts ?? {};

  const glob = new Bun.Glob(pattern);

  const basePath = path.join(import.meta.dir, "../content");
  const files = glob.scan(basePath);

  const query = {
    [Symbol.asyncIterator]: () => query,
    async next() {
      const filePath = await files.next();
      if (filePath.done) {
        return { done: true, value: null };
      }

      const file = Bun.file(path.join(basePath, filePath.value));
      const ext = path.extname(filePath.value).slice(1);

      if (!hasLoader(ext)) {
        return { done: false, value: null };
      }

      const loader = loaders[ext];
      const value = await loader(file, { schema });
      return { done: false, value };
    },
  };

  return {
    async first() {
      const result = await query.next();

      if (result.done) {
        throw new Error(`Content for "${pattern}" not found`);
      }

      return await transform(result.value);
    },
    async all() {
      const result = await Array.fromAsync(query);

      return await Promise.all(
        result.filter((item) => item !== null).map(transform)
      );
    },
  };
}

function hasLoader(ext: string): ext is keyof typeof loaders {
  return ext in loaders;
}

const loaders = {
  md: async (file, ctx) => {
    const { data = {}, content } = matter(await file.text());
    const meta = ctx.schema ? parse(ctx.schema, data) : data;

    if (!content) {
      return {
        meta,
        content: null,
      };
    }

    const { result } = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeReact, {
        ...production,
        components,
      })
      .process(content);

    return {
      meta,
      content: result as React.ReactNode,
    };
  },
  json: async (file, ctx) => {
    const data = await file.json();

    return ctx.schema ? parse(ctx.schema, data) : data;
  },
} satisfies Record<
  string,
  (file: BunFile, ctx: { schema?: GenericSchema }) => Promise<unknown>
>;

const production = {
  Fragment: prod.Fragment,
  jsx: prod.jsx,
  jsxs: prod.jsxs,
};
