import { useEffect } from "react";

const SITE_NAME = "Virtual Classroom";

// Sets this route's <title>, meta description, and canonical link on mount,
// restoring the previous values on unmount. Only meaningful for the handful
// of public routes (landing/login/register) — the rest of the app is
// auth-gated and never gets indexed, so there's no SEO value in wiring this
// up everywhere, but the title still helps users tell tabs/history/
// bookmarks apart. Canonical is derived from the current location so every
// public route points at itself instead of all sharing index.html's "/".
export default function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    let descriptionTag;
    let prevDescription;
    if (description) {
      descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) {
        prevDescription = descriptionTag.getAttribute("content");
        descriptionTag.setAttribute("content", description);
      }
    }

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonicalTag?.getAttribute("href");
    if (canonicalTag) {
      canonicalTag.setAttribute(
        "href",
        `${window.location.origin}${window.location.pathname}`
      );
    }

    return () => {
      document.title = prevTitle;
      if (descriptionTag && prevDescription !== undefined) {
        descriptionTag.setAttribute("content", prevDescription);
      }
      if (canonicalTag && prevCanonical !== undefined) {
        canonicalTag.setAttribute("href", prevCanonical);
      }
    };
  }, [title, description]);
}
