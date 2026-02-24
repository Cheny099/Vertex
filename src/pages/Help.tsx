/**
 * @anchor-id HELP_PAGE
 * @module-type page
 * @disposable false
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, HelpCircle, MessageCircle, FileText, ChevronDown,
    Shield, Zap, BarChart2, TrendingUp, AlertTriangle,
    Clock, Target, Mail, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Foldable FAQ component
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-border/50 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
            >
                <span className="font-medium pr-4">{question}</span>
                <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180"
                )} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-muted-foreground pb-4 pr-8">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Help = () => {
    const { t } = useTranslation(['help', 'common']);
    const [activeCategory, setActiveCategory] = useState(0);

    // FAQ Categories
    const faqCategories = [
        {
            title: t('help:categories.basic'),
            icon: HelpCircle,
            items: [
                { question: t('help:faq_items.basic_1_q'), answer: t('help:faq_items.basic_1_a') },
                { question: t('help:faq_items.basic_2_q'), answer: t('help:faq_items.basic_2_a') },
                { question: t('help:faq_items.basic_3_q'), answer: t('help:faq_items.basic_3_a') },
            ],
        },
        {
            title: t('help:categories.strategy'),
            icon: BarChart2,
            items: [
                { question: t('help:faq_items.strategy_1_q'), answer: t('help:faq_items.strategy_1_a') },
                { question: t('help:faq_items.strategy_2_q'), answer: t('help:faq_items.strategy_2_a') },
                { question: t('help:faq_items.strategy_3_q'), answer: t('help:faq_items.strategy_3_a') },
                { question: t('help:faq_items.strategy_4_q'), answer: t('help:faq_items.strategy_4_a') },
            ],
        },
        {
            title: t('help:categories.api'),
            icon: Shield,
            items: [
                { question: t('help:faq_items.api_1_q'), answer: t('help:faq_items.api_1_a') },
                { question: t('help:faq_items.api_2_q'), answer: t('help:faq_items.api_2_a') },
                { question: t('help:faq_items.api_3_q'), answer: t('help:faq_items.api_3_a') },
            ],
        },
        {
            title: t('help:categories.security'),
            icon: AlertTriangle,
            items: [
                { question: t('help:faq_items.security_1_q'), answer: t('help:faq_items.security_1_a') },
                { question: t('help:faq_items.security_2_q'), answer: t('help:faq_items.security_2_a') },
                { question: t('help:faq_items.security_3_q'), answer: t('help:faq_items.security_3_a') },
            ],
        },
    ];

    // Tutorials List
    const tutorials = [
        {
            title: t('help:tutorials.quick_start.title'),
            description: t('help:tutorials.quick_start.desc'),
            icon: Zap,
            duration: t('help:tutorials.quick_start.duration'),
            steps: t('help:tutorials.quick_start.steps', { returnObjects: true }) as string[],
        },
        {
            title: t('help:tutorials.grid_strategy.title'),
            description: t('help:tutorials.grid_strategy.desc'),
            icon: BarChart2,
            duration: t('help:tutorials.grid_strategy.duration'),
            steps: t('help:tutorials.grid_strategy.steps', { returnObjects: true }) as string[],
        },
        {
            title: t('help:tutorials.api_binding.title'),
            description: t('help:tutorials.api_binding.desc'),
            icon: Shield,
            duration: t('help:tutorials.api_binding.duration'),
            steps: t('help:tutorials.api_binding.steps', { returnObjects: true }) as string[],
        },
        {
            title: t('help:tutorials.backtest.title'),
            description: t('help:tutorials.backtest.desc'),
            icon: TrendingUp,
            duration: t('help:tutorials.backtest.duration'),
            steps: t('help:tutorials.backtest.steps', { returnObjects: true }) as string[],
        },
        {
            title: t('help:tutorials.risk_control.title'),
            description: t('help:tutorials.risk_control.desc'),
            icon: Target,
            duration: t('help:tutorials.risk_control.duration'),
            steps: t('help:tutorials.risk_control.steps', { returnObjects: true }) as string[],
        },
        {
            title: t('help:tutorials.data_analysis.title'),
            description: t('help:tutorials.data_analysis.desc'),
            icon: FileText,
            duration: t('help:tutorials.data_analysis.duration'),
            steps: t('help:tutorials.data_analysis.steps', { returnObjects: true }) as string[],
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold">{t('help:title')}</h1>
                <p className="text-muted-foreground">{t('help:subtitle')}</p>
            </motion.div>

            {/* Tutorials */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl shadow-card border border-border/50 p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Book className="w-5 h-5 text-primary" /> {t('help:sections.tutorials')}</h2>
                    <span className="text-sm text-muted-foreground">{t('help:tutorials.count_prefix')} {tutorials.length} {t('help:tutorials.count_suffix')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutorials.map((tutorial, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <tutorial.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium group-hover:text-primary transition-colors">{tutorial.title}</h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {tutorial.duration}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {tutorial.steps.map((step, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                                        {i + 1}. {step}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* FAQ with Categories */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl shadow-card border border-border/50 p-6"
            >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" /> {t('help:sections.faq')}</h2>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {faqCategories.map((category, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveCategory(index)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                activeCategory === index
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <category.icon className="w-4 h-4" />
                            {category.title}
                        </button>
                    ))}
                </div>

                {/* FAQ Items */}
                <div className="space-y-0">
                    {faqCategories[activeCategory].items.map((faq, index) => (
                        <FaqItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </motion.div>

            {/* Contact */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-xl shadow-card border border-border/50 p-6"
            >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> {t('help:sections.contact')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        className="p-4 rounded-lg bg-secondary/30 flex items-center gap-4 cursor-pointer hover:bg-secondary/50 transition-colors group min-w-0"
                        onClick={() => {
                            navigator.clipboard.writeText(t('help:contact.email_value'));
                            toast.success(t('common:copy_success'));
                        }}
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">{t('help:contact.email')}</p>
                            <p className="font-medium text-primary group-hover:underline truncate">{t('help:contact.email_value')}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">{t('help:contact.chat')}</p>
                            <p className="font-medium truncate">{t('help:contact.chat_desc')}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30 flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">{t('help:contact.response')}</p>
                            <p className="font-medium truncate">{t('help:contact.response_desc')}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Help;

