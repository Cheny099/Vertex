import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Megaphone, Pin, Calendar, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { announcementApi, Announcement } from "@/api";
// import PageTitle from "@/components/PageTitle"; // If exists, otherwise manual

export default function AnnouncementList() {
    const { t, i18n } = useTranslation(["common", "announcements"]);
    const navigate = useNavigate();
    const [list, setList] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchList = async () => {
            setLoading(true);
            try {
                const lang = i18n.language.startsWith("zh") ? "zh" : "en";
                const res = await announcementApi.list(lang, 20); // Limit 20
                setList(res);
            } catch (err) {
                console.error("Failed to fetch announcements", err);
            } finally {
                setLoading(false);
            }
        };
        fetchList();
    }, [i18n.language]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        {t("announcements:title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t("announcements:subtitle")}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 md:grid-cols-1 max-w-4xl mx-auto"
                >
                    {list.map((ann) => (
                        <motion.div key={ann.id} variants={item}>
                            <Link to={`/announcements/${ann.id}`}>
                                <Card className="hover:bg-accent/50 transition-colors border-border/50 glass-card">
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${ann.is_pinned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {ann.is_pinned ? <Pin size={20} /> : <Megaphone size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {ann.is_pinned && (
                                                    <Badge variant="default" className="bg-primary/90 hover:bg-primary">
                                                        {t("announcements:pinned")}
                                                    </Badge>
                                                )}
                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {ann.title}
                                                </h3>
                                            </div>
                                            <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                                                {t("announcements:read_more")} <ArrowLeft className="rotate-180 ml-1 h-4 w-4" />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar size={14} />
                                                <span>{new Date(ann.published_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}

                    {(!loading && list.length === 0) && (
                        <div className="text-center py-20 text-muted-foreground">
                            <p>{t("announcements:no_data")}</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
