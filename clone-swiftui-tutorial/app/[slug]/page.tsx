import { slugify } from "@/lib/utils"
import { Nav } from "@/components/nav"
import { Code } from "@/components/code"
import { Preview } from "@/components/preview"
import { Quiz } from "@/components/quiz"
import { ArrowDownCircle, Hammer } from "lucide-react"
import { parseRoot } from "codehike/blocks"
import { Selectable, Selection, SelectionProvider } from "codehike/utils"
import { RawCode } from "codehike/code"
import { z } from "zod"
import { Block, CodeBlock, ImageBlock } from "codehike/blocks"
import { Metadata } from "next"
import { Asset, AssetProvider } from "./context"

const HeroBlock = Block.extend({
  time: z.string(),
  files: z.string(),
  xcode: z.string(),
  image: ImageBlock,
})

const SectionBlock = Block.extend({
  intro: Block.extend({ cover: ImageBlock }),
  Step: z.array(
    Block.extend({
      code: z.optional(CodeBlock),
      screenshot: z.optional(ImageBlock),
      preview: z.optional(ImageBlock),
    }),
  ),
})

export type HeroData = z.infer<typeof HeroBlock>
export type SectionData = z.infer<typeof SectionBlock>

export const Schema = Block.extend({
  hero: HeroBlock,
  sections: z.array(SectionBlock),
  quiz: Block.extend({
    questions: z.array(
      Block.extend({
        answers: z.array(
          Block.extend({
            hint: z.optional(z.string()),
          }),
        ),
      }),
    ),
  }),
})

type TutorialContent = z.infer<typeof Schema>

export function generateStaticParams() {
  return [
    { slug: "creating-and-combining-views" },
    { slug: "building-lists-and-navigation" },
  ]
}

export default async function TutorialPage({
  params,
}: {
  params: { slug: string }
}) {
  const { default: Content } = await import(
    `@/content/${params.slug}/tutorial.md`
  )
  const tutorial = parseRoot(Content, Schema, {
    components: { Step },
  })

  const sectionNames = [
    "Introduction",
    ...tutorial.sections.map(({ title }) => title || ""),
    "Check your understanding",
  ]

  return (
    <>
      <Nav tutorial={params.slug} sections={sectionNames} />
      <Tutorial tutorial={tutorial} params={params} />
    </>
  )
}

function Tutorial({
  tutorial,
  params,
}: {
  tutorial: TutorialContent
  params: { slug: string }
}) {
  const { hero, sections, quiz } = tutorial
  return (
    <main className="overflow-x-clip bg-white pb-12">
      <Hero hero={hero} slug={params.slug} />
      {sections.map((section, i) => (
        <Section key={i} section={section} slug={params.slug} number={i + 1} />
      ))}
      <Quiz quiz={quiz} />
    </main>
  )
}

async function Hero({ hero, slug }: { hero: HeroData; slug: string }) {
  const img = await loadImage(slug, hero.image)
  return (
    <header
      className="py-20 bg-black relative px-8"
      id={slugify("Introduction")}
    >
      <div
        className="absolute inset-0 bg-top bg-no-repeat bg-cover opacity-30"
        style={{ backgroundImage: `url(${img?.src})` }}
      />
      <div className="relative max-w-3xl xl:max-w-4xl mx-auto prose prose-invert">
        <h3>SwiftUI essentials</h3>
        <h1>{hero.title}</h1>
        <div className="max-w-lg">{hero.children}</div>
        <div className="flex mt-10">
          <div className="w-40 pr-8 flex flex-col items-center">
            <div className="text-4xl font-semibold mb-2">{hero.time}</div>
            <div className="text-sm">Estimated Time</div>
          </div>
          <div className="border-x border-zinc-200 w-36 flex flex-col items-center">
            <ArrowDownCircle size={44} strokeWidth={1.2} />
            <a href={hero.files} className="text-sm mt-1 no-underline">
              Project files
            </a>
          </div>
          <div className="w-48 flex flex-col items-center">
            <Hammer size={44} strokeWidth={1.2} />
            <a href={hero.xcode} className="text-sm mt-1 no-underline">
              Xcode 15 or later
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

async function SectionHeader({
  slug,
  section,
  number,
}: {
  slug: string
  section: SectionData
  number: number
}) {
  const { intro, title = "", children } = section

  const coverImg = await loadImage(slug, intro.cover)
  return (
    <header className="md:mb-20 flex flex-col md:flex-row px-8 md:px-0">
      <div className="md:w-1/2 prose pr-7">
        <h3>Section {number}</h3>
        <h2>{title}</h2>
        {intro.children}
      </div>
      <div className="md:w-1/2 md:pl-7 flex items-center py-8 md:py-0">
        <img
          src={coverImg?.src}
          alt={coverImg?.alt}
          width={450}
          height="auto"
          className="mx-auto px-5 block"
        />
      </div>
    </header>
  )
}

async function Section({
  slug,
  section,
  number,
}: {
  slug: string
  section: SectionData
  number: number
}) {
  const { Step: blocks, title = "", children } = section

  const assets = blocks.map((step) => (
    <Sticker
      slug={slug}
      codeblock={step.code}
      screenshot={step.screenshot}
      preview={step.preview}
    />
  ))

  return (
    <section
      className="max-w-3xl xl:max-w-4xl mx-auto pt-20"
      id={slugify(title)}
    >
      <SectionHeader slug={slug} section={section} number={number} />
      <SelectionProvider className="md:flex relative hidden">
        <div className="flex-none mt-32 mb-[94vh] mr-[4.167%] w-[37.5%] [&>p]:px-7 [&>p]:mb-8 [&>p]:prose [&>p]:text-sm">
          {children}
        </div>
        <div className="w-[calc(50vw+8.333%)] bg-zinc-50 flex-none ">
          <div className="top-12 sticky h-[calc(100vh-3rem)]">
            <Selection from={assets} />
          </div>
        </div>
      </SelectionProvider>
      <div className="flex-none md:hidden mt-32 [&>p]:px-7 [&>p]:mb-8 [&>p]:prose [&>p]:text-sm">
        <AssetProvider assets={assets}>{children}</AssetProvider>
      </div>
    </section>
  )
}

function Step({
  children,
  title,
  index,
}: {
  children: React.ReactNode
  title: string
  index: number
}) {
  // how to get slug here
  return (
    <>
      <Selectable
        index={index}
        selectOn={["click", "scroll"]}
        className="border-l-8 border-blue-400 md:data-[selected=false]:border-transparent px-5 py-4 md:mb-24 rounded-lg bg-zinc-50 transition-colors mx-3 md:mx-0"
      >
        <h4 className="mb-2 text-sm font-semibold">{title}</h4>
        <div className="prose prose-hr:my-4 text-sm">{children}</div>
      </Selectable>
      <div className="md:hidden mb-20 mt-5">
        <Asset i={index} />
      </div>
    </>
  )
}

type Image = {
  url: string
  alt: string
}
async function Sticker({
  slug,
  codeblock,
  screenshot,
  preview,
}: {
  codeblock?: RawCode
  screenshot?: Image
  slug: string
  preview?: Image
}) {
  const screenshotImg = await loadImage(slug, screenshot)
  const previewImg = await loadImage(slug, preview)

  return codeblock ? (
    <div>
      <Code codeblock={codeblock} />
      <Preview preview={previewImg} />
    </div>
  ) : (
    <div className="md:h-full flex items-center md:w-2/3 justify-center md:justify-normal">
      <img
        src={screenshotImg?.src}
        alt={screenshotImg?.alt}
        width={450}
        height="auto"
        className="md:ml-10 px-5 block md:max-w-[364px] xl:max-w-[531px] md:max-h-[calc(100vh-3rem-80px)]"
      />
    </div>
  )
}

async function loadImage(slug: string, img?: { url: string; alt: string }) {
  if (!img) return null
  const {
    default: { src, height, width },
  } = await import(`@/content/${slug}/assets/${img.url}`)
  return {
    src,
    height,
    width,
    alt: img.alt,
  }
}

export async function generateMetadata(props: {
  params: { slug: string }
}): Promise<Metadata> {
  const { params } = props
  const { default: Content } = await import(
    `@/content/${params.slug}/tutorial.md`
  )
  const { hero } = parseRoot(Content, Schema, { components: { Step } })
  return {
    title: `${hero.title} — CloneUI Tutorials | Code Hike Examples`,
  }
}
