import { Link, Text, View } from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import { twMerge } from "tailwind-merge";

export const tw = createTw({
  theme: {
    extend: {
      fontFamily: {
        mono: ["Inconsolata", "monospace"],
      },
    },
  },
});

const primitives = {
  text: Text,
  view: View,
  link: Link,
};

const baseStyles = {
  link: "text-base text-zinc-900 font-mono",
  text: "text-base text-zinc-900 font-mono",
  view: "",
};

export const ui = new Proxy(primitives, {
  get(target, key) {
    if (!(key in target)) {
      throw new Error(`Unknown UI component: ${String(key)}`);
    }

    return ({ className, ...props }: any) => {
      const name = key as keyof typeof target;
      const Component = target[name];

      return (
        <Component
          {...props}
          style={tw(twMerge(baseStyles[name], className))}
        />
      );
    };
  },
}) as {
  [K in keyof typeof primitives]: React.ComponentType<
    React.ComponentProps<(typeof primitives)[K]> & { className?: string }
  >;
};

export type UIProps<K extends keyof typeof ui> = React.ComponentProps<
  (typeof ui)[K]
>;
