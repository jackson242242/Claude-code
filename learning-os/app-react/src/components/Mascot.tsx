import { mascotSVG } from "../lib/mascot";

export function Mascot({ stage, prog = 0, size = 190, bounce = false }: {
  stage: number; prog?: number; size?: number; bounce?: boolean;
}) {
  return (
    <span
      className={bounce ? "bounce" : undefined}
      style={{ display: "inline-block", width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: mascotSVG(stage, prog) }}
    />
  );
}
