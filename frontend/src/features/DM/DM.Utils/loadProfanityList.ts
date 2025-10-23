export async function loadProfanityList(): Promise<string[]> {
  const response = await fetch('./public/moderation/profanity-list.txt');
  const text = await response.text();
  return text.split('\n').map(w => w.trim()).filter(Boolean);
}