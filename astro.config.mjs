// @ts-check
import { defineConfig, fontProviders, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: process.env.SITE_URL || "https://devgo.studio",

    env: {
        schema: {
            SITE_URL: envField.string({
                context: "server",
                access: "public",
                default: "https://devgo.studio",
            }),
            CLIENT_NAME: envField.string({
                context: "server",
                access: "public",
                default: "",
            }),
            CONTACT_EMAIL: envField.string({
                context: "server",
                access: "public",
                default: "official@devgo.studio",
            }),
            CONTACT_PHONE: envField.string({
                context: "server",
                access: "public",
                optional: true,
            }),
        },
    },

    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [sitemap()],

    fonts: [
        {
            provider: fontProviders.local(),
            name: "MonumentExtended",
            cssVariable: "--font-monument-extended",
            options: {
                variants: [
                    {
                        src: [
                            "./src/assets/fonts/MonumentExtended-Regular.otf",
                        ],
                        weight: "400",
                        style: "normal",
                    },
                    {
                        src: [
                            "./src/assets/fonts/MonumentExtended-Ultrabold.otf",
                        ],
                        weight: "800",
                        style: "normal",
                    },
                ],
            },
        },
    ],
});
