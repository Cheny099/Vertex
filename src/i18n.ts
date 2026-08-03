import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEn from './locales/en/common.json';
import adminEn from './locales/en/admin.json';
import legalEn from './locales/en/legal.json';
import announcementsEn from './locales/en/announcements.json'; // New

import settingsEn from './locales/en/settings.json';
import authEn from './locales/en/auth.json';
import landingEn from './locales/en/landing.json';
import dashboardEn from './locales/en/dashboard.json';
import strategiesEn from './locales/en/strategies.json';
import historyEn from './locales/en/history.json';
import helpEn from './locales/en/help.json';

import leaderboardEn from './locales/en/leaderboard.json';
import commonZh from './locales/zh/common.json';
import adminZh from './locales/zh/admin.json';
import legalZh from './locales/zh/legal.json';
import announcementsZh from './locales/zh/announcements.json'; // New

import settingsZh from './locales/zh/settings.json';
import landingZh from './locales/zh/landing.json';
import authZh from './locales/zh/auth.json';
import dashboardZh from './locales/zh/dashboard.json';
import strategiesZh from './locales/zh/strategies.json';
import historyZh from './locales/zh/history.json';
import helpZh from './locales/zh/help.json';
import leaderboardZh from './locales/zh/leaderboard.json';

export const resources = {
    en: {
        common: commonEn,
        admin: adminEn,
        legal: legalEn,
        announcements: announcementsEn, // Register

        settings: settingsEn,
        auth: authEn,
        landing: landingEn,
        dashboard: dashboardEn,
        strategies: strategiesEn,
        history: historyEn,
        help: helpEn,
        leaderboard: leaderboardEn,
    },
    zh: {
        common: commonZh,
        admin: adminZh,
        legal: legalZh,
        announcements: announcementsZh, // Register

        settings: settingsZh,
        auth: authZh,
        landing: landingZh,
        dashboard: dashboardZh,
        strategies: strategiesZh,
        history: historyZh,
        help: helpZh,
        leaderboard: leaderboardZh,
    },
} as const;

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languagedetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources,
        fallbackLng: 'en',
        // lng: 'en', // Force initial language to English as requested - REVERTED to allow persistence
        defaultNS: 'common',
        // The browser reports regional tags (`zh-CN`, `en-US`) and the detector would store
        // them verbatim. Collapsing them to the base language keeps `i18n.language` equal to
        // one of the two keys in `resources`, which the exact `=== 'zh'` comparisons around
        // the app (calendar locales, the Settings language Select) depend on.
        supportedLngs: ['en', 'zh'],
        load: 'languageOnly',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
            order: ['localStorage', 'navigator'], // Check localStorage then browser language
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            convertDetectedLanguage: 'languageOnly',
        },
    });

export default i18n;
