/**
 * Build-time OG image generator
 *
 * Uses satori + sharp to generate an OG image that mirrors
 * the site's editorial card aesthetic.
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

// Read env vars set by the project (same ones Astro uses)
const CLIENT_NAME = process.env.CLIENT_NAME?.trim() || ""
const CONTACT_EMAIL = process.env.CONTACT_EMAIL?.trim() || "official@devgo.studio"

const clientName = CLIENT_NAME || "Your Project"
const displayEmail = CONTACT_EMAIL

async function loadFont(name, weight) {
    const buffer = await fs.readFile(path.join(FONTS_DIR, name))
    return { name: "MonumentExtended", data: buffer, weight }
}

async function generate() {
    console.log("🎨 Generating OG image…")
    console.log(`   Client: ${clientName}`)

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
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#040906",
                    padding: "70px",
                    position: "relative",
                    overflow: "hidden",
                },
                children: [
                    // Ambient top-right glow
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                top: "-180px",
                                right: "-180px",
                                width: "600px",
                                height: "600px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(95,203,166,0.10) 0%, transparent 70%)",
                            },
                        },
                    },
                    // Ambient bottom-left glow
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                bottom: "-140px",
                                left: "-140px",
                                width: "480px",
                                height: "480px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle, rgba(47,101,83,0.14) 0%, transparent 70%)",
                            },
                        },
                    },
                    // Main card — simplified: no About/Contact sections
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "relative",
                                width: "100%",
                                maxWidth: "900px",
                                border: "1px solid rgba(95,203,166,0.14)",
                                backgroundColor: "rgba(4,9,6,0.50)",
                                display: "flex",
                                flexDirection: "column",
                                padding: "56px 64px",
                            },
                            children: [
                                // Client label
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginBottom: "16px",
                                        },
                                        children: [
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "50%",
                                                        backgroundColor: "rgba(95,203,166,0.45)",
                                                        flexShrink: 0,
                                                    },
                                                },
                                            },
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        fontFamily: "MonumentExtended",
                                                        fontSize: "11px",
                                                        fontWeight: 800,
                                                        color: "rgba(95,203,166,0.42)",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.28em",
                                                        lineHeight: 1,
                                                    },
                                                    children: "Client",
                                                },
                                            },
                                        ],
                                    },
                                },
                                // Client name
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            fontFamily: "MonumentExtended",
                                            fontSize: "58px",
                                            fontWeight: 800,
                                            color: "#f5f5f5",
                                            lineHeight: 0.92,
                                            letterSpacing: "-0.02em",
                                            textTransform: "uppercase",
                                        },
                                        children: clientName,
                                    },
                                },
                                // Divider line
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            marginTop: "36px",
                                            marginBottom: "36px",
                                            height: "1px",
                                            width: "100%",
                                            backgroundColor: "rgba(95,203,166,0.08)",
                                        },
                                    },
                                },
                                // Status row
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                        },
                                        children: [
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        width: "10px",
                                                        height: "10px",
                                                        borderRadius: "50%",
                                                        backgroundColor: "rgba(95,203,166,0.75)",
                                                        flexShrink: 0,
                                                    },
                                                },
                                            },
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        fontFamily: "MonumentExtended",
                                                        fontSize: "13px",
                                                        fontWeight: 800,
                                                        color: "rgba(95,203,166,0.38)",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.25em",
                                                    },
                                                    children: "Status",
                                                },
                                            },
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        width: "24px",
                                                        height: "1px",
                                                        backgroundColor: "rgba(95,203,166,0.18)",
                                                        flexShrink: 0,
                                                    },
                                                },
                                            },
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        fontFamily: "MonumentExtended",
                                                        fontSize: "18px",
                                                        fontWeight: 800,
                                                        color: "rgba(245,245,245,0.65)",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.02em",
                                                    },
                                                    children: "Under Development",
                                                },
                                            },
                                        ],
                                    },
                                },
                                // Bottom row: email + studio
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-end",
                                            marginTop: "48px",
                                        },
                                        children: [
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                                                        fontSize: "15px",
                                                        color: "rgba(95,203,166,0.60)",
                                                        lineHeight: 1.5,
                                                    },
                                                    children: displayEmail,
                                                },
                                            },
                                            {
                                                type: "div",
                                                props: {
                                                    style: {
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "flex-end",
                                                    },
                                                    children: [
                                                        {
                                                            type: "div",
                                                            props: {
                                                                style: {
                                                                    fontFamily: "MonumentExtended",
                                                                    fontSize: "28px",
                                                                    fontWeight: 800,
                                                                    color: "rgba(245,245,245,0.88)",
                                                                    lineHeight: 0.92,
                                                                    letterSpacing: "-0.02em",
                                                                    textTransform: "uppercase",
                                                                },
                                                                children: "DEVGO",
                                                            },
                                                        },
                                                        {
                                                            type: "div",
                                                            props: {
                                                                style: {
                                                                    fontFamily: "MonumentExtended",
                                                                    fontSize: "28px",
                                                                    fontWeight: 800,
                                                                    color: "rgba(245,245,245,0.88)",
                                                                    lineHeight: 0.92,
                                                                    letterSpacing: "-0.02em",
                                                                    textTransform: "uppercase",
                                                                    marginTop: "2px",
                                                                },
                                                                children: "STUDIO",
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
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
