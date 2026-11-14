export default function Board({ board, onPlay, disabled = false, winLine = [], ghost = null }) {
  return (
    <div className="board">
      {board.map((v, i) => {
        const can = !disabled && !v;
        const cls = `cell${can ? ' can' : ''}${winLine?.includes(i) ? ' win' : ''}`;
        return (
          <button
            key={i}
            className={cls}
            disabled={!can}
            onClick={() => onPlay(i)}
            aria-label={`Cell ${i + 1}${v ? `, ${v}` : ''}`}
          >
            {v ? (
              <span className={`piece ${v} outline`}>{v}</span>
            ) : can && ghost ? (
              <span className={`piece ${ghost} ghost outline`}>{ghost}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
