/**
 * AZAVISION — Paiements Stripe, MB Way, Multibanco
 */

function getOrderTotalWithShipping() {
    const subtotal = parseFloat(calculateCartTotal());
    const discount = APP_STATE.appliedPromo ? subtotal * (APP_STATE.appliedPromo.discount / 100) : 0;
    const afterDiscount = subtotal - discount;
    const shipping = afterDiscount >= CONFIG.free_shipping_threshold ? 0 : CONFIG.shipping_cost;
    return (afterDiscount + shipping).toFixed(2);
}

function calculateIVA(totalTTC) {
    const rate = CONFIG.tva / 100;
    return (parseFloat(totalTTC) - (parseFloat(totalTTC) / (1 + rate))).toFixed(2);
}

function buildOrderPayload() {
    return {
        firstname: document.getElementById('chk-firstname').value.trim(),
        lastname: document.getElementById('chk-lastname').value.trim(),
        email: document.getElementById('chk-email').value.trim(),
        nif: document.getElementById('chk-nif').value.trim(),
        address: document.getElementById('chk-address').value.trim(),
        phone: document.getElementById('mbway-phone')?.value.trim() || '',
        items: APP_STATE.cart,
        total: getOrderTotalWithShipping(),
        payment_method: APP_STATE.paymentMethod
    };
}

function validateCheckoutForm() {
    const payload = buildOrderPayload();
    if (!payload.firstname || !payload.lastname || !payload.email || !payload.address) {
        showToast('Formulário incompleto', 'Preencha todos os campos obrigatórios.', true);
        return null;
    }
    if (!payload.nif || !/^\d{9}$/.test(payload.nif.replace(/\s/g, ''))) {
        showToast('NIF inválido', 'O NIF português deve ter 9 dígitos.', true);
        return null;
    }
    payload.nif = payload.nif.replace(/\s/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        showToast('E-mail inválido', 'Introduza um endereço de e-mail válido.', true);
        return null;
    }
    return payload;
}

async function processPayment() {
    const payload = validateCheckoutForm();
    if (!payload) return;

    const method = document.querySelector('input[name="payment-method"]:checked')?.value;
    if (!method) {
        showToast('Método de pagamento', 'Selecione Cartão, MB Way ou Multibanco.', true);
        return;
    }
    APP_STATE.paymentMethod = method;

    const btn = document.getElementById('btn-pay');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> A processar...';

    try {
        const orderId = 'AZ-' + Math.floor(100000 + Math.random() * 900000);
        payload.order_id = orderId;

        if (method === 'stripe') {
            await payWithStripe(payload);
        } else if (method === 'mbway') {
            await payWithMBWay(payload);
        } else if (method === 'multibanco') {
            await payWithMultibanco(payload);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de pagamento', err.message || 'Tente novamente.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> Pagar agora';
    }
}

async function payWithStripe(payload) {
    const base = window.location.href.split('?')[0];
    const successUrl = base + '?payment=success&order=' + payload.order_id;
    const cancelUrl = base + '?payment=cancelled';

    const result = await AzavisionAPI.createStripeSession({
        amount: payload.total,
        order_id: payload.order_id,
        nif: payload.nif,
        success_url: successUrl,
        cancel_url: cancelUrl,
        order_data: payload
    });

    if (result.status === 'success' && result.checkout_url) {
        sessionStorage.setItem('azavision_pending_order', JSON.stringify(payload));
        window.location.href = result.checkout_url;
    } else {
        throw new Error(result.message || 'Erro Stripe');
    }
}

async function payWithMBWay(payload) {
    const phone = document.getElementById('mbway-phone').value.trim().replace(/\s/g, '');
    if (!phone || phone.length < 9) {
        showToast('Telemóvel', 'Introduza o número MB Way (9 dígitos).', true);
        throw new Error('Telefone inválido');
    }

    const result = await AzavisionAPI.createEupagoMBWay({
        amount: payload.total,
        order_id: payload.order_id,
        phone: phone
    });

    if (result.status === 'success') {
        showMBWayInstructions(result);
        const confirmed = await AzavisionAPI.confirmOrder(payload, 'MB Way');
        if (confirmed.status === 'success') {
            handleOrderSuccess(confirmed.id_commande || result.order_id, confirmed.iva || calculateIVA(payload.total));
        }
    } else {
        throw new Error(result.message || 'Erro MB Way');
    }
}

async function payWithMultibanco(payload) {
    const result = await AzavisionAPI.createEupagoMultibanco({
        amount: payload.total,
        order_id: payload.order_id
    });

    if (result.status === 'success') {
        showMultibancoInstructions(result);
        const confirmed = await AzavisionAPI.confirmOrder(payload, 'Multibanco');
        if (confirmed.status === 'success') {
            handleOrderSuccess(confirmed.id_commande || result.order_id, confirmed.iva || calculateIVA(payload.total));
        }
    } else {
        throw new Error(result.message || 'Erro Multibanco');
    }
}

function showMBWayInstructions(result) {
    const el = document.getElementById('payment-instructions');
    el.classList.remove('hidden');
    el.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <p class="text-xs font-bold text-green-800 uppercase mb-2"><i class="fa-solid fa-mobile-screen mr-1"></i> MB Way</p>
            <p class="text-xs text-green-700">${result.message || 'Confirme o pagamento na app MB Way.'}</p>
            <p class="text-[10px] text-green-600 mt-2">Ref: ${result.reference || result.order_id}</p>
        </div>`;
}

function showMultibancoInstructions(result) {
    const el = document.getElementById('payment-instructions');
    el.classList.remove('hidden');
    el.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p class="text-xs font-bold text-blue-800 uppercase mb-2"><i class="fa-solid fa-building-columns mr-1"></i> Multibanco</p>
            <p class="text-xs text-blue-700">Entidade: <strong>${result.entity}</strong></p>
            <p class="text-xs text-blue-700">Referência: <strong>${result.reference}</strong></p>
            <p class="text-xs text-blue-700">Montante: <strong>${result.amount} €</strong></p>
            <p class="text-[10px] text-blue-600 mt-2">Pague num multibanco ou homebanking. Validade: 24h.</p>
        </div>`;
}

async function handleStripeReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    const pending = sessionStorage.getItem('azavision_pending_order');
    if (!pending) return;

    const payload = JSON.parse(pending);
    const orderId = params.get('order') || payload.order_id || ('AZ-' + Math.floor(100000 + Math.random() * 900000));
    payload.order_id = orderId;

    try {
        const confirmed = await AzavisionAPI.confirmOrder(payload, 'Stripe (Cartão)');
        handleOrderSuccess(confirmed.id_commande || orderId, confirmed.iva || calculateIVA(payload.total));
    } catch (e) {
        handleOrderSuccess(orderId, calculateIVA(payload.total));
    }

    sessionStorage.removeItem('azavision_pending_order');
    window.history.replaceState({}, '', window.location.pathname);
}

function togglePaymentFields() {
    const method = document.querySelector('input[name="payment-method"]:checked')?.value;
    const mbwayField = document.getElementById('mbway-field');
    if (mbwayField) mbwayField.classList.toggle('hidden', method !== 'mbway');
}

function selectPaymentMethod(method) {
    document.querySelectorAll('.payment-option').forEach(el => {
        el.classList.remove('border-luxury-gold', 'bg-luxury-gold/5');
        el.classList.add('border-neutral-200');
    });
    const selected = document.getElementById('pay-' + method);
    if (selected) {
        selected.classList.add('border-luxury-gold', 'bg-luxury-gold/5');
        selected.classList.remove('border-neutral-200');
    }
    const radio = document.getElementById('radio-' + method);
    if (radio) radio.checked = true;
    togglePaymentFields();
}

function updateModeBadge() {
    /* Badge technique retiré de l'interface client */
}

window.processPayment = processPayment;
window.selectPaymentMethod = selectPaymentMethod;
window.handleStripeReturn = handleStripeReturn;
