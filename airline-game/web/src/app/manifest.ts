import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "SkyEmpire 蓝天霸业",
  short_name: "SkyEmpire",
  description: "回合制航空公司经营游戏——开航线、抢时刻、斗 AI，称霸蓝天",
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#060b1a",
  theme_color: "#060b1a",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
  ],
});

export default manifest;
