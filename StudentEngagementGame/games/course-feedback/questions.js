/*
 * Settings and default questions for "Course Feedback".
 * Courses, lecturers and semester dates come from shared/semesters.js.
 */

const FEEDBACK = {
  // Two feedback rounds per semester. Both are worked out from the semester dates.
  mid: {
    startAt: 0.35,   // opens on the Monday of this share of the teaching weeks (0.35 of 15 weeks = week 6)
    days: 21,        // stays open this many days
  },
  end: {
    daysBefore: 21,  // opens this many days before the last day of classes
    daysAfter: 7,    // closes this many days after it
  },
  minResponses: 3,   // lecturers see results only from this many answers on, so nobody can be recognised
  sampleData: true,  // fill the lecturer view with made-up answers for the demo

  // Background check for the school administration. It is not part of the visible survey:
  // students and lecturers never see it. A round is marked for review when enough
  // students answered and the average rating is clearly low. The marks are kept in
  // courseFeedback.review.v1 for a later administration view.
  review: {
    minResponses: 8,
    averageBelow: 2.5,
  },
};

/*
 * Topics for grouping comments in the lecturer view. A comment joins the topic
 * whose words it contains most often (a word also matches longer forms, so
 * "example" matches "examples"). Comments without a match land in "Other".
 * Earlier topics win a tie. Add words or topics freely.
 */
const COMMENT_THEMES = [
  { name: "Examples", words: ["example", "real-world", "real world", "worked", "industry", "live coding", "demo", "practical"] },
  { name: "Quizzes", words: ["quiz"] },
  { name: "Slides and materials", words: ["slide", "uploaded", "script", "material", "handout", "small text"] },
  { name: "Solutions and exercises", words: ["solution", "exercise", "sheet", "homework"] },
  { name: "Pace", words: ["rushed", "pace", "fast", "slow", "quickly", "hurry"] },
  { name: "Breaks", words: ["break", "pause"] },
  { name: "Sound and room", words: ["microphone", "hear", "audio", "back row", "loud", "room"] },
  { name: "Office hours", words: ["office hour"] },
  { name: "Summaries", words: ["summary", "summaries", "recap"] },
  { name: "Atmosphere and questions", words: ["atmosphere", "relaxed", "asking", "question", "approachable"] },
  { name: "General praise", words: ["good", "great", "clear", "thanks", "thank", "better than", "helpful", "fine"] },
];

// Labels of the 1 to 5 scale.
const SCALE_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

/*
 * Default questions. Every course starts with these. Lecturers can change
 * them in the Lecturer view, and their version is saved in the browser.
 *
 *   id            unique, keep it when you change the text
 *   type          "scale" (1 to 5), "choice" (pick one) or "text"
 *   text          the question
 *   required      must be answered before sending
 *   allowComment  scale and choice only: offers an optional comment field
 *   options       choice only: the answers to pick from
 *
 * Fields starting with "sample" only feed the made-up demo answers.
 */
const DEFAULT_QUESTIONS = [
  {
    id: "q1", type: "scale", required: true, allowComment: true,
    text: "The lecture is clearly structured.",
    sampleMean: 4.0,
  },
  {
    id: "q2", type: "scale", required: true, allowComment: true,
    text: "Difficult topics are explained well.",
    sampleMean: 3.7,
  },
  {
    id: "q3", type: "choice", required: true, allowComment: true,
    text: "How is the pace of the lecture?",
    options: ["Too slow", "Just right", "A bit fast", "Too fast"],
    sampleWeights: [1, 11, 6, 2],
  },
  {
    id: "q4", type: "scale", required: true, allowComment: true,
    text: "Exercises and assignments help me understand the material.",
    sampleMean: 4.1,
  },
  {
    id: "q5", type: "scale", required: true, allowComment: true,
    text: "The lecturer is approachable and answers questions.",
    sampleMean: 4.3,
  },
  {
    id: "q6", type: "choice", required: false, allowComment: false,
    text: "How much time do you spend on this course per week outside class?",
    options: ["Under 1 hour", "1 to 2 hours", "3 to 4 hours", "5 hours or more"],
    sampleWeights: [3, 9, 6, 2],
  },
  {
    id: "q7", type: "scale", required: true, allowComment: true,
    text: "Overall, I am satisfied with this course.",
    sampleMean: 4.0,
  },
  {
    id: "q8", type: "text", required: false,
    text: "What should stay as it is?",
    sampleComments: [
      "The live coding examples.",
      "Short quiz questions at the start of each lecture.",
      "Slides are uploaded before class, that helps a lot.",
      "The relaxed atmosphere. Asking questions feels easy.",
      "Real-world examples from industry.",
      "The weekly summary at the end.",
      "Office hours on Thursday are really useful.",
    ],
  },
  {
    id: "q9", type: "text", required: false,
    text: "What could be improved?",
    sampleComments: [
      "Sometimes the last part of the lecture is rushed.",
      "More worked examples before the exercise sheets would help.",
      "The microphone is hard to hear in the back rows.",
      "Please post solutions a bit earlier.",
      "A short break in the middle would be nice.",
      "Some slides have very small text.",
    ],
  },
];

// Made-up comments that sometimes come with a scale or choice answer in the demo.
const SAMPLE_SCALE_COMMENTS = {
  positive: [
    "Really good so far.",
    "Clear and easy to follow.",
    "Thanks for taking the time to explain things twice.",
    "Much better than I expected.",
  ],
  neutral: [
    "Mostly fine, some weeks are better than others.",
    "Depends on the topic.",
  ],
  negative: [
    "Hard to follow when the topic changes quickly.",
    "I would need more examples.",
  ],
};
