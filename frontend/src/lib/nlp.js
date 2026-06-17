const phraseCorrections = {
  HI: "Hello.",
  HELLO: "Hello.",
  "HOW ARE YOU": "How are you?",
  "HOW ARE YOU DOING": "How are you?",
  "THANK YOU": "Thank you.",
  THANKYOU: "Thank you.",
  THANKS: "Thank you.",
  "GOOD BYE": "Goodbye.",
  GOODBYE: "Goodbye.",
  BYE: "Goodbye.",
  WELCOME: "Welcome.",
  SORRY: "Sorry.",
  PLEASE: "Please.",
  HELP: "Help.",
  "I NEED HELP": "Help.",
  "PLEASE HELP": "Help.",
  STOP: "Stop.",
  YES: "Yes.",
  NO: "No.",
};

export function normalizeSentence(text) {
  const cleaned = text.trim().replace(/\s+/g, " ").toUpperCase();

  if (!cleaned) return "";

  if (phraseCorrections[cleaned]) {
    return phraseCorrections[cleaned];
  }

  const lowerText = cleaned.toLowerCase();

  return lowerText.charAt(0).toUpperCase() + lowerText.slice(1) + ".";
}