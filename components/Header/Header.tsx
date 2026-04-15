"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Header.module.scss";

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Showers", 81: "Showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

function getWeatherLabel(code: number) {
  return WMO_LABELS[code] ?? "—";
}

function getStatusLine(hour: number, code: number, temp: number, isWeekend: boolean): string {
  const isSnow = code >= 71 && code <= 77;
  const isStorm = code >= 95;
  const isRain = (code >= 51 && code <= 65) || (code >= 80 && code <= 82);
  const isClear = code <= 1;
  const isNice = isClear && temp >= 18;
  const isHot = temp >= 28;

  if (hour >= 0 && hour < 7)   return "Probably asleep";
  if (hour >= 7 && hour < 9)   return isWeekend
    ? (isRain ? "Slow morning, coffee and rain" : "Sleeping in a bit")
    : (isRain ? "Making coffee, watching the rain" : "Just woke up, making coffee");
  if (hour >= 9 && hour < 11)  return isWeekend
    ? (isNice ? "Might be at the market" : isRain ? "Lazy morning at home" : "Brunch somewhere")
    : (isStorm ? "Coding while the storm passes" : "Starting the day");
  if (hour >= 11 && hour < 13) return isWeekend
    ? (isHot && isClear ? "Probably at the beach" : isRain ? "Visiting a museum maybe" : "Exploring the city")
    : (isHot && isClear ? "Might be at the beach" : isRain ? "Deep in code" : "Probably coding");
  if (hour >= 13 && hour < 15) return isWeekend
    ? (isNice ? "Probably lunch with family" : "Having lunch")
    : "Having lunch";
  if (hour >= 15 && hour < 17) return isWeekend
    ? (isSnow ? "I might be skiing" : isHot && isClear ? "Siesta or the beach" : isRain ? "Watching a film" : "Wandering around")
    : (isSnow ? "I might be skiing" : isStorm ? "Coding inside" : "Back at the desk");
  if (hour >= 17 && hour < 19) return isWeekend
    ? (isNice ? "Golden hour walk on the beach" : isRain ? "Coffee somewhere" : "Out for a walk")
    : (isHot && isClear ? "Maybe a walk along the beach" : isRain ? "Reading or coding" : "Evening walk maybe");
  if (hour >= 19 && hour < 21) return isWeekend
    ? (isNice ? "Watching FC Barcelona" : "Probably having a beer")
    : "Probably having a beer";
  if (hour >= 21 && hour < 23) return "Out for dinner";
  return "Wrapping up the day";
}

export default function Header() {
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [hour, setHour] = useState(0);
  const [isWeekend, setIsWeekend] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; label: string; code: number } | null>(null);

  // Live clock — Barcelona timezone
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Europe/Madrid",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase()
      );
      setHour(parseInt(now.toLocaleString("en-GB", { timeZone: "Europe/Madrid", hour: "numeric", hour12: false })));
      const weekday = now.toLocaleDateString("en-GB", { timeZone: "Europe/Madrid", weekday: "short" });
      setIsWeekend(weekday === "Sat" || weekday === "Sun");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Weather — Open-Meteo, Barcelona coords
  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.3828&longitude=2.1771&current=temperature_2m,weathercode&timezone=Europe%2FMadrid"
    )
      .then((r) => r.json())
      .then((data) => {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weathercode;
        const label = getWeatherLabel(code);
        setWeather({ temp, label, code });
      })
      .catch(() => {});
  }, []);

  if (pathname.includes("/studio")) return null;

  return (
    <header className={styles.header}>
      <div className={styles.header__identity}>
        <span className={styles.header__name}>Jordi Garreta</span>
        <span className={styles.header__role}>Creative developer · Available for work</span>
      </div>
      <div className={styles.header__location}>
        <span className={styles.header__city}>BCN, {time}</span>
        <span className={styles.header__info}>
          {weather && <>{weather.temp}°C, {weather.label}</>}
        </span>
        {weather && (
          <span className={styles.header__status}>
            {getStatusLine(hour, weather.code, weather.temp, isWeekend)}
          </span>
        )}
      </div>
    </header>
  );
}
