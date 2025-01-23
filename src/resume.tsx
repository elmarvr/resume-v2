import { Document, Page, renderToStream } from "@react-pdf/renderer";
import * as v from "valibot";
import { createIconComponent } from "./lib/svg";
import { ui } from "./theme";

import en from "./lang/en.json";
import nl from "./lang/nl.json";
import {
  FormattedDate,
  FormattedDisplayName,
  FormattedMessage,
  FormattedPlural,
  IntlProvider,
  useIntl,
} from "react-intl";
import { A, H3, H4, P } from "./components";
import { queryContent } from "./lib/content";
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "Inconsolata",
  fonts: [
    {
      src: "http://fonts.gstatic.com/s/inconsolata/v15/BjAYBlHtW3CJxDcjzrnZCJ0EAVxt0G0biEntp43Qt6E.ttf",
    },
    {
      src: "http://fonts.gstatic.com/s/inconsolata/v15/AIed271kqQlcIRSOnQH0yXe1Pd76Vl7zRpE7NLJQ7XU.ttf",
      fontWeight: "bold",
    },
  ],
});

const messages = {
  en: en,
  nl: nl,
};

export async function renderResumeStream(ctx?: {
  locale?: keyof typeof messages;
}): Promise<ReadableStream> {
  const { locale = "nl" } = ctx ?? {};

  const intro = await queryContent(`${locale}/intro.md`).first();

  const libraries = await queryContent("libraries.json", {
    schema: v.array(
      v.object({
        name: v.string(),
        title: v.string(),
        icon: v.string(),
        color: v.optional(v.string()),
      })
    ),
    transform: (data) => {
      return Promise.all(
        data.map(async ({ icon, name, color, ...value }) => {
          const Icon = await createIconComponent(icon);

          return {
            name,
            icon: <Icon size={1} color={color} />,
            ...value,
          };
        })
      );
    },
  }).first();

  const experience = await queryContent(`${locale}/experience/*.md`, {
    schema: v.object({
      title: v.string(),
      company: v.optional(v.string()),
      date: v.tuple([v.date(), v.date()]),
      libs: v.optional(v.array(v.string()), []),
    }),
    transform: async (data) => {
      return {
        meta: {
          ...data.meta,
          libs: await Promise.all(
            data.meta.libs.map(async (name) => {
              const skill = libraries.find((s) => s.name === name);

              if (!skill) {
                throw new Error(`No skill found: ${name}`);
              }

              return skill;
            })
          ),
        },
        content: data.content,
      };
    },
  }).all();

  const education = await queryContent(`${locale}/education/*.md`, {
    schema: v.object({
      title: v.string(),
      institution: v.string(),
      date: v.tuple([v.date(), v.date()]),
    }),
  }).all();

  const courses = await queryContent("courses.json", {
    schema: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
  }).first();

  const IconCircle = await createIconComponent("circle");

  const skills = await queryContent(`${locale}/skills.json`, {
    schema: v.array(v.string()),
  }).first();

  const DividerIcon = await createIconComponent("git-commit-horizontal");

  return renderToStream(
    <IntlProvider
      messages={messages[locale]}
      locale={locale}
      defaultLocale="en"
    >
      <Document>
        <Page>
          <ui.view className="p-6 gap-8">
            <ui.view>
              <H3>
                <FormattedMessage id="introduction.title" />
              </H3>
              {intro.content}
            </ui.view>

            <ui.view>
              <H3>
                <FormattedMessage id="experience.title" />
              </H3>

              <ui.view className="gap-6">
                {experience.map((exp) => {
                  const { years, months } = yearsAndMonthsBetween(
                    exp.meta.date[0],
                    exp.meta.date[1]
                  );

                  return (
                    <ui.view key={exp.meta.title}>
                      <H4>{exp.meta.title}</H4>
                      <P>{exp.meta.company}</P>
                      <P className="pb-4">
                        <FormattedDate
                          value={exp.meta.date[0]}
                          month="short"
                          year="numeric"
                        />{" "}
                        -{" "}
                        <FormattedDate
                          value={exp.meta.date[1]}
                          month="short"
                          year="numeric"
                        />{" "}
                        (
                        {years > 0 && (
                          <>
                            <FormattedDateTimeField value={years} of="years" />,{" "}
                          </>
                        )}
                        <FormattedDateTimeField value={months} of="months" />)
                      </P>

                      {exp.content}
                      <ui.view className="flex-row">
                        {exp.meta.libs.map((lib) => (
                          <ui.view
                            key={lib.name}
                            className="flex-row items-center gap-2"
                          >
                            {lib.icon}
                            <ui.text>{lib.title}</ui.text>
                          </ui.view>
                        ))}
                      </ui.view>
                    </ui.view>
                  );
                })}
              </ui.view>
            </ui.view>

            <ui.view>
              <H3>
                <FormattedMessage id="education.title" />
              </H3>
              <ui.view className="gap-6">
                {education.map((ed) => (
                  <ui.view key={ed.meta.title} className="gap-4">
                    <ui.view>
                      <H4>
                        {ed.meta.title} - {ed.meta.institution}
                      </H4>
                      <P>
                        ({ed.meta.date[0].getFullYear()} -{" "}
                        {ed.meta.date[1].getFullYear()})
                      </P>
                    </ui.view>
                    {ed.content}
                  </ui.view>
                ))}
              </ui.view>
            </ui.view>

            <ui.view>
              <H3>
                <FormattedMessage id="courses.title" />
              </H3>
              <ui.view className="gap-2">
                {courses.map((course) => (
                  <ui.view
                    className="flex-row items-center gap-2"
                    key={course.title}
                  >
                    <ui.view className="relative -top-0.5">
                      <IconCircle size={2} color="blue-700" strokeWidth={1} />
                    </ui.view>
                    <A href={course.url} className="text-blue-700">
                      {course.title}
                    </A>
                  </ui.view>
                ))}
              </ui.view>
            </ui.view>

            <ui.view>
              <H3>
                <FormattedMessage id="skills.title" />
              </H3>
              <ui.view className="flex-row flex-wrap gap-2">
                {skills.map((skill, index) => {
                  return (
                    <ui.view
                      className="flex-row items-center gap-2"
                      key={skill}
                    >
                      {index > 0 && (
                        <ui.view className="relative -top-0.5">
                          <DividerIcon size={5} strokeWidth={1} />
                        </ui.view>
                      )}
                      <ui.text key={skill}>{skill}</ui.text>
                    </ui.view>
                  );
                })}
              </ui.view>
            </ui.view>
          </ui.view>
        </Page>
      </Document>
    </IntlProvider>
  ) as never;
}

function FormattedDateTimeField({
  value,
  of,
}: {
  value: number;
  of: "months" | "years";
}) {
  const intl = useIntl();
  const label = intl.formatRelativeTime(value, of);

  return <>{label.split(" ").slice(1).join(" ")}</>;
}

function yearsAndMonthsBetween(
  d1: Date,
  d2: Date
): {
  years: number;
  months: number;
} {
  const aMonths = d1.getMonth() + d1.getFullYear() * 12;
  const bMonths = d2.getMonth() + d2.getFullYear() * 12;

  const months = bMonths - aMonths;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return {
    years,
    months: remainingMonths,
  };
}
