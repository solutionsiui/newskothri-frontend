"use client";

import Link from "next/link";
import { useLang } from "../context/LangContext";
import WeatherWidget from "./WeatherWidget";
import styles from "./home-discover-row.module.css";

/** Weather snapshot + link to the home “More stories” infinite feed. */
export default function HomeDiscoverRow() {
  const { t } = useLang();

  return (
    <section className={styles.wrap} aria-label={t("मौसम व खोज", "Weather and discovery")}>
      <div className={styles.grid}>
        <WeatherWidget variant="surface" />
        <div className={styles.hint}>
          <p className={styles.hintTitle}>{t("और खबरें", "More stories")}</p>
          <p className={styles.hintBody}>
            {t(
              "नीचे «और खबरें» में सभी ताज़ा खबरें स्क्रॉल के साथ मिलेंगी। यहाँ मौसम का संक्षिप्त विवरण है।",
              "Scroll to “More stories” for all latest articles. Here is a quick weather snapshot."
            )}
          </p>
          <Link href="#kn-more-stories" className={styles.hintLink}>
            {t("और खबरें पर जाएँ", "Jump to more stories")}
          </Link>
        </div>
      </div>
    </section>
  );
}
