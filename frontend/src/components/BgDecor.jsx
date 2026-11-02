

export default function BgDecor() {
  return (
    <div className="bg-wrap">
      <div className="bg-dots" />
      <div className="bg-shape bg-s1" />
      <div className="bg-shape bg-s2" />
      <div className="bg-shape bg-s3" />
      <div className="deco-book" style={{ top: "8%", left: "3%", transform: "rotate(-12deg)" }}>📚</div>
      <div className="deco-book" style={{ bottom: "10%", right: "2%", transform: "rotate(8deg)", fontSize: 60 }}>🎓</div>
      <div className="deco-book" style={{ top: "50%", left: "1%", transform: "rotate(5deg)", fontSize: 50 }}>✏️</div>
      <div className="deco-book" style={{ top: "15%", right: "3%", transform: "rotate(-8deg)", fontSize: 55 }}>📖</div>
    </div>
  );
}
