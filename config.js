/**
 * AZAVISION — Configuration globale boutique Portugal
 */
const CONFIG = {
    API_URL: '',
    brand_name: 'Azavision',
    currency: 'EUR (€)',
    contact_email: 'contact@azavision.pt',
    company_nif: '999999999',
    free_shipping_threshold: 150.00,
    shipping_cost: 15.00,
    tva: 23.00,
    stripe_public_key: '',
    eupago_enabled: false,
    moloni_enabled: false,
    site_url: '',
    livro_reclamacoes_url: 'https://www.livroreclamacoes.pt/inicio/reclamacao'
};

const PROMO_CODES = { 'AZA10': 10, 'LISBOA20': 20, 'VIP15': 15 };

let APP_STATE = {
    products: [],
    cart: [],
    wishlist: [],
    activeCategory: 'all',
    searchQuery: '',
    priceSort: 'default',
    selectedSize: 'S',
    selectedProduct: null,
    appliedPromo: null,
    pendingOrder: null,
    paymentMethod: null
};

function initConfig() {
    refreshConfigFromApi();
    CONFIG.site_url = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
}
