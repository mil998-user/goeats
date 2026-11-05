import { type CSSProperties, type ReactNode } from "react";

const emojiMap: Record<string, string> = {
  "✨": "✨",
  "⚠️": "⚠️",
  "📍": "📍",
  "🏪": "🏪",
  "🔍": "🔍",
  "🛎️": "🛎️",
  "🔔": "🔔",
  "🍽️": "🍽️",
  "🛵": "🛵",
  "🏍️": "🏍️",
  "🚲": "🚲",
  "🚗": "🚗",
  "🚚": "🚚",
  "🛍️": "🛍️",
  "🛒": "🛒",
  "🪑": "🪑",
  "🔑": "🔑",
  "🔥": "🔥",
  "🎉": "🎉",
  "⏳": "⏳",
  "🟡": "🟡",
  "🟢": "🟢",
  "🔴": "🔴",
  "💳": "💳",
  "🏦": "🏦",
  "🔁": "🔁",
  "🗺️": "🗺️",
  "💵": "💵",
  "💰": "💰",
  "⚡": "⚡",
  "🎁": "🎁",
  "🧾": "🧾",
  "🖨️": "🖨️",
  "🧪": "🧪",
  "🕐": "🕐",
  "🔒": "🔒",
  "🚨": "🚨",
  "🖥️": "🖥️",
  "🛡️": "🛡️",
  "🍔": "🍔",
  "🍳": "🍳",
  "🍜": "🍜",
  "🍝": "🍝",
  "🌮": "🌮",
  "🍹": "🍹",
  "🍰": "🍰",
  "🥗": "🥗",
  "🥬": "🥬",
  "🍗": "🍗",
  "📦": "📦",
  "🗑️": "🗑️",
  "🔧": "🔧",
  "💾": "💾",
  "💡": "💡",
  "📞": "📞",
  "🛍": "🛍",
  "⏱️": "⏱️",
  "🚀": "🚀",
  "✅": "✅",
  "❌": "❌",
  "👋": "👋",
  "👉": "👉",
  "🎫": "🎫",
  "★": "★",
};

const emojiStyle: CSSProperties = {
  display: "inline-block",
  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif',
  fontSize: "1.1em",
  lineHeight: 1,
  verticalAlign: "middle",
  marginRight: "0.25em",
};

const emojiPattern = /(?:\p{Extended_Pictographic}\uFE0F?|\p{Regional_Indicator}{2}|\d\uFE0F?\u20E3)/gu;

export function systemIconForEmoji(emoji: string): ReactNode {
  const renderedEmoji = emojiMap[emoji] ?? emoji;
  return (
    <span aria-hidden="true" style={emojiStyle}>
      {renderedEmoji}
    </span>
  );
}

export function systemTextWithIcons(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(emojiPattern)) {
    const emoji = match[0];
    const start = match.index ?? cursor;
    if (start > cursor) parts.push(text.slice(cursor, start));

    const renderedEmoji = emojiMap[emoji] ?? emoji;
    parts.push(
      <span key={`icon-${index++}`} aria-hidden="true" style={emojiStyle}>
        {renderedEmoji}
      </span>,
    );
    cursor = start + emoji.length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
