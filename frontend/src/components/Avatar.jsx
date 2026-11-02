import { avatarColor } from "../lib/format";

export default function Av({ init = "?", size = "av-md" }) {
  const bg = `linear-gradient(135deg,${avatarColor(init)},${avatarColor(init + "X")})`;
  return <div className={`av ${size}`} style={{ background: bg }}>{init}</div>;
}
