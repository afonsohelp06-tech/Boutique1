/**
 * AZAVISION — Bandeau cookies RGPD (Portugal / UE)
 */
(function initCookieConsent() {
    const CONSENT_KEY = 'azavision_cookie_consent';

    if (localStorage.getItem(CONSENT_KEY)) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 z-[100] bg-neutral-950/95 backdrop-blur border-t border-neutral-800 p-4 md:p-6';
    banner.innerHTML = `
        <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
            <div class="flex-1">
                <p class="text-xs font-semibold text-white uppercase tracking-wider mb-1">Utilização de Cookies</p>
                <p class="text-[11px] text-neutral-400 leading-relaxed">
                    Utilizamos cookies essenciais e analíticos para melhorar a sua experiência.
                    Ao continuar, aceita a nossa
                    <a href="politica-privacidade.html" class="text-luxury-gold underline hover:no-underline">Política de Privacidade</a>
                    em conformidade com o RGPD.
                </p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button id="cookie-reject" class="px-4 py-2 text-[10px] uppercase font-bold tracking-wider border border-neutral-600 text-neutral-400 hover:text-white rounded-lg transition">
                    Recusar
                </button>
                <button id="cookie-accept" class="px-5 py-2 text-[10px] uppercase font-bold tracking-wider bg-luxury-gold text-neutral-950 hover:bg-white rounded-lg transition">
                    Aceitar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').onclick = () => {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        banner.remove();
    };
    document.getElementById('cookie-reject').onclick = () => {
        localStorage.setItem(CONSENT_KEY, 'rejected');
        banner.remove();
    };
})();
