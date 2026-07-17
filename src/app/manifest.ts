import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "همبافت — زندگی هم‌مسیر",
    short_name: "همبافت",
    description: "ردیاب اهداف، عادت‌ها و پارتنر هم‌مسیر با گیمیفیکیشن فارسی",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F6EE",
    theme_color: "#F9F6EE",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/brand/hambaft-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
