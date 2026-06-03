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

    async _fetch(url, options) {
        const res = await fetch(url, options);
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
    }
};

function refreshConfigFromApi() {
    if (typeof CONFIG !== 'undefined') {
        CONFIG.API_URL = AzavisionAPI.getUrl();
    }
}
