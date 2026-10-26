// Menampilkan teks biasa (visi, dsb.) dengan format sederhana — tanpa HTML, jadi aman:
// - baris kosong memisahkan paragraf, enter tunggal tetap jadi baris baru
// - baris diawali "-", "•", atau "*" menjadi daftar poin
// - baris diawali "1." atau "1)" menjadi daftar bernomor

const BULLET = /^\s*[-•*]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseRichText(text) {
  const blocks = [];
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length) blocks.push({ type: "p", lines: paragraph });
    paragraph = [];
  }

  for (const rawLine of String(text || "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const listType = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : null;
    if (listType) {
      flushParagraph();
      const item = line.replace(listType === "ul" ? BULLET : NUMBERED, "");
      const last = blocks[blocks.length - 1];
      if (last?.type === listType) last.items.push(item);
      else blocks.push({ type: listType, items: [item] });
      continue;
    }

    // Baris lanjutan langsung di bawah poin daftar ikut poin tersebut
    const last = blocks[blocks.length - 1];
    if (!paragraph.length && (last?.type === "ul" || last?.type === "ol") && /^\s{2,}/.test(rawLine)) {
      last.items[last.items.length - 1] += ` ${line.trim()}`;
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  return blocks;
}

/**
 * markerClassName: kelas untuk penanda nomor/poin (warna tema).
 * Jarak antar blok memakai em agar ikut ukuran huruf induk.
 */
export default function RichText({ text, className = "", markerClassName = "bg-violet-100 text-violet-700", empty = null }) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return empty;

  return (
    <div className={`space-y-[0.7em] ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          );
        }

        const Tag = block.type === "ol" ? "ol" : "ul";
        return (
          <Tag key={i} className="space-y-[0.4em]">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-[0.6em]">
                <span
                  aria-hidden="true"
                  className={`mt-[0.25em] flex h-[1.9em] min-w-[1.9em] shrink-0 items-center justify-center rounded-[0.45em] text-[0.7em] font-bold ${markerClassName}`}
                >
                  {block.type === "ol" ? j + 1 : "•"}
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
