"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "es";

export const translations = {
  en: {
    navbar: {
      pricing: "Pricing",
      getStarted: "Get Started",
      lightMode: "Switch to light mode",
      darkMode: "Switch to dark mode",
      switchLanguage: "Cambiar a Español",
    },
    hero: {
      badgeTag: "Scan",
      badgeText: "Facial analysis based on real proportions",
      titlePre: "Scan your face with ",
      titleGradient: "absolute precision.",
      description:
        "Upload your photo and get a complete analysis with a score, facial proportions, strengths, and areas to improve, along with a detailed breakdown of your features.",
      ctaPrimary: "Scan my face",
      ctaSecondary: "View plans",
    },
    analysisPreview: {
      titlePre: "Preview of the ",
      titleGradient: "analysis",
      description:
        "This is what a full scan looks like: proportions, features, and harmony visualized in real time.",
      status: "Analysis complete",
      overallHarmony: "Overall harmony",
      ratioTitle: "Mean facial ratio",
      ratioBadge: "Optimal · 9.4",
      alarTitle: "Alar-mandibular deviation",
      alarBadge: "Ideal · 9.8",
      previewLabel: "Face scan preview",
      imageAlt: "Analyzed face",
    },
    howItWorks: {
      title: "Three steps. Five minutes.",
      titleGradient: "Complete breakdown.",
      step1Title: "Upload your photo",
      step1Desc:
        "Front-facing, with even lighting and a neutral expression. Everything processes locally in your browser: never stored on any server.",
      step1Drop: "Drop your photo here",
      step2Title: "Set anatomical landmarks",
      step2Desc:
        "Our AI detects key facial points automatically while allowing manual adjustments. Exact proportions and ratios calculate in real time.",
      step3Title: "Receive your results",
      step3Desc:
        "Overall harmony score and breakdown for each individual ratio, complete with reference ranges and a clear explanation of each dimension.",
    },
    dimensions: {
      titlePre: "Four dimensions. ",
      titleGradient: "One complete picture.",
      harmonyTitle: "Harmony",
      harmonyDesc:
        "Golden ratio, facial thirds and fifths, and proportional balance from precise anatomical landmark measurements.",
      traitsTitle: "Traits",
      traitsDesc:
        "Skin, hair, eyes, nose, jawline, lips, brow structure, and more — each feature scored individually.",
      angularityTitle: "Angularity",
      angularityDesc:
        "Eye depth, jaw definition, cheekbone sharpness, chin shape, and overall facial angularity.",
      dimorphismTitle: "Dimorphism",
      dimorphismDesc:
        "Visual dimorphism markers scored from ratios: coloring, brow density, and jaw shape and structure.",
    },
    ctaBanner: {
      badge: "Instant Precision Analysis",
      titlePre: "Ready to see your ",
      titleGradient: "score?",
      subtitle:
        "Upload a single photo and receive a clinical-grade breakdown in under 60 seconds.",
      feature1Title: "40+ Landmarks",
      feature1Desc:
        "Sub-millimeter mapping of facial thirds, fifths, jawline taper, and cant.",
      feature2Title: "Harmonic Scoring",
      feature2Desc:
        "Objective ratios correlated against golden ratio mathematical distributions.",
      feature3Title: "100% Private",
      feature3Desc:
        "Zero cloud storage. Your image is processed locally inside your browser.",
      feature4Title: "Instant Results",
      feature4Desc:
        "Detailed radar breakdowns and actionable structural insights in seconds.",
      button: "Scan my face",
      badge1: "No sign-up required",
      badge2: "Instant report access",
      badge3: "Encrypted processing",
    },
    pricing: {
      badgePopular: "Popular",
      title: "Ready to see your score?",
      subtitle: "Choose the analysis level for your complete precision facial report.",
      chooseButton: "Choose your plan",
      securePayment: "Secure payment",
      instantResults: "Instant results",
      priceLabel: "Price",
      features: {
        harmony: "Harmony",
        traits: "Traits",
        angularity: "Angularity",
        dimorphism: "Dimorphism",
        fullReport: "Full Score Report",
        multipleScans: "Multiple Scans",
      },
      plans: {
        basic: {
          name: "Basic",
          subtext: "One-time payment",
        },
        completo: {
          name: "Complete",
          subtext: "One-time payment",
        },
        premium: {
          name: "Premium",
          subtext: "Monthly",
        },
      },
    },
    footer: {
      rights: "All rights reserved.",
      description: "Clinical-grade precision facial aesthetics and proportion analysis.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      followUs: "Follow us",
    },
    notFound: {
      title: "Page Not Found",
      description: "The page you are looking for doesn't exist or has been moved.",
      home: "Go to Home",
      pricing: "View Pricing",
    },
    modal: {
      closeLabel: "Close modal",
    },
  },
  es: {
    navbar: {
      pricing: "Precios",
      getStarted: "Comenzar",
      lightMode: "Cambiar a modo claro",
      darkMode: "Cambiar a modo oscuro",
      switchLanguage: "Switch to English",
    },
    hero: {
      badgeTag: "Escaneo",
      badgeText: "Análisis facial basado en proporciones reales",
      titlePre: "Escanea tu rostro con ",
      titleGradient: "precisión absoluta.",
      description:
        "Sube tu foto y obtén un análisis completo con puntuación, proporciones faciales, fortalezas y áreas de mejora, junto con un desglose detallado de tus rasgos.",
      ctaPrimary: "Escanear mi rostro",
      ctaSecondary: "Ver planes",
    },
    analysisPreview: {
      titlePre: "Vista previa del ",
      titleGradient: "análisis",
      description:
        "Así luce un escaneo completo: proporciones, rasgos y armonía visualizados en tiempo real.",
      status: "Análisis completado",
      overallHarmony: "Armonía general",
      ratioTitle: "Proporción facial media",
      ratioBadge: "Óptimo · 9.4",
      alarTitle: "Desviación alar-mandibular",
      alarBadge: "Ideal · 9.8",
      previewLabel: "Vista previa del escaneo facial",
      imageAlt: "Rostro analizado",
    },
    howItWorks: {
      title: "Tres pasos. Cinco minutos.",
      titleGradient: "Desglose completo.",
      step1Title: "Sube tu foto",
      step1Desc:
        "De frente, con iluminación uniforme y expresión neutra. Todo se procesa localmente en tu navegador: nunca se almacena en ningún servidor.",
      step1Drop: "Arrastra tu foto aquí",
      step2Title: "Define puntos anatómicos",
      step2Desc:
        "Nuestra IA detecta puntos faciales clave automáticamente permitiendo ajustes manuales. Las proporciones y ratios exactos se calculan en tiempo real.",
      step3Title: "Recibe tus resultados",
      step3Desc:
        "Puntuación de armonía general y desglose de cada ratio individual, con rangos de referencia y explicación clara de cada dimensión.",
    },
    dimensions: {
      titlePre: "Cuatro dimensiones. ",
      titleGradient: "Una visión completa.",
      harmonyTitle: "Armonía",
      harmonyDesc:
        "Proporción áurea, tercios y quintos faciales, y equilibrio proporcional a partir de mediciones anatómicas precisas.",
      traitsTitle: "Rasgos",
      traitsDesc:
        "Piel, cabello, ojos, nariz, mandíbula, labios, estructura de cejas y más: cada rasgo calificado individualmente.",
      angularityTitle: "Angularidad",
      angularityDesc:
        "Profundidad ocular, definición mandibular, prominencia de pómulos, forma del mentón y angularidad general.",
      dimorphismTitle: "Dimorfismo",
      dimorphismDesc:
        "Marcadores visuales de dimorfismo calculados a partir de ratios: coloración, densidad de cejas y estructura ósea.",
    },
    ctaBanner: {
      badge: "Análisis de Precisión Inmediato",
      titlePre: "¿Listo para conocer tu ",
      titleGradient: "puntuación?",
      subtitle:
        "Sube una sola foto y recibe un informe de nivel clínico en menos de 60 segundos.",
      feature1Title: "Más de 40 puntos",
      feature1Desc:
        "Mapeo submilimétrico de tercios faciales, quintos, ángulo y conicidad mandibular.",
      feature2Title: "Puntuación Armónica",
      feature2Desc:
        "Ratios objetivos correlacionados con distribuciones matemáticas de proporción áurea.",
      feature3Title: "100% Privado",
      feature3Desc:
        "Cero almacenamiento en la nube. Tu foto se procesa de forma segura dentro de tu navegador.",
      feature4Title: "Resultados Inmediatos",
      feature4Desc:
        "Gráficos detallados y recomendaciones estructurales prácticas en segundos.",
      button: "Escanear mi rostro",
      badge1: "Sin necesidad de registro",
      badge2: "Acceso inmediato al reporte",
      badge3: "Procesamiento encriptado",
    },
    pricing: {
      badgePopular: "Popular",
      title: "¿Listo para ver tu puntuación?",
      subtitle: "Elige el nivel de análisis para tu reporte facial completo de precisión.",
      chooseButton: "Elegir plan",
      securePayment: "Pago 100% seguro",
      instantResults: "Resultados inmediatos",
      priceLabel: "Precio",
      features: {
        harmony: "Armonía",
        traits: "Rasgos",
        angularity: "Angularidad",
        dimorphism: "Dimorfismo",
        fullReport: "Reporte de Puntuación Completo",
        multipleScans: "Múltiples Escaneos",
      },
      plans: {
        basic: {
          name: "Básico",
          subtext: "Pago único",
        },
        completo: {
          name: "Completo",
          subtext: "Pago único",
        },
        premium: {
          name: "Premium",
          subtext: "Suscripción mensual",
        },
      },
    },
    footer: {
      rights: "Todos los derechos reservados.",
      description: "Análisis estético facial y proporciones anatómicas de precisión clínica.",
      privacy: "Política de Privacidad",
      terms: "Términos del Servicio",
      followUs: "Síguenos",
    },
    notFound: {
      title: "Página no encontrada",
      description: "La página que buscas no existe o fue movida.",
      home: "Ir al inicio",
      pricing: "Ver precios",
    },
    modal: {
      closeLabel: "Cerrar ventana",
    },
  },
};


interface LanguageContextType {
  language: Language;
  t: typeof translations.en;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("t1_lang") as Language | null;
    if (stored === "en" || stored === "es") {
      setLanguageState(stored);
      document.documentElement.lang = stored;
    } else {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "es") {
        setLanguageState("es");
        document.documentElement.lang = "es";
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("t1_lang", lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "es" : "en";
    setLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations[language],
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

