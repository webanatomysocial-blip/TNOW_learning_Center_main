const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "how", "what", "when", "where", "why", "do", "does",
  "did", "can", "could", "would", "should", "to", "of", "in", "on", "for", "with",
  "and", "or", "it", "its", "you", "your", "we", "our", "i", "this", "that", "be",
  "have", "has", "there", "any", "about", "will", "was", "were",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// "integrate" vs "integration", "provision" vs "provisioning" — different
// suffixes, same root. Rather than chase every English suffix rule, treat two
// words as the same if one is a long-enough prefix of the other.
const MIN_PREFIX = 4;
function wordsMatch(a, b) {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  return shorter.length >= MIN_PREFIX && longer.startsWith(shorter);
}

function countMatches(queryWords, itemWords) {
  let count = 0;
  for (const qw of queryWords) {
    if (itemWords.some((iw) => wordsMatch(qw, iw))) count++;
  }
  return count;
}

function scoreQaMatches(qa, query) {
  const queryWords = tokenize(query);
  if (!queryWords.length) return [];

  const scored = [];
  for (const item of qa) {
    const itemWords = tokenize(item.question);
    if (!itemWords.length) continue;
    const matches = countMatches(queryWords, itemWords);
    if (!matches) continue;
    // precision: how much of what the visitor typed was matched (used to
    // surface suggestions — even a single word like "security" should list
    // every question touching it). recall: how much of the candidate
    // question that covers (used to require an auto-answer be a real,
    // specific match, not just "contains one of the words typed").
    const precision = matches / queryWords.length;
    const recall = matches / itemWords.length;
    scored.push({ item, precision, recall });
  }
  return scored.sort((a, b) => b.precision - a.precision || b.recall - a.recall);
}

// Free-typed questions rarely match a suggested question's exact wording, so a
// straight string-equality check (the old behavior) only ever fires when the
// visitor clicks a suggestion — anything typed by hand always fell through to
// the generic "I've flagged it for your workshop" filler. This scores every QA
// entry by shared keywords (fuzzy on word roots) instead, so close-enough
// phrasing still finds the right answer. Requiring both precision AND recall
// to clear the bar is deliberate — a single word like "security" matches
// plenty of questions by precision alone, but shouldn't confidently commit to
// any one of them; that case should fall through to rankQaMatches instead.
export function findBestQaMatch(qa, query) {
  const [top] = scoreQaMatches(qa, query);
  return top && top.precision >= 0.55 && top.recall >= 0.4 ? top.item : null;
}

// Live "as you type" suggestions and "did you mean" candidates — surfaces
// anything sharing at least half the typed words, ranked by how much of the
// query each candidate covers. Looser than findBestQaMatch on purpose: these
// are clickable hints for the visitor to choose from, not an auto-answer.
export function rankQaMatches(qa, query, limit = 5) {
  return scoreQaMatches(qa, query)
    .filter((s) => s.precision >= 0.5)
    .slice(0, limit)
    .map((s) => s.item);
}
