import { useEffect, useState } from 'react';
import logoImg from '../../assets/53ef4314c936ceb2d472946a347e2bbb419189ab.png';
import { Download, X, Share } from 'lucide-react';

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // 1. Inject Manifest dynamically using a Blob
    const manifest = {
      name: "Nivah - Gestão de Igrejas",
      short_name: "Nivah",
      description: "Sistema minimalista para gestão de igrejas e ministérios",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0000FF",
      icons: [
        {
          src: logoImg,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: logoImg,
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestURL);

    // 2. Inject meta tags for mobile (iOS)
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      themeColorMeta.setAttribute('content', '#0000FF');
      document.head.appendChild(themeColorMeta);
    }

    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', logoImg);

    let webAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!webAppCapable) {
      webAppCapable = document.createElement('meta');
      webAppCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      webAppCapable.setAttribute('content', 'yes');
      document.head.appendChild(webAppCapable);
    }
    
    let webAppStatusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!webAppStatusBarStyle) {
      webAppStatusBarStyle = document.createElement('meta');
      webAppStatusBarStyle.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      webAppStatusBarStyle.setAttribute('content', 'default');
      document.head.appendChild(webAppStatusBarStyle);
    }

    // 3. Register Service Worker from /public/sw.js
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    // 4. Handle "Add to Home Screen" prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect iOS Safari to show manual instructions (Apple doesn't support beforeinstallprompt)
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Detects if device is in standalone mode (already installed)
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    // Show manual prompt for iOS if not already installed
    if (isIos() && !isInStandaloneMode()) {
      // Only show after a small delay so it's not too aggressive
      const timer = setTimeout(() => {
        // Check if user previously dismissed it
        const hasDismissed = localStorage.getItem('ios_pwa_prompt_dismissed');
        if (!hasDismissed) {
          setShowIosPrompt(true);
        }
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        URL.revokeObjectURL(manifestURL);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };
  
  const dismissIosPrompt = () => {
    setShowIosPrompt(false);
    localStorage.setItem('ios_pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Android/Desktop Install Button */}
      {showInstallBtn && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-[#0000FF] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#0000CC] transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Instalar App
          </button>
        </div>
      )}

      {/* iOS Manual Install Instructions Popup */}
      {showIosPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-card border border-border shadow-xl rounded-xl p-4 flex flex-col gap-3 relative">
            <button 
              onClick={dismissIosPrompt}
              className="absolute top-2 right-2 text-muted-foreground hover:bg-accent p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3 pt-1">
              <img src={logoImg} alt="Nivah" className="w-10 h-10 object-contain bg-primary/10 rounded-lg p-1 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Instalar Nivah</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Para uma melhor experiência, adicione este app à sua Tela de Início.
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs font-medium bg-accent p-2 rounded-md">
                  <span>Toque em</span>
                  <Share className="w-4 h-4 text-blue-500" />
                  <span>e depois <strong>"Adicionar à Tela de Início"</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}