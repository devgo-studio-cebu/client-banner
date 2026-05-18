/**
 * Build-time OG image generator
 *
 * Uses satori (HTML-to-SVG) + sharp (SVG-to-PNG) to generate
 * the default Open Graph image for the client-banner site.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import satori from "satori"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const PUBLIC_DIR = path.resolve(ROOT, "public")
const FONTS_DIR = path.resolve(ROOT, "src/assets/fonts")

const WIDTH = 1200
const HEIGHT = 630

async function loadFont(name, weight) {
    const buffer = await fs.readFile(path.join(FONTS_DIR, name))
    return { name: "MonumentExtended", data: buffer, weight }
}

async function generate() {
    console.log("🎨 Generating OG image…")

    const [regular, ultrabold] = await Promise.all([
        loadFont("MonumentExtended-Regular.otf", 400),
        loadFont("MonumentExtended-Ultrabold.otf", 800),
    ])

    const svg = await satori(
        {
            type: "div",
            props: {
                style: {
                    width: WIDTH,
                    height: HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#040906",
                    padding: "80px",
                    position: "relative",
                    overflow: "hidden",
                },
                children: [
                    // Decorative gradient accent top-right
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                top: "-120px",
                                right: "-120px",
                                width: "400px",
                                height: "400px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(95,203,166,0.15) 0%, transparent 70%)",
                            },
                        },
                    },
                    // Decorative gradient accent bottom-left
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                bottom: "-80px",
                                left: "-80px",
                                width: "300px",
                                height: "300px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(47,101,83,0.2) 0%, transparent 70%)",
                            },
                        },
                    },
                    // Brand mark using inline SVG (single path)
                    {
                        type: "div",
                        props: {
                            style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "32px",
                                width: "64px",
                                height: "84px",
                            },
                            children: [
                                {
                                    type: "svg",
                                    props: {
                                        width: 64,
                                        height: 84,
                                        viewBox: "0 0 710.94 953.47",
                                        style: {
                                            display: "flex",
                                        },
                                        children: [
                                            {
                                                type: "path",
                                                props: {
                                                    fill: "#5fcba6",
                                                    d: "M418.13,406.68c-56.08-26.68-159.25-75.75-190.92-90.81-5.87-2.79-9.27-7.84-8.89-13.21.74-10.64,2.04-29.15,3.12-44.6.44-6.32,9.27-9.93,16.14-6.62,85.98,40.7,171.96,81.41,257.94,122.11-25.8,11.04-51.59,22.09-77.39,33.13Z",
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    // Main heading
                    {
                        type: "div",
                        props: {
                            style: {
                                fontSize: "72px",
                                fontWeight: 800,
                                letterSpacing: "-0.02em",
                                textAlign: "center",
                                lineHeight: 1.1,
                                color: "#5fcba6",
                                display: "flex",
                            },
                            children: "Under Development",
                        },
                    },
                    // Subtitle
                    {
                        type: "div",
                        props: {
                            style: {
                                fontSize: "24px",
                                fontWeight: 400,
                                color: "#757575",
                                marginTop: "20px",
                                textAlign: "center",
                                display: "flex",
                            },
                            children:
                                "A new site is being built — contact us to learn more",
                        },
                    },
                    // Bottom bar
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                bottom: "40px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                fontWeight: 400,
                                color: "#5fcba6",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                            },
                            children: "DEVGO Studio — devgo.studio",
                        },
                    },
                ],
            },
        },
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [regular, ultrabold],
        }
    )

    const png = await sharp(Buffer.from(svg)).png().toBuffer()

    await fs.writeFile(path.join(PUBLIC_DIR, "og-image.png"), png)

    console.log("✅ OG image generated: public/og-image.png")
}

generate().catch((err) => {
    console.error("❌ Failed to generate OG image:", err)
    process.exit(1)
})
