const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'piss',
  'cock', 'dick', 'pussy', 'cunt', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'fag', 'retard', 'idiot', 'moron', 'arse', 'bollocks',
  'wank', 'wanker', 'twat', 'prick', 'shag', 'bloody', 'bugger',
  'asshole', 'arsehole', 'motherfucker', 'fucker', 'bullshit', 'jackass',
  'dumbass', 'dipshit', 'horseshit', 'shithead', 'fuckhead', 'douchebag',
  'douche', 'jerkoff', 'jerk', 'asshat', 'screw', 'screwup',
];

export function containsBadWords(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/);
  return words.some(word => BAD_WORDS.includes(word));
}

export function getBadWords(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/);
  return words.filter(word => BAD_WORDS.includes(word));
}
