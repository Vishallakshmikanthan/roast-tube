export type BattleResult = {
  verdict_title: string;
  duo_roast: string;
  winner_line: string;
  shared_sin: string;
  comparison: { scoreA: number; scoreB: number; compatibility: number };
};

export const sampleBattle: BattleResult = {
  verdict_title: "Same Wi-Fi. Different problems.",
  duo_roast:
    "One of you saves tutorials for tomorrow. The other watches productivity videos to avoid being productive. Together, you could almost finish a single task.",
  winner_line: "Player B wins this sample round. Less cooked is still cooked.",
  shared_sin: "An impressive commitment to taking one more scroll break.",
  comparison: { scoreA: 78, scoreB: 64, compatibility: 72 },
};

export function BattleOutcome({
  result,
  sample,
}: {
  result: BattleResult;
  sample: boolean;
}) {
  return (
    <article className="comic-card p-6 mt-7 bg-[#18130f] text-[#fff8e8]">
      <p className="mono text-xs text-[#f6ce47]">
        {sample ? "SAMPLE BATTLE / ILLUSTRATIVE DATA" : "LIVE BATTLE RESULT"}
      </p>
      <h2 className="display text-5xl mt-3">{result.verdict_title}</h2>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-3 my-6">
        {[
          ["A", result.comparison.scoreA, "/images/pixel-cat-cutout.webp"],
          ["B", result.comparison.scoreB, "/images/judging-cat.webp"],
        ].map(([name, score, image], index) => (
          <div
            key={String(name)}
            className="contents"
          >
            {index === 1 && (
              <strong className="display text-4xl text-[#f22968]">VS</strong>
            )}
            <div className="border-2 border-[#f5edda] p-3">
              <img
                src={String(image)}
                alt=""
                className="h-28 object-contain mx-auto"
              />
              <p className="mono text-xs mt-2">PLAYER {name}</p>
              <p className="display text-5xl text-[#f22968]">
                {score}
                <span className="text-2xl text-[#fff8e8]">/100</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-bold text-[#f6ce47]">{result.winner_line}</p>
      <p className="mt-3">{result.duo_roast}</p>
      <p className="mt-3 text-sm">{result.shared_sin}</p>
      <p className="mono mt-5 text-xs">
        ALGORITHMIC COMPATIBILITY / {result.comparison.compatibility}%
      </p>
    </article>
  );
}
