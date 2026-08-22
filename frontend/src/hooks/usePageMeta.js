import { useEffect } from "react";

const SITE_NAME = "Virtual Classroom";

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
