import React from 'react';
import { GuidedScenario } from '@/lib/data/guided_scenarios';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { trackEvent } from '@/lib/posthog';

interface CompleteProps {
    scenario: GuidedScenario;
    onFinish: () => void;
}

export default function ScenarioComplete({ scenario, onFinish }: CompleteProps) {
    React.useEffect(() => {
        trackEvent('guided_scenario_completed', {
            scenario_id: scenario.id,
            user_level: 'A1'
        });

        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#E8521A', '#080808', '#ffffff']
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#E8521A', '#080808', '#ffffff']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full font-sans bg-background items-center justify-center p-6 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-32 h-32 rounded-full bg-surface border-4 border-[#E8521A] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(232,82,26,0.3)]"
            >
                <Trophy className="w-16 h-16 text-[#E8521A]" />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-4xl font-display text-text-primary mb-3">Scenario Complete!</h1>
                <p className="text-text-secondary text-base max-w-sm mx-auto mb-8">
                    You've successfully mastered the essential phrases for "{scenario.title}". 
                </p>

                <div className="bg-surface border border-border rounded-2xl p-4 mb-12 flex items-center justify-center gap-4 inline-flex">
                    <CheckCircle2 className="w-6 h-6 text-[#E8521A]" />
                    <span className="text-sm font-medium text-text-primary">
                        +10 phrases added to your vocabulary deck
                    </span>
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full mt-auto mb-10"
            >
                <Button 
                    onClick={onFinish}
                    className="w-full bg-[#E8521A] text-background hover:brightness-110 font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.2)] transition-all"
                >
                    Continue Journey <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </motion.div>
        </div>
    );
}
