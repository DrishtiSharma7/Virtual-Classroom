import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./store";
import "./styles/global.css";

// Global safeguard: automatically suppress Picture-in-Picture, remote playback,
// and strip any open shadow-roots attached to media elements across the entire app
if (typeof window !== "undefined") {
  const sanitizeMedia = (node) => {
    if (!node || !node.querySelectorAll) return;
    const mediaElements = node.matches?.("video, audio")
      ? [node]
      : Array.from(node.querySelectorAll("video, audio"));

    mediaElements.forEach((el) => {
      el.disablePictureInPicture = true;
      el.disableRemotePlayback = true;
      if (el.controlsList && !el.hasAttribute("controls")) {
        try {
          el.controlsList.add("nodownload", "nofullscreen", "noremoteplayback");
        } catch {
          // ignore DOM token list errors
        }
      }
      if (el.shadowRoot) {
        try {
          el.shadowRoot.innerHTML = "";
        } catch {
          // ignore closed shadow-root or read-only errors
        }
      }
    });
  };

  const removeVSC = () => {
    document
      .querySelectorAll("vsc-controller, .vsc-controller, [id*='vsc-controller']")
      .forEach((el) => {
        try {
          el.remove();
        } catch {
          // ignore removal errors
        }
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      sanitizeMedia(document.body);
      removeVSC();
    });
  } else {
    sanitizeMedia(document.body);
    removeVSC();
  }

  const observer = new MutationObserver((mutations) => {
    removeVSC();
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === 1) {
          sanitizeMedia(addedNode);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
