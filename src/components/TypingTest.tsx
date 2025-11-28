import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

const WORD_BANK = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

const TEST_DURATION = 60; // seconds
const WORDS_COUNT = 60;

const generateWords = () => {
  const words = [];
  for (let i = 0; i < WORDS_COUNT; i++) {
    words.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]);
  }
  return words;
};

const getGrade = (wpm: number, accuracy: number): string => {
  const score = wpm * (accuracy / 100);
  if (score >= 80 && accuracy >= 95) return "S";
  if (score >= 60 && accuracy >= 90) return "A";
  if (score >= 40 && accuracy >= 85) return "B";
  if (score >= 25 && accuracy >= 80) return "C";
  return "D";
};

const computeStats = (
  words: string[],
  typedWordList: string[],
  timeElapsedSeconds: number
) => {
  let correctWords = 0;
  let totalChars = 0;
  let correctChars = 0;

  typedWordList.forEach((word, index) => {
    const target = words[index];
    if (!target) return;

    totalChars += word.length;

    if (word === target) {
      correctWords++;
      correctChars += word.length;
    } else {
      const limit = Math.min(word.length, target.length);
      for (let i = 0; i < limit; i++) {
        if (word[i] === target[i]) {
          correctChars++;
        }
      }
    }
  });

  const incorrectWords = typedWordList.length - correctWords;
  const accuracyRaw = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
  const accuracy = Math.round(accuracyRaw);

  const timeMinutes =
    timeElapsedSeconds > 0 ? timeElapsedSeconds / 60 : 1 / 60;

  const wpm =
    totalChars > 0 ? Math.round((correctChars / 5) / timeMinutes) : 0;

  const grade = getGrade(wpm, accuracyRaw);

  return {
    wpm,
    accuracy,
    correctWords,
    incorrectWords,
    grade,
  };
};

export const TypingTest = () => {
  const [words, setWords] = useState<string[]>(generateWords());
  const [userInput, setUserInput] = useState("");
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 0,
    correctWords: 0,
    incorrectWords: 0,
    grade: "D",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      setIsActive(false);
      setIsFinished(true);
      calculateStats();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isFinished]);

  useEffect(() => {
    if (wordRefs.current[currentWordIndex]) {
      wordRefs.current[currentWordIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentWordIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        restart();
      } else if (e.key === "Escape") {
        setUserInput("");
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const calculateStats = () => {
    const allTypedWords = [...typedWords, userInput.trim()].filter(
      (w) => w.length > 0
    );

    const timeElapsed = TEST_DURATION - timeLeft || 1;

    const newStats = computeStats(words, allTypedWords, timeElapsed);

    setStats(newStats);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!isActive && value.length > 0) {
      setIsActive(true);
    }

    // completed a word
    if (value.endsWith(" ")) {
      const typedWord = value.trim();

      setTypedWords((prev) => [...prev, typedWord]);

      if (typedWord === words[currentWordIndex]) {
        setCombo((prev) => {
          const newCombo = prev + 1;
          setMaxCombo((max) => Math.max(max, newCombo));
          return newCombo;
        });
      } else {
        setCombo(0);
      }

      setCurrentWordIndex((prev) => Math.min(prev + 1, words.length - 1));
      setUserInput("");
    } else {
      setUserInput(value);
    }
  };

  const restart = () => {
    setWords(generateWords());
    setUserInput("");
    setTypedWords([]);
    setCurrentWordIndex(0);
    setTimeLeft(TEST_DURATION);
    setIsActive(false);
    setIsFinished(false);
    setCombo(0);
    setMaxCombo(0);
    setStats({
      wpm: 0,
      accuracy: 0,
      correctWords: 0,
      incorrectWords: 0,
      grade: "D",
    });
    wordRefs.current = [];
    inputRef.current?.focus();
  };

  const getCharStatus = (
    wordIndex: number,
    charIndex: number
  ): "correct" | "incorrect" | "current" | "pending" => {
    if (wordIndex > currentWordIndex) return "pending";
    if (wordIndex < currentWordIndex) {
      const typedWord = typedWords[wordIndex] || "";
      if (charIndex < typedWord.length) {
        return typedWord[charIndex] === words[wordIndex][charIndex]
          ? "correct"
          : "incorrect";
      }
      return charIndex < words[wordIndex].length ? "incorrect" : "pending";
    }

    // current word
    if (wordIndex === currentWordIndex) {
      if (charIndex < userInput.length) {
        return userInput[charIndex] === words[wordIndex][charIndex]
          ? "correct"
          : "incorrect";
      }
      if (charIndex === userInput.length) return "current";
    }

    return "pending";
  };

  const currentWpm = (() => {
    const timeElapsed = TEST_DURATION - timeLeft;

    if (!isActive || timeElapsed <= 0) return 0;

    const allTypedWords = [...typedWords, userInput.trim()].filter(
      (w) => w.length > 0
    );

    if (allTypedWords.length === 0) return 0;

    const { wpm } = computeStats(words, allTypedWords, timeElapsed);
    return wpm;
  })();

  const progressPercentage = ((TEST_DURATION - timeLeft) / TEST_DURATION) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background font-sans">
      <div className="w-full max-w-5xl space-y-6">
        {!isFinished ? (
          <>
            {/* Stats Bar */}
            <Card className="p-6 bg-card border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Time
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {timeLeft}s
                  </p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all duration-1000"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    WPM
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {currentWpm}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Words
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {currentWordIndex}
                  </p>
                </div>

                <div className="flex items-center justify-center md:justify-end">
                  <Button variant="outline" size="default" onClick={restart}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart
                  </Button>
                </div>
              </div>
            </Card>

            {/* Typing Area */}
            <Card className="p-8 bg-card border">
              <div className="relative">
                <div
                  className="text-xl leading-relaxed font-mono min-h-[240px] max-h-[240px] overflow-y-auto select-none focus-within:ring-2 focus-within:ring-foreground/20 rounded p-6 bg-muted/50 cursor-text"
                  onClick={() => inputRef.current?.focus()}
                >
                  {words.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      ref={(el) => (wordRefs.current[wordIndex] = el)}
                      className="inline-block mx-1"
                    >
                      {word.split("").map((char, charIndex) => {
                        const status = getCharStatus(wordIndex, charIndex);
                        let className = "transition-colors ";

                        switch (status) {
                          case "correct":
                            className += "text-success";
                            break;
                          case "incorrect":
                            className += "text-destructive bg-destructive/10";
                            break;
                          case "current":
                            className += "text-foreground bg-foreground/20";
                            break;
                          default:
                            className += "text-muted-foreground";
                        }

                        return (
                          <span key={charIndex} className={className}>
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  ))}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  disabled={isFinished || timeLeft === 0}
                  className="absolute inset-0 opacity-0 cursor-default"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {!isActive && "Start typing to begin"}
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-10 bg-card border">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-foreground">
                  Test Complete
                </h2>
                <div className="inline-block">
                  <div className="text-6xl font-bold mb-2 text-foreground">
                    {stats.grade}
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    Grade
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div className="p-6 bg-muted border rounded">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    WPM
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {stats.wpm}
                  </p>
                </div>

                <div className="p-6 bg-muted border rounded">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Accuracy
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {stats.accuracy}%
                  </p>
                </div>

                <div className="p-6 bg-muted border rounded">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Correct
                  </p>
                  <p className="text-4xl font-semibold text-success">
                    {stats.correctWords}
                  </p>
                </div>

                <div className="p-6 bg-muted border rounded">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Errors
                  </p>
                  <p className="text-4xl font-semibold text-destructive">
                    {stats.incorrectWords}
                  </p>
                </div>
              </div>

              <Button onClick={restart} size="default" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart Test
              </Button>
            </div>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">
              Tab
            </kbd>
            <span>Restart</span>
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">
              Esc
            </kbd>
            <span>Clear</span>
          </span>
        </div>
      </div>
    </div>
  );
};
