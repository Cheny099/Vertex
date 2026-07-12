import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function useHelpPageModel() {
  const { t } = useTranslation(["help", "common"]);
  const [activeCategory, setActiveCategory] = useState(0);

  const faqCategories = useMemo(
    () => [
      {
        title: t("help:categories.basic"),
        iconKey: "basic",
        items: [
          { question: t("help:faq_items.basic_1_q"), answer: t("help:faq_items.basic_1_a") },
          { question: t("help:faq_items.basic_2_q"), answer: t("help:faq_items.basic_2_a") },
          { question: t("help:faq_items.basic_3_q"), answer: t("help:faq_items.basic_3_a") },
        ],
      },
      {
        title: t("help:categories.strategy"),
        iconKey: "strategy",
        items: [
          { question: t("help:faq_items.strategy_1_q"), answer: t("help:faq_items.strategy_1_a") },
          { question: t("help:faq_items.strategy_2_q"), answer: t("help:faq_items.strategy_2_a") },
          { question: t("help:faq_items.strategy_3_q"), answer: t("help:faq_items.strategy_3_a") },
          { question: t("help:faq_items.strategy_4_q"), answer: t("help:faq_items.strategy_4_a") },
        ],
      },
      {
        title: t("help:categories.api"),
        iconKey: "api",
        items: [
          { question: t("help:faq_items.api_1_q"), answer: t("help:faq_items.api_1_a") },
          { question: t("help:faq_items.api_2_q"), answer: t("help:faq_items.api_2_a") },
          { question: t("help:faq_items.api_3_q"), answer: t("help:faq_items.api_3_a") },
        ],
      },
      {
        title: t("help:categories.security"),
        iconKey: "security",
        items: [
          { question: t("help:faq_items.security_1_q"), answer: t("help:faq_items.security_1_a") },
          { question: t("help:faq_items.security_2_q"), answer: t("help:faq_items.security_2_a") },
          { question: t("help:faq_items.security_3_q"), answer: t("help:faq_items.security_3_a") },
        ],
      },
    ],
    [t],
  );

  const tutorials = useMemo(
    () => [
      {
        title: t("help:tutorials.quick_start.title"),
        description: t("help:tutorials.quick_start.desc"),
        iconKey: "quick_start",
        duration: t("help:tutorials.quick_start.duration"),
        steps: t("help:tutorials.quick_start.steps", { returnObjects: true }) as string[],
      },
      {
        title: t("help:tutorials.grid_strategy.title"),
        description: t("help:tutorials.grid_strategy.desc"),
        iconKey: "grid_strategy",
        duration: t("help:tutorials.grid_strategy.duration"),
        steps: t("help:tutorials.grid_strategy.steps", { returnObjects: true }) as string[],
      },
      {
        title: t("help:tutorials.api_binding.title"),
        description: t("help:tutorials.api_binding.desc"),
        iconKey: "api_binding",
        duration: t("help:tutorials.api_binding.duration"),
        steps: t("help:tutorials.api_binding.steps", { returnObjects: true }) as string[],
      },
      {
        title: t("help:tutorials.backtest.title"),
        description: t("help:tutorials.backtest.desc"),
        iconKey: "backtest",
        duration: t("help:tutorials.backtest.duration"),
        steps: t("help:tutorials.backtest.steps", { returnObjects: true }) as string[],
      },
      {
        title: t("help:tutorials.risk_control.title"),
        description: t("help:tutorials.risk_control.desc"),
        iconKey: "risk_control",
        duration: t("help:tutorials.risk_control.duration"),
        steps: t("help:tutorials.risk_control.steps", { returnObjects: true }) as string[],
      },
      {
        title: t("help:tutorials.data_analysis.title"),
        description: t("help:tutorials.data_analysis.desc"),
        iconKey: "data_analysis",
        duration: t("help:tutorials.data_analysis.duration"),
        steps: t("help:tutorials.data_analysis.steps", { returnObjects: true }) as string[],
      },
    ],
    [t],
  );

  const copySupportContact = async () => {
    await navigator.clipboard.writeText(t("help:contact.email_value"));
    toast.success(t("common:copy_success"));
  };

  return {
    activeCategory,
    copySupportContact,
    faqCategories,
    setActiveCategory,
    tutorials,
  };
}

export { useHelpPageModel };
