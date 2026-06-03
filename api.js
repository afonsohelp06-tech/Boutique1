/**
 * AZAVISION — Couche API (URL lue depuis index.html : variable API_URL)
 */
function getAzavisionApiUrlFromCode() {
    if (typeof API_URL !== 'undefined' && API_URL && String(API_URL).trim()) {
        return String(API_URL).trim();
    }
    if (typeof ERP_API_URL_DEFAULT !== 'undefined' && ERP_API_URL_DEFAULT && String(ERP_API_URL_DEFAULT).trim()) {
        return String(ERP_API_URL_DEFAULT).trim();
    }
    return '';
}

const AzavisionAPI = {
    getUrl() {
        return getAzavisionApiUrlFromCode();
    },

    isLive() {
        const u = this.getUrl();
        if (!u || /INSEREZ|XXXXXXXX/i.test(u)) return false;
        return u.includes('script.google.com') && u.endsWith('/exec');
    },

    isProductionClient() {
        return this.isLive();
    },

    async _fetch(url, options) {
        const opts = { ...options, redirect: 'follow' };
        if (opts.method === 'POST' && opts.body) {
            opts.headers = {
                ...(opts.headers || {}),
                'Content-Type': 'text/plain;charset=utf-8'
            };
        }
        const res = await fetch(url, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Réponse API invalide');
        }
    },

    async getProducts() {
        if (!this.isLive()) {
            DemoStore.init();
            return { status: 'success', data: DemoStore.getProducts() };
        }
        return this._fetch(this.getUrl());
    },

    async getOrders() {
        if (!this.isLive()) {
            DemoStore.init();
            return { status: 'success', orders: DemoStore.getOrders() };
        }
        return this._fetch(this.getUrl() + '?action=get_orders');
    },

    async getConfig() {
        if (!this.isLive()) {
            DemoStore.init();
            return { status: 'success', config: DemoStore.getConfig() };
        }
        return this._fetch(this.getUrl() + '?action=get_config');
    },

    async confirmOrder(payload, paymentMethod) {
        const body = { ...payload, payment_method: paymentMethod };
        if (!this.isLive()) {
            DemoStore.init();
            return DemoStore.addOrder(body, paymentMethod, 'Payé');
        }
        return this._fetch(this.getUrl() + '?action=confirm_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    },

    async createStripeSession(payload) {
        if (!this.isLive()) {
            return DemoStore.simulateStripeSession(payload);
        }
        return this._fetch(this.getUrl() + '?action=create_stripe_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async createEupagoMBWay(payload) {
        if (!this.isLive()) {
            return DemoStore.simulateEupagoMBWay(payload);
        }
        return this._fetch(this.getUrl() + '?action=create_eupago_mbway', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async createEupagoMultibanco(payload) {
        if (!this.isLive()) {
            return DemoStore.simulateEupagoMultibanco(payload);
        }
        return this._fetch(this.getUrl() + '?action=create_eupago_multibanco', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async addProduct(p) {
        if (!this.isLive()) return DemoStore.addProduct(p);
        return this._fetch(this.getUrl() + '?action=add_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        });
    },

    async updateProduct(p) {
        if (!this.isLive()) return DemoStore.updateProduct(p);
        return this._fetch(this.getUrl() + '?action=update_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        });
    },

    async deleteProduct(id) {
        if (!this.isLive()) return DemoStore.deleteProduct(id);
        return this._fetch(this.getUrl() + '?action=delete_product&id=' + encodeURIComponent(id), { method: 'POST' });
    },

    async updateStock(id, stock) {
        if (!this.isLive()) return DemoStore.updateStock(id, stock);
        return this._fetch(this.getUrl() + '?action=update_stock&id=' + encodeURIComponent(id) + '&stock=' + stock, { method: 'POST' });
    },

    async updateOrderStatus(id, statut) {
        if (!this.isLive()) return DemoStore.updateOrderStatus(id, statut);
        return this._fetch(this.getUrl() + '?action=update_order_status&id_commande=' + encodeURIComponent(id) + '&statut=' + encodeURIComponent(statut), { method: 'POST' });
    },

    async registerAccount(data) {
        if (!this.isLive()) {
            DemoStore.init();
            return DemoStore.registerAccount(data);
        }
        return this._fetch(this.getUrl() + '?action=register_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async loginAccount(email, password) {
        if (!this.isLive()) {
            DemoStore.init();
            return DemoStore.loginAccount(email, password);
        }
        return this._fetch(this.getUrl() + '?action=login_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    },

    async getAccounts() {
        if (!this.isLive()) {
            DemoStore.init();
            return { status: 'success', accounts: DemoStore.getAccounts() };
        }
        return this._fetch(this.getUrl() + '?action=get_accounts');
    },

    async updateAccount(data) {
        if (!this.isLive()) {
            const accounts = DemoStore.getAccounts();
            const idx = accounts.findIndex(a => a.id === data.id);
            if (idx === -1) return { status: 'error', message: 'Compte introuvable' };
            Object.assign(accounts[idx], data);
            DemoStore.saveAccounts(accounts);
            const { passwordHash, ...safe } = accounts[idx];
            return { status: 'success', account: safe };
        }
        return this._fetch(this.getUrl() + '?action=update_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
};

function refreshConfigFromApi() {
    if (typeof CONFIG !== 'undefined') {
        CONFIG.API_URL = AzavisionAPI.getUrl();
    }
}
