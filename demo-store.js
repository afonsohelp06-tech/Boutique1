/**
 * AZAVISION — Base de données locale (localStorage)
 * Fonctionne sans Google Sheets : boutique + admin synchronisés sur le même navigateur.
 */
const DemoStore = (function () {
    const KEYS = {
        products: 'azavision_products',
        orders: 'azavision_orders',
        config: 'azavision_config',
        promos: 'azavision_promo_codes',
        accounts: 'azavision_accounts',
        initialized: 'azavision_store_initialized'
    };

    const DEFAULT_ACCOUNTS = [
        {
            id: 'CLI-DEMO01',
            email: 'joao@email.pt',
            passwordHash: (function () {
                const raw = 'joao@email.pt|' + 'demo123';
                let h = 2166136261;
                for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619); }
                return 'azv1_' + (h >>> 0).toString(16);
            })(),
            prenom: 'João',
            nom: 'Silva',
            nif: '123456789',
            telefone: '912345678',
            adresse: 'Rua Augusta 10, 1100-053 Lisboa',
            createdAt: new Date().toISOString(),
            active: true,
            rgpdConsent: true
        }
    ];

    const DEFAULT_PRODUCTS = [
        { id: 'P001', nom: 'Manteau croisé en laine cachemire', categorie: 'hommes', prix: 349.00, description: 'Manteau luxueux en laine vierge cachemire.', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop', stock: 12 },
        { id: 'P002', nom: 'Robe de soie minimaliste', categorie: 'femmes', prix: 289.00, description: 'Robe longue fluide 100% soie sauvage.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop', stock: 5 },
        { id: 'P003', nom: 'Polo couture beige sable', categorie: 'hommes', prix: 110.00, description: 'Polo tissé en coton biologique.', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop', stock: 24 },
        { id: 'P004', nom: 'Sac cabas cuir grainé', categorie: 'accessoires', prix: 420.00, description: 'Cuir d\'Italie pleine fleur.', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop', stock: 3 }
    ];

    const DEFAULT_ORDERS = [
        { id_commande: 'AZ-852104', date: '29/05/2026 14:32', prenom: 'João', nom: 'Silva', email: 'joao@email.pt', nif: '123456789', adresse: 'Rua Augusta 10, Lisboa', articles: '1x Polo couture beige sable (S)', total: 135.30, iva: 25.30, statut: 'En attente', paiement: '—' },
        { id_commande: 'AZ-931145', date: '28/05/2026 09:12', prenom: 'Maria', nom: 'Santos', email: 'maria@email.pt', nif: '987654321', adresse: 'Av. da Liberdade 3, Lisboa', articles: '1x Robe de soie minimaliste (M)', total: 355.17, iva: 66.47, statut: 'Expédié', paiement: 'MB Way' }
    ];

    const DEFAULT_CONFIG = {
        "Nom de l'enseigne": 'Azavision',
        "E-mail de contact client": 'contact@azavision.pt',
        "TVA applicable (%)": '23.00%',
        "Seuil livraison gratuite (€)": '150.00 €',
        "NIF Entreprise (Portugal)": '999999999',
        "Stripe — Clé publique (pk_...)": '',
        "Eupago — Activé (oui/non)": 'non',
        "Moloni — Activé (oui/non)": 'non'
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function write(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function init() {
        if (localStorage.getItem(KEYS.initialized)) return;
        write(KEYS.products, DEFAULT_PRODUCTS);
        write(KEYS.orders, DEFAULT_ORDERS);
        write(KEYS.config, DEFAULT_CONFIG);
        write(KEYS.promos, [
            { code: 'AZA10', type: 'percent', value: 10, uses: 0, maxUses: 0, active: true },
            { code: 'LISBOA20', type: 'percent', value: 20, uses: 0, maxUses: 50, active: true }
        ]);
        write(KEYS.accounts, DEFAULT_ACCOUNTS);
        localStorage.setItem(KEYS.initialized, '1');
    }

    function getAccounts() {
        init();
        const list = read(KEYS.accounts, null);
        if (!list || !list.length) {
            write(KEYS.accounts, DEFAULT_ACCOUNTS);
            return DEFAULT_ACCOUNTS.slice();
        }
        return list;
    }

    function saveAccounts(list) {
        write(KEYS.accounts, list);
    }

    function registerAccount(data) {
        const accounts = getAccounts();
        const email = String(data.email || '').trim().toLowerCase();
        if (accounts.some(a => String(a.email).toLowerCase() === email)) {
            return { status: 'error', message: 'E-mail déjà utilisé' };
        }
        const raw = email + '|' + String(data.password || '');
        let h = 2166136261;
        for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619); }
        const account = {
            id: 'CLI-' + Date.now().toString().slice(-8),
            email: email,
            passwordHash: 'azv1_' + (h >>> 0).toString(16),
            prenom: data.prenom,
            nom: data.nom,
            nif: data.nif,
            telefone: data.telefone || '',
            adresse: data.adresse,
            createdAt: new Date().toISOString(),
            active: true,
            rgpdConsent: true
        };
        accounts.push(account);
        saveAccounts(accounts);
        const { passwordHash, ...safe } = account;
        return { status: 'success', account: safe };
    }

    function loginAccount(email, password) {
        const em = String(email || '').trim().toLowerCase();
        const accounts = getAccounts();
        const account = accounts.find(a => String(a.email).toLowerCase() === em && a.active !== false);
        if (!account) return { status: 'error', message: 'Compte introuvable' };
        const raw = em + '|' + String(password || '');
        let h = 2166136261;
        for (let i = 0; i < raw.length; i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619); }
        const hash = 'azv1_' + (h >>> 0).toString(16);
        if (account.passwordHash !== hash) return { status: 'error', message: 'Mot de passe incorrect' };
        const { passwordHash, ...safe } = account;
        return { status: 'success', account: safe };
    }

    function getProducts() {
        init();
        return read(KEYS.products, DEFAULT_PRODUCTS);
    }

    function saveProducts(list) {
        write(KEYS.products, list);
    }

    function getOrders() {
        init();
        return read(KEYS.orders, DEFAULT_ORDERS);
    }

    function saveOrders(list) {
        write(KEYS.orders, list);
    }

    function getConfig() {
        init();
        return read(KEYS.config, DEFAULT_CONFIG);
    }

    function saveConfig(cfg) {
        write(KEYS.config, cfg);
    }

    function getPromos() {
        init();
        return read(KEYS.promos, []);
    }

    function savePromos(list) {
        write(KEYS.promos, list);
    }

    function addOrder(payload, paymentMethod, status) {
        const orders = getOrders();
        const id = payload.order_id || ('AZ-' + Math.floor(100000 + Math.random() * 900000));
        const tvaRate = 0.23;
        const totalTTC = parseFloat(payload.total);
        const totalIVA = (totalTTC - totalTTC / (1 + tvaRate)).toFixed(2);
        const articlesList = (payload.items || []).map(i => `${i.quantity}x ${i.name} (${i.size})`).join(', ');

        const order = {
            id_commande: id,
            date: new Date().toLocaleString('pt-PT'),
            prenom: payload.firstname,
            nom: payload.lastname,
            email: payload.email,
            nif: payload.nif || '',
            adresse: payload.address,
            articles: articlesList,
            total: totalTTC,
            iva: parseFloat(totalIVA),
            statut: status || 'Payé',
            paiement: paymentMethod || 'Demo'
        };

        orders.unshift(order);
        saveOrders(orders);
        deductStock(payload.items || []);
        return { status: 'success', id_commande: id, iva: totalIVA };
    }

    function deductStock(items) {
        const products = getProducts();
        items.forEach(item => {
            const p = products.find(x => x.id === item.id);
            if (p) p.stock = Math.max(0, parseInt(p.stock) - (item.quantity || 1));
        });
        saveProducts(products);
    }

    function updateOrderStatus(id, statut) {
        const orders = getOrders();
        const o = orders.find(x => x.id_commande === id);
        if (o) { o.statut = statut; saveOrders(orders); }
        return { status: 'success' };
    }

    function addProduct(p) {
        const products = getProducts();
        if (products.find(x => x.id === p.id)) return { status: 'error', message: 'ID existe déjà' };
        products.push(p);
        saveProducts(products);
        return { status: 'success' };
    }

    function updateProduct(p) {
        const products = getProducts();
        const idx = products.findIndex(x => x.id === p.id);
        if (idx === -1) return { status: 'error', message: 'Produit introuvable' };
        products[idx] = { ...products[idx], ...p };
        saveProducts(products);
        return { status: 'success' };
    }

    function deleteProduct(id) {
        let products = getProducts().filter(x => x.id !== id);
        saveProducts(products);
        return { status: 'success' };
    }

    function updateStock(id, stock) {
        const products = getProducts();
        const p = products.find(x => x.id === id);
        if (p) { p.stock = stock; saveProducts(products); }
        return { status: 'success' };
    }

    function simulateStripeSession(payload) {
        const orderId = payload.order_id || ('AZ-' + Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem('azavision_pending_order', JSON.stringify({ ...payload, order_id: orderId }));
        const base = window.location.href.split('?')[0];
        return {
            status: 'success',
            order_id: orderId,
            checkout_url: base + '?payment=success&order=' + orderId + '&demo_stripe=1'
        };
    }

    function simulateEupagoMBWay(payload) {
        const orderId = payload.order_id || ('AZ-' + Math.floor(100000 + Math.random() * 900000));
        return {
            status: 'success',
            order_id: orderId,
            method: 'mbway',
            reference: 'MBW' + orderId.slice(-6),
            message: '[DEMO] Confirme o pagamento na app MB Way (simulação).'
        };
    }

    function simulateEupagoMultibanco(payload) {
        const orderId = payload.order_id || ('AZ-' + Math.floor(100000 + Math.random() * 900000));
        return {
            status: 'success',
            order_id: orderId,
            method: 'multibanco',
            entity: '12345',
            reference: String(Math.floor(100000000 + Math.random() * 900000000)),
            amount: parseFloat(payload.amount).toFixed(2),
            message: 'Referência Multibanco gerada (demo)'
        };
    }

    return {
        init, getProducts, saveProducts, getOrders, saveOrders,
        getConfig, saveConfig, getPromos, savePromos,
        getAccounts, saveAccounts, registerAccount, loginAccount,
        addOrder, updateOrderStatus, addProduct, updateProduct,
        deleteProduct, updateStock,
        simulateStripeSession, simulateEupagoMBWay, simulateEupagoMultibanco
    };
})();
