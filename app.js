/**
 * AZAVISION — Application boutique (catalogue, panier, checkout)
 */

window.onload = function () {
    initConfig();
    DemoStore.init();
    initHeroCanvas();
    initHeaderScroll();
    loadCartFromLocalStorage();
    loadWishlistFromStorage();
    updateCartCounter();
    updateModeBadge();
    handleStripeReturn();
    fetchEnterpriseConfig();
};

function fetchEnterpriseConfig() {
    AzavisionAPI.getConfig()
        .then(result => {
            if (result.status === 'success' && result.config) {
                const cfg = result.config;
                CONFIG.brand_name = cfg["Nom de l'enseigne"] || CONFIG.brand_name;
                CONFIG.contact_email = cfg["E-mail de contact client"] || CONFIG.contact_email;
                CONFIG.free_shipping_threshold = parseFloat(String(cfg["Seuil livraison gratuite (€)"]).replace(/[^\d.]/g, '')) || CONFIG.free_shipping_threshold;
                CONFIG.company_nif = cfg["NIF Entreprise (Portugal)"] || cfg["Livro Reclamações — NIPC"] || CONFIG.company_nif;
                CONFIG.stripe_public_key = cfg["Stripe — Clé publique (pk_...)"] || '';
                CONFIG.eupago_enabled = String(cfg["Eupago — Activé (oui/non)"]).toLowerCase() === 'oui';
                CONFIG.moloni_enabled = String(cfg["Moloni — Activé (oui/non)"]).toLowerCase() === 'oui';
                if (cfg["TVA applicable (%)"]) {
                    CONFIG.tva = parseFloat(String(cfg["TVA applicable (%)"]).replace('%', '')) || 23;
                }
                document.getElementById('brand-title').textContent = CONFIG.brand_name;
                document.getElementById('footer-brand').textContent = CONFIG.brand_name;
                document.getElementById('brand-copyright').textContent = CONFIG.brand_name;
                document.getElementById('footer-address').innerHTML = 'Lisboa, Portugal<br>Suporte: ' + CONFIG.contact_email;
                document.getElementById('delivery-info').textContent = 'Grátis a partir de ' + CONFIG.free_shipping_threshold.toFixed(0) + '€.';
                document.getElementById('tva-display').textContent = CONFIG.tva + '%';
                document.querySelectorAll('.tva-rate-label').forEach(el => el.textContent = CONFIG.tva);
            }
        })
        .catch(err => {
            console.warn('Config:', err);
            loadProductsFromSheet();
        })
        .finally(() => {
            loadProductsFromSheet();
            updateLegalFooter();
            updateModeBadge();
        });
}

function updateLegalFooter() {
    const nipc = CONFIG.company_nif || '999999999';
    const livroLink = document.getElementById('livro-reclamacoes-link');
    if (livroLink) {
        livroLink.href = 'https://www.livroreclamacoes.pt/inicio/reclamacao?nipc=' + nipc;
    }
    const nifDisplay = document.getElementById('footer-nif');
    if (nifDisplay) nifDisplay.textContent = 'NIF: ' + nipc;
}

function loadCartFromLocalStorage() {
    const saved = localStorage.getItem('azavision_cart');
    if (saved) { try { APP_STATE.cart = JSON.parse(saved); } catch (e) { APP_STATE.cart = []; } }
}

function saveCartToLocalStorage() {
    localStorage.setItem('azavision_cart', JSON.stringify(APP_STATE.cart));
}

function loadWishlistFromStorage() {
    const saved = localStorage.getItem('azavision_wishlist');
    if (saved) { try { APP_STATE.wishlist = JSON.parse(saved); } catch (e) { APP_STATE.wishlist = []; } }
    updateWishlistCounter();
}

function saveWishlistToStorage() {
    localStorage.setItem('azavision_wishlist', JSON.stringify(APP_STATE.wishlist));
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    const icon = document.getElementById('toast-icon');
    if (isError) {
        icon.className = 'fa-solid fa-triangle-exclamation text-sm';
        toast.classList.replace('border-luxury-gold', 'border-red-500');
    } else {
        icon.className = 'fa-solid fa-check text-sm';
        toast.classList.replace('border-red-500', 'border-luxury-gold');
    }
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    setTimeout(hideToast, 4000);
}

function hideToast() {
    document.getElementById('toast').classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
}

function loadProductsFromSheet() {
    const loading = document.getElementById('products-loading');
    const grid = document.getElementById('products-grid');
    if (loading) loading.classList.remove('hidden');
    if (grid) grid.classList.add('hidden');

    AzavisionAPI.getProducts()
        .then(result => {
            if (result.status === 'success' && result.data) {
                APP_STATE.products = result.data;
            } else {
                APP_STATE.products = DemoStore.getProducts();
            }
            renderCatalog();
        })
        .catch(() => {
            APP_STATE.products = DemoStore.getProducts();
            renderCatalog();
        })
        .finally(() => {
            if (loading) loading.classList.add('hidden');
            if (grid) grid.classList.remove('hidden');
        });
}

function handleOrderSuccess(orderId, ivaAmount) {
    closeCheckout();
    APP_STATE.cart = [];
    saveCartToLocalStorage();
    updateCartCounter();
    loadProductsFromSheet();
    document.getElementById('suivi').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('track-id-input').value = orderId;
    showToast('Encomenda confirmada!', 'Ref. ' + orderId + ' | IVA: ' + ivaAmount + '€');
    trackOrder();
}

function trackOrder() {
    const trackId = document.getElementById('track-id-input').value.trim().toUpperCase();
    const resultDiv = document.getElementById('tracking-result');
    if (!trackId) { showToast('Erro', 'Introduza o número de encomenda.', true); return; }

    resultDiv.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-gold mb-2"></div><p class="text-[10px] uppercase text-neutral-400">A pesquisar...</p></div>';
    resultDiv.classList.remove('hidden');

    AzavisionAPI.getOrders()
        .then(result => {
            const order = result.orders?.find(o => String(o.id_commande).toUpperCase() === trackId);
            if (order) displayTrackingDetails(order);
            else resultDiv.innerHTML = '<div class="p-4 bg-red-950/20 border border-red-900 rounded-lg text-center"><p class="text-xs font-semibold">Referência não encontrada</p><p class="text-[10px] text-neutral-400 mt-1">Ex: AZ-852104 (demo)</p></div>';
        })
        .catch(() => displayFakeTracking(trackId));
}

function displayFakeTracking(trackId) {
    document.getElementById('tracking-result').innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center bg-neutral-950 p-4 rounded-lg">
                <div><p class="text-[10px] text-neutral-400 uppercase">Referência</p><p class="text-xs font-bold text-luxury-gold">${trackId}</p></div>
                <div class="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase rounded">Preparação</div>
            </div>
        </div>`;
}

function displayTrackingDetails(order) {
    let statusColor = 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
    if (order.statut === 'Expédié' || order.statut === 'Payé') statusColor = 'bg-green-500/20 text-green-500 border border-green-500/30';
    document.getElementById('tracking-result').innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center bg-neutral-950 p-4 rounded-lg">
                <div><p class="text-[10px] text-neutral-400 uppercase">Referência</p><p class="text-xs font-bold text-luxury-gold">${order.id_commande}</p></div>
                <div class="px-3 py-1 text-[10px] font-bold uppercase rounded ${statusColor}">${order.statut}</div>
            </div>
            <div class="text-xs space-y-1 bg-neutral-950 p-4 rounded-lg">
                <p><strong class="text-neutral-400">Destinatário:</strong> ${order.prenom} ${order.nom}</p>
                <p><strong class="text-neutral-400">NIF:</strong> ${order.nif || '—'}</p>
                <p><strong class="text-neutral-400">Data:</strong> ${order.date}</p>
                <p><strong class="text-neutral-400">Artigos:</strong> ${order.articles}</p>
                <p><strong class="text-neutral-400">Total (IVA incl.):</strong> ${parseFloat(order.total).toFixed(2)} €</p>
                ${order.iva ? '<p><strong class="text-neutral-400">IVA (' + CONFIG.tva + '%):</strong> ' + parseFloat(order.iva).toFixed(2) + ' €</p>' : ''}
                <p><strong class="text-neutral-400">Pagamento:</strong> ${order.paiement || '—'}</p>
            </div>
        </div>`;
}

function renderCatalog() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    let list = APP_STATE.products.filter(p => {
        const matchCat = APP_STATE.activeCategory === 'all' || p.categorie === APP_STATE.activeCategory;
        const matchSearch = p.nom.toLowerCase().includes(APP_STATE.searchQuery.toLowerCase()) || p.id.toLowerCase().includes(APP_STATE.searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });
    if (APP_STATE.priceSort === 'low-to-high') list.sort((a, b) => a.prix - b.prix);
    else if (APP_STATE.priceSort === 'high-to-low') list.sort((a, b) => b.prix - a.prix);

    if (list.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-xs text-neutral-500 uppercase">Nenhum artigo encontrado.</p></div>';
        return;
    }

    list.forEach(product => {
        const out = parseInt(product.stock) <= 0;
        const card = document.createElement('div');
        card.className = 'group flex flex-col bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300';
        card.innerHTML = `
            <div class="relative bg-neutral-100 aspect-[4/5] overflow-hidden cursor-pointer" onclick="openQuickView('${product.id}')">
                <img src="${product.image}" alt="${product.nom}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://placehold.co/400x500/1c1c1c/C5A880?text=Azavision'">
                ${out ? '<div class="absolute inset-0 bg-neutral-900/70 flex items-center justify-center text-white text-[10px] font-bold uppercase">Esgotado</div>' : ''}
                <button onclick="event.stopPropagation();toggleWishlistItem('${product.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                    <i class="fa-${APP_STATE.wishlist.includes(product.id) ? 'solid text-red-500' : 'regular'} fa-heart text-xs"></i>
                </button>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-[9px] font-bold uppercase text-luxury-gold-dark">${product.categorie}</span>
                    <h3 class="font-serif text-sm font-bold uppercase line-clamp-2 cursor-pointer" onclick="openQuickView('${product.id}')">${product.nom}</h3>
                    <p class="text-[10px] text-neutral-400 mt-1">IVA ${CONFIG.tva}% incl.</p>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                    <span class="text-sm font-bold">${parseFloat(product.prix).toFixed(2)} €</span>
                    <button ${out ? 'disabled' : ''} onclick="quickAddToCart('${product.id}')" class="w-8 h-8 rounded-full border hover:bg-neutral-950 hover:text-white flex items-center justify-center disabled:opacity-30"><i class="fa-solid fa-plus text-xs"></i></button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function filterCategory(cat) {
    APP_STATE.activeCategory = cat;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.className = 'category-btn px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-md bg-white text-neutral-600 border border-neutral-200 transition-all duration-300';
    });
    const active = document.getElementById('btn-filter-' + cat);
    if (active) active.className = 'category-btn px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-md bg-neutral-900 text-white transition-all duration-300';
    renderCatalog();
}

function searchProducts() {
    APP_STATE.searchQuery = document.getElementById('catalog-search').value;
    renderCatalog();
}

function sortProducts() {
    APP_STATE.priceSort = document.getElementById('price-sort').value;
    renderCatalog();
}

function openQuickView(id) {
    const p = APP_STATE.products.find(x => x.id === id);
    if (!p) return;
    APP_STATE.selectedProduct = p;
    document.getElementById('qv-title').textContent = p.nom;
    document.getElementById('qv-price').textContent = parseFloat(p.prix).toFixed(2) + ' € (IVA ' + CONFIG.tva + '% incl.)';
    document.getElementById('qv-desc').textContent = p.description || '';
    document.getElementById('qv-category').textContent = p.categorie;
    document.getElementById('qv-img').src = p.image;
    const btn = document.getElementById('qv-add-to-cart-btn');
    const out = parseInt(p.stock) <= 0;
    btn.disabled = out;
    btn.innerHTML = out ? '<i class="fa-solid fa-ban"></i> Esgotado' : '<i class="fa-solid fa-cart-plus"></i> Adicionar ao carrinho';
    document.getElementById('quickview-modal').classList.remove('hidden');
}

function closeQuickView() {
    document.getElementById('quickview-modal').classList.add('hidden');
    APP_STATE.selectedProduct = null;
}

function selectSize(size) {
    APP_STATE.selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.className = btn.textContent === size
            ? 'size-btn px-3 py-1.5 text-xs font-semibold rounded border border-neutral-900 bg-neutral-900 text-white'
            : 'size-btn px-3 py-1.5 text-xs font-semibold rounded border border-neutral-300 bg-white text-neutral-800';
    });
}

function quickAddToCart(id) {
    const p = APP_STATE.products.find(x => x.id === id);
    if (p) addProductToCartList(p, 'S');
}

function addCurrentToCart() {
    if (APP_STATE.selectedProduct) {
        addProductToCartList(APP_STATE.selectedProduct, APP_STATE.selectedSize);
        closeQuickView();
    }
}

function addProductToCartList(product, size) {
    const existing = APP_STATE.cart.find(i => i.id === product.id && i.size === size);
    if (existing) existing.quantity++;
    else APP_STATE.cart.push({ id: product.id, name: product.nom, price: parseFloat(product.prix), image: product.image, size, quantity: 1 });
    saveCartToLocalStorage();
    updateCartCounter();
    showToast('Carrinho atualizado', product.nom + ' adicionado.');
}

function removeCartItem(index) {
    APP_STATE.cart.splice(index, 1);
    saveCartToLocalStorage();
    updateCartCounter();
    renderCartSidebar();
}

function updateCartCounter() {
    document.getElementById('cart-counter').textContent = APP_STATE.cart.reduce((s, i) => s + i.quantity, 0);
}

function calculateCartTotal() {
    const sub = APP_STATE.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const disc = APP_STATE.appliedPromo ? sub * (APP_STATE.appliedPromo.discount / 100) : 0;
    return (sub - disc).toFixed(2);
}

function toggleCart() {
    const s = document.getElementById('cart-sidebar');
    s.classList.toggle('hidden');
    if (!s.classList.contains('hidden')) renderCartSidebar();
}

function renderCartSidebar() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    const subtotal = parseFloat(calculateCartTotal());
    const shipping = subtotal >= CONFIG.free_shipping_threshold ? 0 : CONFIG.shipping_cost;
    const totalTTC = subtotal + shipping;
    const iva = calculateIVA(totalTTC);

    if (APP_STATE.cart.length === 0) {
        container.innerHTML = '<div class="text-center py-20 text-neutral-400"><p class="text-xs uppercase">Carrinho vazio</p></div>';
        document.getElementById('cart-subtotal').textContent = '0.00 €';
        document.getElementById('cart-iva').textContent = '0.00 €';
        document.getElementById('cart-total').textContent = '0.00 €';
        return;
    }

    APP_STATE.cart.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-4 py-4 border-b border-neutral-100';
        div.innerHTML = `
            <img src="${item.image}" class="w-16 h-20 object-cover rounded" onerror="this.src='https://placehold.co/100x120/1c1c1c/C5A880?text=A'">
            <div class="flex-1">
                <h4 class="text-xs font-bold uppercase line-clamp-1">${item.name}</h4>
                <p class="text-[10px] text-neutral-400">Tam. ${item.size} | Qtd. ${item.quantity}</p>
                <p class="text-xs font-semibold mt-1">${(item.price * item.quantity).toFixed(2)} €</p>
            </div>
            <button onclick="removeCartItem(${i})" class="text-neutral-400 hover:text-red-500"><i class="fa-solid fa-trash-can text-xs"></i></button>`;
        container.appendChild(div);
    });

    document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2) + ' €';
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Grátis' : shipping.toFixed(2) + ' €';
    document.getElementById('cart-iva').textContent = iva + ' €';
    document.getElementById('cart-total').textContent = totalTTC.toFixed(2) + ' €';
}

function applyPromoCode() {
    const code = (document.getElementById('promo-code-input')?.value || '').trim().toUpperCase();
    if (PROMO_CODES[code]) {
        APP_STATE.appliedPromo = { code, discount: PROMO_CODES[code] };
        showToast('Código aplicado', '-' + PROMO_CODES[code] + '%');
        renderCartSidebar();
    } else showToast('Código inválido', '', true);
}

function openCheckout() {
    if (APP_STATE.cart.length === 0) { showToast('Carrinho vazio', '', true); return; }
    toggleCart();
    goToCheckoutStep(1);
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

function goToCheckoutStep(step) {
    ['checkout-step-1', 'checkout-step-2', 'checkout-step-3'].forEach((id, i) => {
        document.getElementById(id).classList.toggle('hidden', step !== i + 1);
        const tab = document.getElementById('step-tab-' + (i + 1));
        if (tab) tab.className = 'checkout-step-tab flex-1 text-center font-semibold text-xs uppercase tracking-wider ' + (step === i + 1 ? 'text-luxury-gold' : 'text-neutral-400');
    });

    if (step === 2) {
        const p = validateCheckoutForm();
        if (!p) { goToCheckoutStep(1); return; }
        document.getElementById('summary-name').textContent = p.firstname + ' ' + p.lastname;
        document.getElementById('summary-nif').textContent = p.nif;
        document.getElementById('summary-address').textContent = p.address;
        document.getElementById('summary-email').textContent = p.email;
        const total = getOrderTotalWithShipping();
        document.getElementById('summary-total').textContent = total + ' €';
        document.getElementById('summary-iva').textContent = calculateIVA(total) + ' € (IVA ' + CONFIG.tva + '%)';
    }

    if (step === 3) {
        const p = validateCheckoutForm();
        if (!p) { goToCheckoutStep(1); return; }
        document.getElementById('pay-amount').textContent = getOrderTotalWithShipping() + ' €';
        selectPaymentMethod('stripe');
    }
}

function toggleWishlistItem(id) {
    const idx = APP_STATE.wishlist.indexOf(id);
    if (idx > -1) APP_STATE.wishlist.splice(idx, 1);
    else APP_STATE.wishlist.push(id);
    saveWishlistToStorage();
    updateWishlistCounter();
    renderCatalog();
}

function toggleWishlist() {
    const m = document.getElementById('wishlist-modal');
    m.classList.toggle('hidden');
    if (!m.classList.contains('hidden')) renderWishlist();
}

function updateWishlistCounter() {
    const b = document.getElementById('wishlist-counter-badge');
    if (b) { b.textContent = APP_STATE.wishlist.length; b.style.display = APP_STATE.wishlist.length ? 'flex' : 'none'; }
}

function renderWishlist() {
    const c = document.getElementById('wishlist-items-container');
    if (!APP_STATE.wishlist.length) { c.innerHTML = '<div class="text-center py-20 text-neutral-400"><p class="text-xs uppercase">Lista vazia</p></div>'; return; }
    c.innerHTML = '';
    APP_STATE.wishlist.map(id => APP_STATE.products.find(p => p.id === id)).filter(Boolean).forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-4 py-4 border-b';
        div.innerHTML = `<img src="${item.image}" class="w-16 h-20 object-cover rounded"><div class="flex-1"><h4 class="text-xs font-bold uppercase">${item.nom}</h4><p class="text-xs text-luxury-gold">${item.prix} €</p></div><button onclick="quickAddToCart('${item.id}')" class="text-[10px] px-3 py-1.5 bg-neutral-900 text-white rounded uppercase">Adicionar</button>`;
        c.appendChild(div);
    });
}

function subscribeNewsletter() {
    const email = document.getElementById('newsletter-email').value.trim();
    if (!email.includes('@')) { showToast('E-mail inválido', '', true); return; }
    showToast('Subscrição confirmada', email);
    document.getElementById('newsletter-email').value = '';
}

let canvas, ctx, points = [], mouse = { x: null, y: null };

function initHeroCanvas() {
    canvas = document.getElementById('hero-motion-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (points.length === 0) {
            points = Array.from({ length: 35 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            }));
        }
    };
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    (function animate() {
        if (!ctx || !canvas) return;
        ctx.fillStyle = 'rgba(15, 15, 15, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(197, 168, 128, 0.08)';
        ctx.lineWidth = 0.5;

        points.forEach((p1, i) => {
            p1.x += p1.vx;
            p1.y += p1.vy;
            if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
            if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

            if (mouse.x !== null) {
                const dx = mouse.x - p1.x;
                const dy = mouse.y - p1.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 120) {
                    p1.x -= dx * 0.02;
                    p1.y -= dy * 0.02;
                }
            }

            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(197, 168, 128, 0.3)';
            ctx.fill();

            for (let j = i + 1; j < points.length; j++) {
                const p2 = points[j];
                const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (d < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    })();
}

function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.classList.add('shadow-lg', 'bg-neutral-950');
            header.classList.remove('bg-neutral-900/95');
        } else {
            header.classList.remove('shadow-lg', 'bg-neutral-950');
            header.classList.add('bg-neutral-900/95');
        }
    });
}
