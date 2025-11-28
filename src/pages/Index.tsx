import { TypingTest } from "@/components/TypingTest";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-foreground" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Type Speed Test

            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <TypingTest />
    </div>
  );
};

export default Index;
