/*
 * Question pool for Robo Maze.
 *
 * Each locked tile asks one question from this list. Edit or extend it freely
 * for your own lecture. Fields:
 *   topic    short label shown above the question
 *   q        the question text
 *   code     (optional) a code snippet shown under the question
 *   options  the answer choices (2 to 6), shuffled when shown
 *   answer   index (0-based) of the correct entry in `options`
 *   explain  one or two sentences shown after answering
 */
const QUESTIONS = [
  // ---------- Number systems ----------
  {
    topic: "Number systems",
    q: "What is the binary number 1010 in decimal?",
    options: ["10", "12", "5", "1010"],
    answer: 0,
    explain: "1010₂ = 1·8 + 0·4 + 1·2 + 0·1 = 10."
  },
  {
    topic: "Number systems",
    q: "How is the decimal number 7 written in binary?",
    options: ["111", "110", "101", "1000"],
    answer: 0,
    explain: "7 = 4 + 2 + 1, so all three lowest bits are set: 111."
  },
  {
    topic: "Number systems",
    q: "How many bits are in one byte?",
    options: ["8", "4", "16", "10"],
    answer: 0,
    explain: "A byte consists of 8 bits."
  },
  {
    topic: "Number systems",
    q: "How many different values can one byte represent?",
    options: ["256", "255", "128", "8"],
    answer: 0,
    explain: "8 bits give 2⁸ = 256 combinations (0 to 255)."
  },
  {
    topic: "Number systems",
    q: "What is the hexadecimal digit F in decimal?",
    options: ["15", "16", "14", "F is not a number"],
    answer: 0,
    explain: "Hex counts 0–9 and then A=10 … F=15."
  },
  {
    topic: "Number systems",
    q: "What is 2¹⁰?",
    options: ["1024", "1000", "512", "2048"],
    answer: 0,
    explain: "Doubling 1 ten times gives 1024."
  },
  {
    topic: "Number systems",
    q: "Which number system do computers use internally?",
    options: ["Binary (base 2)", "Decimal (base 10)", "Roman numerals", "Base 3"],
    answer: 0,
    explain: "Digital circuits know two states (on/off), so computers work in binary."
  },

  // ---------- Logic ----------
  {
    topic: "Boolean logic",
    q: "What is the result of TRUE AND FALSE?",
    options: ["FALSE", "TRUE"],
    answer: 0,
    explain: "AND is only TRUE when both inputs are TRUE."
  },
  {
    topic: "Boolean logic",
    q: "What is the result of TRUE OR FALSE?",
    options: ["TRUE", "FALSE"],
    answer: 0,
    explain: "OR is TRUE when at least one input is TRUE."
  },
  {
    topic: "Boolean logic",
    q: "What is NOT TRUE?",
    options: ["FALSE", "TRUE", "NULL", "Error"],
    answer: 0,
    explain: "NOT flips the value: TRUE becomes FALSE."
  },
  {
    topic: "Boolean logic",
    q: "What is 1 XOR 1?",
    options: ["0", "1", "2", "11"],
    answer: 0,
    explain: "XOR (exclusive or) is 1 only when the inputs differ."
  },
  {
    topic: "Boolean logic",
    q: "Which logic gate outputs 1 only if both inputs are 1?",
    options: ["AND", "OR", "XOR", "NOT"],
    answer: 0,
    explain: "That is the definition of AND."
  },

  // ---------- Programming basics ----------
  {
    topic: "Programming",
    q: "What does this program print?",
    code: "x = 5\nx = x + 3\nprint(x)",
    options: ["8", "5", "53", "x + 3"],
    answer: 0,
    explain: "x starts at 5, then gets 5 + 3 = 8 assigned."
  },
  {
    topic: "Programming",
    q: "What does this loop print?",
    code: "for i in range(3):\n    print(i)",
    options: ["0 1 2", "1 2 3", "0 1 2 3", "3"],
    answer: 0,
    explain: "range(3) counts from 0 up to, but not including, 3."
  },
  {
    topic: "Programming",
    q: "What does this program print?",
    code: "x = 2\nif x > 3:\n    print(\"big\")\nelse:\n    print(\"small\")",
    options: ["small", "big", "big small", "nothing"],
    answer: 0,
    explain: "2 > 3 is false, so the else branch runs."
  },
  {
    topic: "Programming",
    q: "What is the value of 10 % 3 (modulo)?",
    options: ["1", "3", "3.33", "0"],
    answer: 0,
    explain: "10 = 3·3 + 1, the remainder is 1."
  },
  {
    topic: "Programming",
    q: "What does len(\"Robot\") return in Python?",
    options: ["5", "4", "6", "\"Robot\""],
    answer: 0,
    explain: "The string has 5 characters: R-o-b-o-t."
  },
  {
    topic: "Programming",
    q: "In most languages (C, Java, Python), what is the index of the first element of an array/list?",
    options: ["0", "1", "-1", "It depends on the length"],
    answer: 0,
    explain: "These languages count indices from 0."
  },
  {
    topic: "Programming",
    q: "Which data type stores the values true / false?",
    options: ["Boolean", "Integer", "String", "Float"],
    answer: 0,
    explain: "A Boolean has exactly two values: true and false."
  },
  {
    topic: "Programming",
    q: "What is a variable?",
    options: [
      "A named place in memory that stores a value",
      "A command that ends the program",
      "A type of loop",
      "A hardware component"
    ],
    answer: 0,
    explain: "A variable gives a name to a stored value that can change."
  },
  {
    topic: "Programming",
    q: "What is a function called that calls itself?",
    options: ["Recursive", "Iterative", "Static", "Compiled"],
    answer: 0,
    explain: "Recursion means a function solves a problem by calling itself on a smaller part."
  },
  {
    topic: "Programming",
    q: "Which of these is a markup language, not a programming language?",
    options: ["HTML", "Python", "Java", "C"],
    answer: 0,
    explain: "HTML describes the structure of a web page. It has no loops or logic."
  },

  // ---------- Algorithms & data structures ----------
  {
    topic: "Algorithms",
    q: "What is an algorithm?",
    options: [
      "A finite sequence of well-defined steps to solve a problem",
      "A special type of computer",
      "A programming language",
      "A random guess"
    ],
    answer: 0,
    explain: "An algorithm is a precise, step-by-step recipe, just like the moves you give this robot!"
  },
  {
    topic: "Data structures",
    q: "Which data structure works by LIFO (Last In, First Out)?",
    options: ["Stack", "Queue", "Array", "Tree"],
    answer: 0,
    explain: "A stack is like a pile of plates: the last one put on is taken off first."
  },
  {
    topic: "Data structures",
    q: "Which data structure works by FIFO (First In, First Out)?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    answer: 0,
    explain: "A queue is like a line at the cafeteria: first come, first served."
  },
  {
    topic: "Algorithms",
    q: "What does binary search require from the data?",
    options: ["It must be sorted", "It must be binary numbers", "It must be short", "Nothing"],
    answer: 0,
    explain: "Binary search halves the range each step, which only works on sorted data."
  },
  {
    topic: "Algorithms",
    q: "Linear search in a list of n elements needs at most how many comparisons?",
    options: ["n", "1", "log₂ n", "n²"],
    answer: 0,
    explain: "In the worst case every element is checked once."
  },
  {
    topic: "Algorithms",
    q: "Which sorting algorithm repeatedly swaps neighbouring elements that are in the wrong order?",
    options: ["Bubble sort", "Merge sort", "Binary search", "Quick search"],
    answer: 0,
    explain: "Bubble sort lets large values 'bubble up' by swapping neighbours."
  },
  {
    topic: "Algorithms",
    q: "Binary search on 1024 sorted elements needs at most about how many steps?",
    options: ["10", "512", "1024", "100"],
    answer: 0,
    explain: "Each step halves the range: 2¹⁰ = 1024, so about 10 steps."
  },

  // ---------- Hardware & networks ----------
  {
    topic: "Hardware",
    q: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Core Processing Usage"],
    answer: 0,
    explain: "The CPU executes the instructions of a program."
  },
  {
    topic: "Hardware",
    q: "What happens to the contents of RAM when the computer is switched off?",
    options: ["They are lost", "They are saved automatically", "They move to the CPU", "Nothing, RAM is permanent"],
    answer: 0,
    explain: "RAM is volatile memory. It needs power to keep its data."
  },
  {
    topic: "Networks",
    q: "What does DNS do?",
    options: [
      "Translates domain names into IP addresses",
      "Encrypts websites",
      "Stores your passwords",
      "Speeds up the CPU"
    ],
    answer: 0,
    explain: "DNS is the 'phone book' of the internet: example.com → an IP address."
  },
  {
    topic: "Networks",
    q: "What does an IP address identify?",
    options: ["A device in a network", "A user's password", "A file on disk", "A programming language"],
    answer: 0,
    explain: "Every device in an IP network gets an address so data can be delivered to it."
  }
];
