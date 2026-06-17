/** Maps spoken words/phrases to sign video paths under /public/signs/Words */
export const SIGN_VIDEOS = {
  hello: "/signs/Words/hello.mp4",
  hi: "/signs/Words/hello.mp4",
  yes: "/signs/Words/yes.mp4",
  no: "/signs/Words/no.mp4",
  stop: "/signs/Words/Stop.mp4",
  please: "/signs/Words/please.mp4",
  sorry: "/signs/Words/sorry.mp4",
  help: "/signs/Words/help.mp4",
  welcome: "/signs/Words/Welcome.mp4",
  thankyou: "/signs/Words/Thankyou.mp4",
  goodbye: "/signs/Words/good_bye.mp4",
  howareyou: "/signs/Words/how_are_you.mp4",
};

/** Multi-word phrases checked before single tokens (longest first). */
export const SIGN_PHRASES = [
  { phrase: "how are you", key: "howareyou" },
  { phrase: "thank you", key: "thankyou" },
  { phrase: "good bye", key: "goodbye" },
  { phrase: "goodbye", key: "goodbye" },
  { phrase: "i need help", key: "help" },
  { phrase: "please help", key: "help" },
];

export const SUPPORTED_SIGN_WORDS = [
  "hello",
  "yes",
  "no",
  "stop",
  "please",
  "sorry",
  "help",
  "welcome",
  "thank you",
  "goodbye",
  "how are you",
];
