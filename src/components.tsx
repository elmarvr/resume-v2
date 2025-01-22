import { Text, View } from "@react-pdf/renderer";
import { twMerge } from "tailwind-merge";
import { tw } from "./theme";

export const components = {
  h1: (props: UiTextProps) => <ui.text className="text-4xl" {...props} />,
  h2: (props: UiTextProps) => <ui.text className="text-3xl" {...props} />,
  p: (props: UiTextProps) => <ui.text {...props} />,
};

type UiTextProps = React.ComponentProps<typeof ui.text>;
type UiViewProps = React.ComponentProps<typeof ui.view>;

const primitives = {
  text: Text,
  view: View,
};

const ui = new Proxy(primitives, {
  get(target, key) {
    if (!(key in target)) {
      throw new Error(`Unknown UI component: ${String(key)}`);
    }

    return ({ className, ...props }: any) => {
      const Component = target[key as keyof typeof target];

      return (
        <Component
          {...props}
          style={tw(twMerge("text-base text-zinc-900", className))}
        />
      );
    };
  },
}) as {
  [K in keyof typeof primitives]: React.ComponentType<
    Omit<React.ComponentProps<(typeof primitives)[K]>, "style"> & {
      className?: string;
    }
  >;
};
