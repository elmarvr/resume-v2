import { twMerge } from "tailwind-merge";
import { ui } from "./theme";

const H1 = styled(ui.text)`text-3xl`;
const H2 = styled(ui.text)`text-2xl`;
const H3 = styled(ui.text)`text-xl font-bold`;
const H4 = styled(ui.text)`text-lg font-bold leading-6`;
const P = styled(ui.text)``;
const A = styled(ui.link)`underline`;
const Ul = styled(ui.view)`gap-1`;

const Li = ({ children, ...props }: { children: React.ReactNode }) => (
  <ui.view {...props} className="pl-6 relative">
    <ui.text className="absolute left-2">-</ui.text>
    <ui.text>{children}</ui.text>
  </ui.view>
);

const components = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  a: A,
  ul: Ul,
  li: Li,
};

export { components, H1, H2, H3, H4, P, A };

function styled<TProps extends { className?: string }>(
  Component: React.ComponentType<TProps>
) {
  return (str: TemplateStringsArray) => {
    return ({ className, ...props }: TProps) => (
      <Component
        className={twMerge(str.join(" "), className)}
        {...(props as any)}
      />
    );
  };
}
