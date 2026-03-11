import chatDingSound from '../assets/sound/chat-ding-2.mp3';

const PROVIDER_GLOBAL_KEY = import.meta.env.VITE_PROVIDER_GLOBAL_KEY;
const SCRIPT_SRC = `https://www.${PROVIDER_GLOBAL_KEY}.co/embed.min.js`;

const SELECTORS = (() => {
  const k = PROVIDER_GLOBAL_KEY;
  return {
    injectedDom: [
      `[id^="${k}"]`,
      `[class*="${k}"]`,
      `iframe[src*="${k}"]`,
    ].join(", "),
  };
})();

const SCRIPT_MARKER_ATTR = "data-chat-widget-script";
const SCRIPT_MARKER_VALUE = "true";

function getProvider() {
  return window[PROVIDER_GLOBAL_KEY];
}

function setProvider(value) {
  window[PROVIDER_GLOBAL_KEY] = value;
}

function getManagedScript(scriptId) {
  return document.querySelector(
    `script[${SCRIPT_MARKER_ATTR}="${SCRIPT_MARKER_VALUE}"][data-chat-widget-id="${scriptId}"]`
  );
}

export function createChatWidget({
  scriptId,
  domain = `www.${PROVIDER_GLOBAL_KEY}.co`,
  defaultConfig = {},
  removeInjectedDomOnDestroy = false,
  playOnlyWhenMinimized = true, // Toggle: play sound only when widget is not expanded
} = {}) {
  if (!scriptId) throw new Error("createChatWidget: scriptId is required");

  let initialized = false;
  let config = { ...defaultConfig };
  let audioInstance = null;
  let soundListenerAttached = false;

  function safeCall(method, ...args) {
    const provider = getProvider();
    if (!provider) return;
    try {
      return provider(method, ...args);
    } catch (_) {
      return;
    }
  }

  function initSoundNotification() {
    console.log('[ChatWidget] initSoundNotification called');
    const provider = getProvider();
    console.log('[ChatWidget] Provider:', provider);
    console.log('[ChatWidget] Provider has addEventListener:', typeof provider?.addEventListener === 'function');
    
    // Check if provider is actually initialized, not just the queued proxy
    const state = safeCall("getState");
    console.log('[ChatWidget] Provider state:', state);
    
    if (!provider || typeof provider.addEventListener !== "function") {
      console.warn('[ChatWidget] Cannot init sound - provider not ready or no addEventListener');
      return;
    }
    
    // If the provider isn't fully initialized yet, retry later
    if (state !== "initialized") {
      console.log('[ChatWidget] Provider not fully initialized yet, retrying in 1000ms...');
      setTimeout(() => initSoundNotification(), 1000);
      return;
    }

    // Avoid attaching multiple listeners if init is called more than once
    if (soundListenerAttached) {
      console.log('[ChatWidget] Sound listener already attached, skipping');
      return;
    }
    soundListenerAttached = true;
    console.log('[ChatWidget] Attaching sound listener...');

    if (!audioInstance) {
      console.log('[ChatWidget] Creating new Audio instance with source:', chatDingSound);
      audioInstance = new Audio(chatDingSound);
      console.log('[ChatWidget] Audio instance created:', audioInstance);
    } else {
      console.log('[ChatWidget] Audio instance already exists');
    }

    try {
      // Add state change listener to track widget open/close
      console.log('[ChatWidget-State] Adding state change listener');
      provider.addEventListener("stateChange", (state) => {
        console.log('[ChatWidget-State] Widget state changed to:', state);
        console.log('[ChatWidget-State] Is minimized:', state !== "open");
      });
      
      // Try alternate event names in case stateChange doesn't exist
      provider.addEventListener("open", () => {
        console.log('[ChatWidget-State] OPEN event fired');
      });
      
      provider.addEventListener("close", () => {
        console.log('[ChatWidget-State] CLOSE event fired');
      });
      
      // Log initial state
      console.log('[ChatWidget-State] Initial state:', safeCall("getState"));

      console.log('[ChatWidget] Adding assistant-message event listener');
      provider.addEventListener("assistant-message", () => {
        console.log('[ChatWidget] assistant-message event fired!');
        if (!audioInstance) {
          console.warn('[ChatWidget] audioInstance is null, cannot play sound');
          return;
        }
        
        // Check if widget is expanded (visible)
        const isOpen = safeCall("getState") === "open";
        console.log('[ChatWidget-State] Checking widget state on message...');
        console.log('[ChatWidget-State] Current state:', safeCall("getState"));
        console.log('[ChatWidget-State] Is widget open:', isOpen);
        console.log('[ChatWidget-State] Is minimized:', !isOpen);
        console.log('[ChatWidget] playOnlyWhenMinimized flag:', playOnlyWhenMinimized);
        
        // If playOnlyWhenMinimized is enabled and widget is open, don't play sound
        if (playOnlyWhenMinimized && isOpen) {
          console.log('[ChatWidget] Widget is visible, skipping sound');
          return;
        }
        
        // Allow rapid consecutive dings
        console.log('[ChatWidget] Attempting to play sound...');
        audioInstance.currentTime = 0;
        audioInstance.play()
          .then(() => {
            console.log('[ChatWidget] Sound played successfully!');
          })
          .catch((err) => {
            console.error('[ChatWidget] Could not play chat ding sound:', err);
          });
      });
      console.log('[ChatWidget] Event listener attached successfully');
    } catch (err) {
      console.error('[ChatWidget] Could not attach sound notification:', err);
    }
  }

  function ensureBootstrap() {
    const provider = getProvider();
    if (typeof provider === "function") {
      const state = safeCall("getState");
      if (state === "initialized") return;
    }

    const queued = (...args) => {
      if (!queued.q) queued.q = [];
      queued.q.push(args);
    };

    const proxied = new Proxy(queued, {
      get(target, prop) {
        if (prop === "q") return target.q;
        return (...args) => target(prop, ...args);
      },
    });

    setProvider(proxied);
  }

  function ensureScript() {
    console.log('[ChatWidget] ensureScript called, scriptId:', scriptId);
    if (getManagedScript(scriptId)) {
      console.log('[ChatWidget] Script already present, scheduling sound init');
      // Script already present, just try to attach sound listener
      setTimeout(() => {
        initSoundNotification();
      }, 500);
      return;
    }

    // Some providers may inject DOM nodes using the same id as the chatbot/script id.
    // If that stale node survives route transitions, it can block script reinjection.
    const sameIdNode = document.getElementById(scriptId);
    if (sameIdNode && sameIdNode.tagName !== "SCRIPT") {
      console.log('[ChatWidget] Removing stale non-script node with scriptId:', sameIdNode);
      sameIdNode.remove();
    }
    console.log('[ChatWidget] Creating new script element');

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.id = scriptId;
    script.setAttribute(SCRIPT_MARKER_ATTR, SCRIPT_MARKER_VALUE);
    script.setAttribute("data-chat-widget-id", scriptId);

    // Keep compatible with the official embed and DOM attribute reads:
    script.domain = domain;
    script.setAttribute("data-domain", domain);

    script.onload = () => {
      console.log('[ChatWidget] Script loaded successfully, scheduling sound init');
      // Wait a bit for the provider to fully initialize before attaching sound listener
      setTimeout(() => {
        initSoundNotification();
      }, 500);
    };

    console.log('[ChatWidget] Appending script to document body');
    document.body.appendChild(script);
  }

  function applyConfig(nextConfig) {
    if (nextConfig && typeof nextConfig === "object") {
      config = { ...config, ...nextConfig };
    }
  }

  return {
    init(nextConfig) {
      console.log('[ChatWidget] init called, initialized:', initialized, 'config:', nextConfig);
      if (!initialized) {
        ensureBootstrap();
        ensureScript();
        initialized = true;
      }
      if (nextConfig) applyConfig(nextConfig);
    },

    configure(nextConfig) {
      applyConfig(nextConfig);
    },

    open() {
      safeCall("open");
    },

    close() {
      safeCall("close");
    },

    isInitialized() {
      return safeCall("getState") === "initialized";
    },

    destroy({
      removeScript = true,
      removeDom = removeInjectedDomOnDestroy,
      resetGlobal = false,
    } = {}) {
      safeCall("close");

      if (removeScript) {
        getManagedScript(scriptId)?.remove();
      }

      if (removeDom) {
        document
          .querySelectorAll(SELECTORS.injectedDom)
          .forEach((n) => n.remove());

        const sameIdNode = document.getElementById(scriptId);
        if (sameIdNode && sameIdNode.tagName !== "SCRIPT") {
          sameIdNode.remove();
        }
      }

      if (resetGlobal) {
        try {
          delete window[PROVIDER_GLOBAL_KEY];
        } catch (_) {}
      }

      initialized = false;
      // Optional: stop and release audio
      if (audioInstance) {
        audioInstance.pause();
        audioInstance = null;
      }
      soundListenerAttached = false;
    },
  };
}
