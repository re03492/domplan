'use strict';
const homes = [
    {
        id: 1,
        title: 'Квартира «Т2»',
        district: 'Центральный район',
        rooms: 2,
        area: 64,
        price: 28500000
    },
    {
        id: 2,
        title: 'Квартира «Т1»',
        district: 'Северный район',
        rooms: 1,
        area: 38,
        price: 17200000
    },
    {
        id: 3,
        title: 'Квартира «Т3»',
        district: 'Западный район',
        rooms: 3,
        area: 92,
        price: 39600000
    }
];

const companies = [
    {
        name: 'МастерДом',
        service: 'Ремонт под ключ · отделка · электрика'
    },
    {
        name: 'Новая комната',
        service: 'Покраска · обои · укладка напольных покрытий'
    },
    {
        name: 'ДомСервис',
        service: 'Сантехника · сборка мебели · мелкий ремонт'
    }
];

const $ = selector => document.querySelector(selector);

const money = value =>
    new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2
    }).format(value) + ' ₸';

const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);

const key = 'domplan-stage1-requests';

let state = {
    requests: []
};

try {
    const saved = JSON.parse(localStorage.getItem(key));

    if (saved && Array.isArray(saved.requests)) {
        state = {
            requests: saved.requests
        };
    }
} catch {
    notify('Сохранённые данные недоступны. Работаем с пустым проектом.');
}

function notify(message) {
    $('#notice').textContent = message;
}

function save() {
    try {
        localStorage.setItem(key, JSON.stringify(state));
        return true;
    } catch {
        notify(
            'Браузер не разрешил сохранение. ' +
            'Изменения доступны только до закрытия страницы.'
        );

        return false;
    }
}

function formData(form) {
    return Object.fromEntries(new FormData(form));
}

const selected = new Set();

function route() {
    const name = location.hash.slice(1) || 'housing';

    const page = [
        'housing',
        'companies',
        'materials',
        'expenses'
    ].includes(name)
        ? name
        : 'housing';

    document.querySelectorAll('.page').forEach(el => {
        el.hidden = el.id !== page;
    });

    document.querySelectorAll('nav a').forEach(a => {
        const active = a.hash === '#' + page;

        a.classList.toggle('active', active);

        if (active) {
            a.setAttribute('aria-current', 'page');
        } else {
            a.removeAttribute('aria-current');
        }
    });
}

window.addEventListener('hashchange', route);

const homeIcon = `
    <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
    >
        <path
            d="M12 45 50 14 88 45M22 38v46h56V38M42 84V58h17v26M30 45h12v10H30M60 45h12v10H60"
        />
    </svg>
`;

function renderHomes() {
    const query = $('#search').value.trim().toLowerCase();
    const rooms = $('#rooms').value;

    const list = homes
        .filter(h =>
            (h.title + ' ' + h.district).toLowerCase().includes(query) &&
            (!rooms || h.rooms === Number(rooms))
        )
        .sort((a, b) =>
            $('#sort').value === 'area'
                ? b.area - a.area
                : a.price - b.price
        );

    $('#homes').innerHTML = list.length
        ? list.map(h => `
            <article class="card">
                <div class="home-art">
                    ${homeIcon}
                </div>

                <span class="badge">
                    ${h.rooms}-КОМНАТНАЯ
                </span>

                <h3>${h.title}</h3>

                <p class="meta">
                    ${h.district} · ${h.area} м²
                </p>

                <div class="price">
                    ${money(h.price)}
                </div>

                <p class="meta">
                    ${money(Math.round(h.price / h.area))} за м²
                </p>

                <button
                    class="secondary"
                    data-home="${h.id}"
                    aria-pressed="${selected.has(h.id)}"
                >
                    ${
                        selected.has(h.id)
                            ? 'Убрать из сравнения'
                            : 'Сравнить'
                    }
                </button>
            </article>
        `).join('')
        : '<p>По вашему запросу ничего не найдено.</p>';

    renderComparison();
}

function renderComparison() {
    const list = homes.filter(h => selected.has(h.id));
    const box = $('#comparison');

    box.hidden = !list.length;

    box.innerHTML =
        '<h2>Сравнение жилья</h2>' +
        (
            list.length < 2
                ? '<p class="muted">Выберите ещё один объект для сравнения.</p>'
                : ''
        ) +
        `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Параметр</th>
                            ${list.map(h => `
                                <th>${h.title}</th>
                            `).join('')}
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            [
                                ['Цена', h => money(h.price)],
                                ['Площадь', h => h.area + ' м²'],
                                [
                                    'Цена за м²',
                                    h => money(Math.round(h.price / h.area))
                                ],
                                ['Комнаты', h => h.rooms],
                                ['Район', h => h.district]
                            ].map(([label, fn]) => `
                                <tr>
                                    <th>${label}</th>
                                    ${list.map(h => `
                                        <td>${fn(h)}</td>
                                    `).join('')}
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
}

['search', 'rooms', 'sort'].forEach(id => {
    $('#' + id).addEventListener('input', renderHomes);
});

$('#homes').addEventListener('click', e => {
    const button = e.target.closest('[data-home]');

    if (!button) {
        return;
    }

    const id = Number(button.dataset.home);

    if (selected.has(id)) {
        selected.delete(id);
    } else {
        selected.add(id);
    }

    renderHomes();
});

$('#company-list').innerHTML = companies.map((c, i) => `
    <article class="card">
        <span class="badge">РЕМОНТ И УСЛУГИ</span>

        <h3>${c.name}</h3>

        <p class="meta">${c.service}</p>

        <button class="secondary" data-company="${i}">
            Выбрать компанию
        </button>
    </article>
`).join('');

companies.forEach(c => {
    $('#request-company').add(new Option(c.name, c.name));
});

$('#company-list').addEventListener('click', e => {
    const b = e.target.closest('[data-company]');

    if (b) {
        $('#request-company').value =
            companies[Number(b.dataset.company)].name;

        $('#request-company').focus();
    }
});

function renderRequests() {
    $('#requests').innerHTML = state.requests.length
        ? state.requests.map(r => `
            <div class="row">
                <div>
                    <span class="badge">ЛОКАЛЬНЫЙ ЧЕРНОВИК</span>

                    <p>
                        <strong>${escapeHTML(r.company)}</strong>
                    </p>

                    <p>${escapeHTML(r.description)}</p>

                    <small>${money(r.amount)}</small>
                </div>

                <button
                    class="danger"
                    data-remove-request="${escapeHTML(r.id)}"
                    aria-label="Удалить заявку"
                >
                    Удалить
                </button>
            </div>
        `).join('')
        : '<p class="muted">Заявок пока нет. Опишите первую задачу слева.</p>';
}

$('#request-form').addEventListener('submit', e => {
    e.preventDefault();

    const d = formData(e.target);

    if (!d.description.trim()) {
        return;
    }

    state.requests.unshift({
        ...d,
        description: d.description.trim(),
        amount: Number(d.amount),
        id: uid()
    });

    if (save()) {
        notify('Черновик сохранён в браузере. Компаниям он не отправлен.');
    }

    e.target.reset();
    renderRequests();
});

$('#requests').addEventListener('click', e => {
    const b = e.target.closest('[data-remove-request]');

    if (b) {
        state.requests = state.requests.filter(
            r => r.id !== b.dataset.removeRequest
        );

        save();
        renderRequests();
    }
});

route();
renderHomes();
renderRequests();
// Материалы. Начальные цены — примеры для проверки расчётов, не реальные котировки.
const materials = {
    laminate: { unit: 'м²' },
    paint: { unit: 'л' },
    tile: { unit: 'м²' }
};

const baseOffers = [
    { id: 'l1', material: 'laminate', store: 'Магазин А', pack: 2, price: 8000, delivery: 3000 },
    { id: 'l2', material: 'laminate', store: 'Магазин Б', pack: 2.5, price: 9500, delivery: 12000 },
    { id: 'p1', material: 'paint', store: 'Магазин А', pack: 5, price: 14000, delivery: 2000 },
    { id: 'p2', material: 'paint', store: 'Магазин Б', pack: 10, price: 26000, delivery: 3500 },
    { id: 't1', material: 'tile', store: 'Магазин А', pack: 1.08, price: 5400, delivery: 5000 },
    { id: 't2', material: 'tile', store: 'Магазин Б', pack: 1.62, price: 7776, delivery: 8000 }
];

const offersKey = 'domplan-material-offers-v1';
let customOffers = [];

function validOffer(offer) {
    return offer && Object.hasOwn(materials, offer.material) &&
        typeof offer.id === 'string' && typeof offer.store === 'string' &&
        offer.store.trim().length > 0 && offer.store.length <= 80 &&
        Number.isFinite(offer.pack) && offer.pack >= 0.01 && offer.pack <= 100000 &&
        Number.isFinite(offer.price) && offer.price > 0 && offer.price <= 1000000000 &&
        Number.isFinite(offer.delivery) && offer.delivery >= 0 && offer.delivery <= 1000000000;
}

try {
    const stored = JSON.parse(localStorage.getItem(offersKey));
    if (Array.isArray(stored)) {
        customOffers = stored.filter(validOffer);
    }
} catch {
    $('#offer-message').textContent = 'Не удалось прочитать сохранённые предложения.';
}

function saveOffers() {
    try {
        localStorage.setItem(offersKey, JSON.stringify(customOffers));
        return true;
    } catch {
        $('#offer-message').textContent = 'Сохранение недоступно. Изменения останутся только до закрытия страницы.';
        return false;
    }
}

function productURL(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function calculateMaterial(offer, quantity) {
    // Ввод имеет точность до сотых: целые числа исключают ошибки дробного деления.
    const packs = Math.ceil(Math.round(quantity * 100) / Math.round(offer.pack * 100));
    const goods = packs * Math.round(offer.price * 100);
    const total = (goods + Math.round(offer.delivery * 100)) / 100;
    return { packs, total, purchased: packs * Math.round(offer.pack * 100) / 100 };
}

function renderMaterials() {
    const material = $('#material').value;
    const quantityInput = $('#quantity');
    const unit = materials[material].unit;
    $('#quantity-label').textContent = unit === 'л' ? 'Нужный объём, л' : 'Нужная площадь, м²';

    if (!quantityInput.checkValidity()) {
        $('#offers').innerHTML = '';
        $('#material-summary').textContent = 'Введите количество от 0,01 до 100 000 с точностью до сотых.';
        return;
    }

    const list = [...baseOffers, ...customOffers]
        .filter(offer => offer.material === material)
        .map(offer => ({ ...offer, ...calculateMaterial(offer, Number(quantityInput.value)) }))
        .sort((a, b) => a.total - b.total);

    $('#material-summary').textContent = list.length
        ? `Предложений: ${list.length}. Минимальная сумма с доставкой: ${money(list[0].total)}.`
        : 'Предложений пока нет. Добавьте первое ниже.';

    $('#offers').innerHTML = list.map(offer => `
        <article class="card material-card ${offer.total === list[0].total ? 'best-offer' : ''}">
            <span class="badge">${offer.total === list[0].total ? 'ЛУЧШАЯ ЦЕНА С ДОСТАВКОЙ' : 'ПРЕДЛОЖЕНИЕ МАГАЗИНА'}</span>
            <h3>${escapeHTML(offer.store)}</h3>
            <p class="meta">Упаковка: ${offer.pack} ${unit} · ${money(offer.price)}</p>
            <p class="meta">За 1 ${unit}: ${money(offer.price / offer.pack)}</p>
            <p>Количество: ${offer.packs} уп. (${offer.purchased} ${unit})<br>
                Материалы: ${money(offer.packs * offer.price)}<br>
                Доставка: ${money(offer.delivery)}</p>
            <div class="price">${money(offer.total)}</div>
            ${productURL(offer.url) ? `<a href="${escapeHTML(productURL(offer.url))}" target="_blank" rel="noopener noreferrer">Открыть товар ↗</a>` : ''}
            ${customOffers.some(item => item.id === offer.id) ? `<button type="button" class="danger" data-delete-offer="${escapeHTML(offer.id)}">Удалить предложение</button>` : ''}
        </article>
    `).join('');
}

function updatePackLabel() {
    $('#pack-label').textContent = 'В упаковке, ' + materials[$('#offer-material').value].unit;
}

$('#material').addEventListener('change', () => {
    $('#offer-material').value = $('#material').value;
    updatePackLabel();
    renderMaterials();
});
$('#quantity').addEventListener('input', renderMaterials);
$('#offer-material').addEventListener('change', updatePackLabel);

$('#offer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    const data = formData(event.target);
    const offer = {
        id: uid(), material: data.material, store: data.store.trim(),
        pack: Number(data.pack), price: Number(data.price),
        delivery: Number(data.delivery), url: data.url.trim()
    };
    if (!validOffer(offer)) {
        $('#offer-message').textContent = 'Проверьте название магазина и числовые значения.';
        return;
    }
    if (offer.url && !productURL(offer.url)) {
        $('#offer-message').textContent = 'Укажите ссылку с http:// или https://.';
        return;
    }
    customOffers.push(offer);
    if (saveOffers()) $('#offer-message').textContent = 'Предложение сохранено.';
    event.target.reset();
    $('#material').value = offer.material;
    $('#offer-material').value = offer.material;
    updatePackLabel();
    renderMaterials();
});

$('#offers').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-offer]');
    if (!button) return;
    customOffers = customOffers.filter(offer => offer.id !== button.dataset.deleteOffer);
    if (saveOffers()) $('#offer-message').textContent = 'Предложение удалено.';
    renderMaterials();
});

updatePackLabel();
renderMaterials();
