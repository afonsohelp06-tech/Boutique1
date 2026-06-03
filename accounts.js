/**
 * AZAVISION — Comptes clients (inscription, connexion, session)
 */
const ClientAccounts = (function () {
    const KEYS = {
        accounts: 'azavision_accounts',
        session: 'azavision_client_session'
    };

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function hashPassword(email, password) {
        const raw = normalizeEmail(email) + '|' + String(password || '');
        let h = 2166136261;
        for (let i = 0; i < raw.length; i++) {
            h ^= raw.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return 'azv1_' + (h >>> 0).toString(16);
    }

    function getAccounts() {
        try {
            const raw = localStorage.getItem(KEYS.accounts);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveAccounts(list) {
        localStorage.setItem(KEYS.accounts, JSON.stringify(list));
    }

    function getSession() {
        try {
            const raw = localStorage.getItem(KEYS.session);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setSession(account) {
        if (!account) {
            localStorage.removeItem(KEYS.session);
            return;
        }
        const { passwordHash, ...safe } = account;
        localStorage.setItem(KEYS.session, JSON.stringify(safe));
    }

    function validateNif(nif) {
        const n = String(nif || '').replace(/\s/g, '');
        return /^\d{9}$/.test(n);
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
    }

    function validateRegisterData(data) {
        if (!data.prenom || !data.nom) return 'Indique o nome e o apelido.';
        if (!validateEmail(data.email)) return 'E-mail inválido.';
        if (!data.password || data.password.length < 6) return 'Palavra-passe: mínimo 6 caracteres.';
        if (data.password !== data.passwordConfirm) return 'As palavras-passe não coincidem.';
        if (!validateNif(data.nif)) return 'NIF inválido (9 dígitos).';
        if (!data.adresse || data.adresse.length < 5) return 'Morada incompleta.';
        if (!data.rgpdConsent) return 'Aceite a política de privacidade (RGPD).';
        return null;
    }

    async function register(data) {
        const err = validateRegisterData(data);
        if (err) return { status: 'error', message: err };

        const payload = {
            prenom: data.prenom.trim(),
            nom: data.nom.trim(),
            email: normalizeEmail(data.email),
            password: data.password,
            nif: String(data.nif).replace(/\s/g, ''),
            telefone: (data.telefone || '').trim(),
            adresse: data.adresse.trim()
        };

        const res = await AzavisionAPI.registerAccount(payload);
        if (res.status === 'success' && res.account) {
            setSession(res.account);
            syncLocalAccountsCache(res.account);
        }
        return res;
    }

    async function login(email, password) {
        const em = normalizeEmail(email);
        if (!validateEmail(em)) return { status: 'error', message: 'E-mail inválido.' };
        if (!password) return { status: 'error', message: 'Introduza a palavra-passe.' };

        const res = await AzavisionAPI.loginAccount(em, password);
        if (res.status === 'success' && res.account) {
            setSession(res.account);
        }
        return res;
    }

    function syncLocalAccountsCache(account) {
        if (!account || !AzavisionAPI.isLive()) return;
        const accounts = getAccounts();
        if (!accounts.some(a => a.id === account.id)) {
            accounts.push({ ...account, passwordHash: '' });
            saveAccounts(accounts);
        }
    }

    function logout() {
        setSession(null);
        return { status: 'success' };
    }

    async function updateProfile(data) {
        const session = getSession();
        if (!session) return { status: 'error', message: 'Sessão expirada. Inicie sessão.' };

        const payload = { id: session.id, ...data };
        const res = await AzavisionAPI.updateAccount(payload);
        if (res.status === 'success' && res.account) {
            setSession(res.account);
        }
        return res;
    }

    function stripSecret(account) {
        if (!account) return null;
        const { passwordHash, ...safe } = account;
        return safe;
    }

    function isLoggedIn() {
        return !!getSession();
    }

    function fillCheckoutFields() {
        const s = getSession();
        if (!s) return;
        const map = {
            'chk-firstname': s.prenom,
            'chk-lastname': s.nom,
            'chk-email': s.email,
            'chk-nif': s.nif,
            'chk-address': s.adresse,
            'chk-phone': s.telefone
        };
        Object.keys(map).forEach(id => {
            const el = document.getElementById(id);
            if (el && map[id]) el.value = map[id];
        });
    }

    return {
        register,
        login,
        logout,
        updateProfile,
        getSession,
        getAccounts,
        isLoggedIn,
        fillCheckoutFields,
        validateNif,
        validateEmail,
        validateRegisterData
    };
})();

// --- Interface boutique (modal conta) ---

function updateAccountNavUI() {
    syncProductionUI();
    const label = document.getElementById('account-nav-label');
    const btn = document.getElementById('account-nav-btn');
    if (!label || !btn) return;
    const s = ClientAccounts.getSession();
    if (s) {
        label.textContent = (s.prenom || 'Conta').split(' ')[0];
        btn.title = s.email;
    } else {
        label.textContent = 'Conta';
        btn.title = 'Iniciar sessão ou criar conta';
    }
}

function showAccountTab(tab) {
    ['account-panel-login', 'account-panel-register', 'account-panel-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    ['account-tab-login', 'account-tab-register', 'account-tab-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('border-luxury-gold', 'text-luxury-gold-dark');
        if (el) el.classList.add('text-neutral-400');
    });
    const panel = document.getElementById('account-panel-' + tab);
    const tabBtn = document.getElementById('account-tab-' + tab);
    if (panel) panel.classList.remove('hidden');
    if (tabBtn) {
        tabBtn.classList.add('border-luxury-gold', 'text-luxury-gold-dark');
        tabBtn.classList.remove('text-neutral-400');
    }
}

function toggleAccountModal() {
    const m = document.getElementById('account-modal');
    if (!m) return;
    const opening = m.classList.contains('hidden');
    m.classList.toggle('hidden');
    if (!opening) return;

    if (ClientAccounts.isLoggedIn()) {
        document.getElementById('account-tabs-guest')?.classList.add('hidden');
        document.getElementById('account-tabs-profile')?.classList.remove('hidden');
        const s = ClientAccounts.getSession();
        document.getElementById('prof-prenom').value = s.prenom || '';
        document.getElementById('prof-nom').value = s.nom || '';
        document.getElementById('prof-email').value = s.email || '';
        document.getElementById('prof-nif').value = s.nif || '';
        document.getElementById('prof-phone').value = s.telefone || '';
        document.getElementById('prof-address').value = s.adresse || '';
        showAccountTab('profile');
    } else {
        document.getElementById('account-tabs-guest')?.classList.remove('hidden');
        document.getElementById('account-tabs-profile')?.classList.add('hidden');
        showAccountTab('login');
    }
}

async function submitAccountLogin() {
    const email = document.getElementById('acc-login-email').value;
    const pass = document.getElementById('acc-login-pass').value;
    const res = await ClientAccounts.login(email, pass);
    if (res.status === 'success') {
        showToast('Sessão iniciada', 'Bem-vindo, ' + (res.account.prenom || ''));
        toggleAccountModal();
        updateAccountNavUI();
        ClientAccounts.fillCheckoutFields();
    } else {
        showToast('Erro', res.message || 'Login falhou', true);
    }
}

async function submitAccountRegister() {
    const data = {
        prenom: document.getElementById('acc-reg-prenom').value,
        nom: document.getElementById('acc-reg-nom').value,
        email: document.getElementById('acc-reg-email').value,
        password: document.getElementById('acc-reg-pass').value,
        passwordConfirm: document.getElementById('acc-reg-pass2').value,
        nif: document.getElementById('acc-reg-nif').value,
        telefone: document.getElementById('acc-reg-phone').value,
        adresse: document.getElementById('acc-reg-address').value,
        rgpdConsent: document.getElementById('acc-reg-rgpd').checked
    };
    const res = await ClientAccounts.register(data);
    if (res.status === 'success') {
        showToast('Conta criada', 'Pode finalizar compras com os seus dados.');
        toggleAccountModal();
        updateAccountNavUI();
        ClientAccounts.fillCheckoutFields();
    } else {
        showToast('Erro', res.message || 'Registo falhou', true);
    }
}

async function submitAccountProfile() {
    const res = await ClientAccounts.updateProfile({
        prenom: document.getElementById('prof-prenom').value,
        nom: document.getElementById('prof-nom').value,
        nif: document.getElementById('prof-nif').value,
        telefone: document.getElementById('prof-phone').value,
        adresse: document.getElementById('prof-address').value
    });
    if (res.status === 'success') {
        showToast('Perfil atualizado', '');
        ClientAccounts.fillCheckoutFields();
    } else {
        showToast('Erro', res.message || '', true);
    }
}

function submitAccountLogout() {
    ClientAccounts.logout();
    updateAccountNavUI();
    showToast('Sessão terminada', '');
    toggleAccountModal();
}

window.toggleAccountModal = toggleAccountModal;
window.showAccountTab = showAccountTab;
window.submitAccountLogin = submitAccountLogin;
window.submitAccountRegister = submitAccountRegister;
window.submitAccountLogout = submitAccountLogout;
window.submitAccountProfile = submitAccountProfile;
