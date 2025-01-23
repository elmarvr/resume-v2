import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
import { unified } from "unified";
import * as prod from "react/jsx-runtime";
import {
  Svg,
  Path,
  G,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polyline,
  Polygon,
  Tspan,
  LinearGradient,
  RadialGradient,
  Text,
  type PathProps,
  type CircleProps,
  type RectProps,
} from "@react-pdf/renderer";
import { icons } from "@iconify-json/lucide";
import { createContext, useContext } from "react";
import { tw } from "../theme";

const ICON_SIZE = 24;

export async function createIconComponent(name: string) {
  const icon = icons.icons[name];

  const { result } = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeReact, {
      ...production,
      components,
    })
    .process(icon.body);

  return ({
    color = "neutral-900",
    size = ICON_SIZE / 4,
    strokeWidth = 4,
  }: {
    color?: string;
    size?: number;
    strokeWidth?: number;
  }) => {
    const style = tw(`text-${color} h-${size} w-${size}`);

    return (
      <SVGContext.Provider
        value={{ color: style.color, strokeWidth: strokeWidth }}
      >
        <Svg
          width={style.width}
          height={style.height}
          viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
        >
          {result}
        </Svg>
      </SVGContext.Provider>
    );
  };
}

const production = {
  Fragment: prod.Fragment,
  jsx: prod.jsx,
  jsxs: prod.jsxs,
};

const SVGContext = createContext<{ color?: string; strokeWidth?: number }>({});

const components = {
  path: ({ stroke, ...props }: PathProps) => {
    const { color, strokeWidth } = useContext(SVGContext);

    return (
      <Path
        {...camelKeys(props)}
        stroke={color ?? stroke}
        strokeWidth={strokeWidth}
      />
    );
  },
  g: G,
  rect: ({ stroke, ...props }: RectProps) => {
    const { color, strokeWidth } = useContext(SVGContext);

    return (
      <Rect
        {...camelKeys(props)}
        stroke={color ?? stroke}
        strokeWidth={strokeWidth}
      />
    );
  },
  circle: ({ stroke, ...props }: CircleProps) => {
    const { color, strokeWidth } = useContext(SVGContext);

    return (
      <Circle
        {...camelKeys(props)}
        stroke={color ?? stroke}
        strokeWidth={strokeWidth}
      />
    );
  },
  ellipse: Ellipse,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  text: Text,
  tspan: Tspan,
  lineargradient: LinearGradient,
  radialgradient: RadialGradient,
};

function camelKeys(target: Record<string, any>) {
  const result: any = {};

  for (const key in target) {
    const name = key.replace(/-([a-z])/g, (_, match) => match.toUpperCase());
    result[name] = target[key];
  }

  return result;
}
