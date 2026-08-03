import { motion } from "framer-motion";
import {
  BarChart2,
  Book,
  Clock,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Target,
  TrendingUp,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { FaqItem } from "./components/FaqItem";
import { useHelpPageModel } from "./hooks/useHelpPageModel";

const faqCategoryIcons = {
  api: Shield,
  basic: HelpCircle,
  security: AlertTriangle,
  strategy: BarChart2,
} as const;

const tutorialIcons = {
  api_binding: Shield,
  backtest: TrendingUp,
  data_analysis: FileText,
  grid_strategy: BarChart2,
  quick_start: Zap,
  risk_control: Target,
} as const;

function HelpPage() {
  const { t } = useTranslation(["help", "common"]);
  const { activeCategory, copySupportContact, faqCategories, setActiveCategory, tutorials } = useHelpPageModel();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{t("help:title")}</h1>
        <p className="text-muted-foreground">{t("help:subtitle")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border/50 bg-card p-6 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Book className="h-5 w-5 text-primary" /> {t("help:sections.tutorials")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {t("help:tutorials.count_prefix")} {tutorials.length} {t("help:tutorials.count_suffix")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial, index) => {
            const TutorialIcon = tutorialIcons[tutorial.iconKey];
            return (
              <div
                key={index}
                className="group cursor-pointer rounded-lg border border-border/50 p-4 transition-all hover:border-primary/50 hover:bg-secondary/30"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TutorialIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium transition-colors group-hover:text-primary">{tutorial.title}</h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </p>
                  </div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{tutorial.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tutorial.steps.map((step, stepIndex) => (
                    <span key={stepIndex} className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      {stepIndex + 1}. {step}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border/50 bg-card p-6 shadow-card"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="h-5 w-5 text-primary" /> {t("help:sections.faq")}
        </h2>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {faqCategories.map((category, index) => {
            const CategoryIcon = faqCategoryIcons[category.iconKey];
            return (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
                  activeCategory === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
                )}
              >
                <CategoryIcon className="h-4 w-4" />
                {category.title}
              </button>
            );
          })}
        </div>

        <div className="space-y-0">
          {/* FaqItem owns its expanded state, so keying by position would carry that state onto a
              different question when the category changes. */}
          {faqCategories[activeCategory].items.map((faq) => (
            <FaqItem key={`${activeCategory}:${faq.question}`} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-border/50 bg-card p-6 shadow-card"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Phone className="h-5 w-5 text-primary" /> {t("help:sections.contact")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className="group flex min-w-0 cursor-pointer items-center gap-4 rounded-lg bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
            onClick={copySupportContact}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{t("help:contact.email")}</p>
              <p className="truncate font-medium text-primary group-hover:underline">{t("help:contact.email_value")}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-4 rounded-lg bg-secondary/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{t("help:contact.chat")}</p>
              <p className="truncate font-medium">{t("help:contact.chat_desc")}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-4 rounded-lg bg-secondary/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{t("help:contact.response")}</p>
              <p className="truncate font-medium">{t("help:contact.response_desc")}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HelpPage;
