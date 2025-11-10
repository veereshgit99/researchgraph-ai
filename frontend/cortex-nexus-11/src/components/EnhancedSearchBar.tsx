import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
}

const placeholderTexts = [
    "Search any paper with AI...",
    "Search any concepts like transformers...",
    "Search any models, datasets, metrics...",
];

const BASE_TEXT = "Search any ";

export const EnhancedSearchBar = ({ value, onChange, onSubmit }: EnhancedSearchBarProps) => {
    const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholderTexts[0]);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        const currentText = placeholderTexts[textIndex];
        const minLength = BASE_TEXT.length;

        const timeout = setTimeout(() => {
            if (!isDeleting && charIndex < currentText.length) {
                setDisplayText(currentText.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            } else if (isDeleting && charIndex > minLength) {
                setDisplayText(currentText.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else if (!isDeleting && charIndex === currentText.length) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && charIndex === minLength) {
                setIsDeleting(false);
                setTextIndex((textIndex + 1) % placeholderTexts.length);
            }
        }, isDeleting ? 30 : 60);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, textIndex]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSubmit) {
            onSubmit();
        }
    };

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit();
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto">
            <div className="relative flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-3 pl-8">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={displayText}
                        className="w-full bg-transparent border-none outline-none text-lg px-4 py-4 text-foreground placeholder:text-muted-foreground/60"
                    />
                </div>

                {/* Submit button with upward arrow... */}
                <Button
                    onClick={handleSubmit}
                    disabled={!value.trim()}
                    className="shrink-0 mr-2 h-11 w-11 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <ArrowUp className="h-5 w-5 text-white" strokeWidth={2.5} />
                </Button>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 via-accent-secondary/5 to-accent-primary/5 rounded-3xl blur-xl -z-10 opacity-50" />
        </div>
    );
};
