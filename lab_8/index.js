// Загрузка с API
let dishes = [];

async function loadDishes() {
    try {
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const apiDishes = await response.json();
        
        dishes = apiDishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            price: dish.price,
            category: dish.category === 'main-course' ? 'main' : dish.category,
            count: dish.count,
            image: dish.image,
            kind: dish.kind
        }));
        
    } catch (error) {
        console.error('Ошибка при загрузке блюд:', error);
    }
}

const activeFilters = {};
const comboOptions = [
    { title: 'Комбо 1', description: 'Суп + Главное блюдо + Салат + Напиток', required: ['soup', 'main', 'salad', 'drink'] },
    { title: 'Комбо 2', description: 'Суп + Главное блюдо + Напиток', required: ['soup', 'main', 'drink'] },
    { title: 'Комбо 3', description: 'Главное блюдо + Салат + Напиток', required: ['main', 'salad', 'drink'] },
    { title: 'Комбо 4', description: 'Главное блюдо + Напиток', required: ['main', 'drink'] },
    { title: 'Комбо 5', description: 'Суп + Салат + Напиток', required: ['soup', 'salad', 'drink'] }
];

// localStorage функции
const getSelectedDishes = () => JSON.parse(localStorage.getItem('selectedDishes') || '{}');
const setSelectedDishes = (selected) => localStorage.setItem('selectedDishes', JSON.stringify(selected));
const clearSelectedDishes = () => localStorage.removeItem('selectedDishes');

function updateSelectedDish(category, dish) {
    const selected = getSelectedDishes();
    dish ? selected[category] = dish.id : delete selected[category];
    setSelectedDishes(selected);
    return selected;
}

// Инициализация
window.onload = async () => {
    await loadDishes();
    initLunchPage();
};

function initLunchPage() {
    renderCombos();
    renderAllCategories();
    setupEventListeners();
    updateOrderPanel();
}

function setupEventListeners() {
    document.getElementById('show-checkout-btn').onclick = showCheckoutSection;
    document.getElementById('back-to-lunch').onclick = showLunchSection;
    document.getElementById('order-form').onsubmit = submitOrder;
    
    document.getElementById('delivery_type').addEventListener('change', function() {
        document.getElementById('delivery_time_group').style.display = this.value === 'by_time' ? 'block' : 'none';
    });
}

function renderCombos() {
    const container = document.getElementById('combos-container');
    comboOptions.forEach(combo => {
        const comboEl = document.createElement('div');
        comboEl.className = 'combo-option';
        comboEl.innerHTML = `<div class="combo-title">${combo.title}</div><div class="combo-description">${combo.description}</div><div class="combo-note">Можно добавить десерт</div>`;
        container.appendChild(comboEl);
    });
}

function renderAllCategories() {
    const container = document.getElementById('dishes-container');
    container.innerHTML = '';
    
    const categories = [
        { id: 'soup', title: 'Супы', filters: ['рыбный', 'мясной', 'вегетарианский'] },
        { id: 'main', title: 'Главные блюда', filters: ['рыбное', 'мясное', 'вегетарианское'] },
        { id: 'salad', title: 'Салаты и стартеры', filters: ['рыбный', 'мясной', 'вегетарианский'] },
        { id: 'drink', title: 'Напитки', filters: ['холодный', 'горячий'] },
        { id: 'dessert', title: 'Десерты', filters: ['маленькая порция', 'средняя порция', 'большая порция'] }
    ];
    
    const kinds = {
        'рыбный': 'fish', 'мясной': 'meat', 'вегетарианский': 'veg', 'вегетарианское': 'veg',
        'рыбное': 'fish', 'мясное': 'meat', 'холодный': 'cold', 'горячий': 'hot',
        'маленькая порция': 'small', 'средняя порция': 'medium', 'большая порция': 'large'
    };
    
    categories.forEach(({id, title, filters}) => {
        const section = document.createElement('section');
        section.innerHTML = `<h2>${title}</h2>`;
        
        const filtersDiv = document.createElement('div');
        filtersDiv.className = 'filters';
        filters.forEach(text => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = text;
            button.onclick = () => toggleFilter(id, kinds[text], button);
            filtersDiv.appendChild(button);
        });
        
        const menuDiv = document.createElement('div');
        menuDiv.className = 'menu';
        menuDiv.id = `${id}-menu`;
        
        section.append(filtersDiv, menuDiv);
        container.appendChild(section);
        renderCategory(id);
    });
}

function renderCategory(category) {
    const menuElement = document.getElementById(`${category}-menu`);
    const selectedDishId = getSelectedDishes()[category];
    
    let categoryDishes = dishes.filter(d => d.category === category);
    if (activeFilters[category]) {
        categoryDishes = categoryDishes.filter(d => d.kind === activeFilters[category]);
    }
    
    menuElement.innerHTML = categoryDishes.length ? '' : '<p>Блюда не найдены</p>';
    
    categoryDishes.forEach(dish => {
        const isSelected = selectedDishId === dish.id;
        const dishElement = document.createElement('div');
        dishElement.className = `dish ${isSelected ? 'selected' : ''}`;
        dishElement.innerHTML = `
            <img src="${dish.image}" alt="${dish.name}">
            <p>${dish.name}</p>
            <p>${dish.count}</p>
            <p class="price">${dish.price} ₽</p>
            <button>${isSelected ? 'Убрать' : 'Добавить'}</button>
        `;
        
        dishElement.querySelector('button').onclick = () => handleDishClick(category, dish, dishElement);
        menuElement.appendChild(dishElement);
    });
}

function handleDishClick(category, dish, dishElement) {
    const selected = getSelectedDishes();
    const button = dishElement.querySelector('button');
    
    if (selected[category] === dish.id) {
        updateSelectedDish(category, null);
        dishElement.classList.remove('selected');
        button.textContent = 'Добавить';
    } else {
        const menuElement = document.getElementById(`${category}-menu`);
        const prevSelected = menuElement.querySelector('.dish.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
            prevSelected.querySelector('button').textContent = 'Добавить';
        }
        updateSelectedDish(category, dish);
        dishElement.classList.add('selected');
        button.textContent = 'Убрать';
    }
    updateOrderPanel();
}

function toggleFilter(category, kind, button) {
    const section = button.closest('section');
    section.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    if (!button.classList.contains('active')) {
        button.classList.add('active');
        activeFilters[category] = kind;
    } else {
        activeFilters[category] = null;
    }
    renderCategory(category);
}

function updateOrderPanel() {
    const selected = getSelectedDishes();
    const orderPanel = document.getElementById('order-panel');
    const checkoutBtn = document.getElementById('show-checkout-btn');
    
    let total = 0, hasSelection = false;
    Object.values(selected).forEach(id => {
        const dish = dishes.find(d => d.id === id);
        if (dish) { total += dish.price; hasSelection = true; }
    });
    
    if (hasSelection) {
        orderPanel.style.display = 'block';
        document.getElementById('panel-total-price').textContent = `${total} ₽`;
        const valid = checkCombo(selected);
        checkoutBtn.disabled = !valid;
        checkoutBtn.classList.toggle('disabled', !valid);
    } else {
        orderPanel.style.display = 'none';
    }
}

function showCheckoutSection() {
    document.getElementById('dishes-container').style.display = 'none';
    document.getElementById('lunch-combos').style.display = 'none';
    document.getElementById('order-panel').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'block';
    renderCheckoutOrderComposition();
    updateFormOrderSummary();
}

function showLunchSection() {
    document.getElementById('dishes-container').style.display = 'block';
    document.getElementById('lunch-combos').style.display = 'block';
    document.getElementById('checkout-section').style.display = 'none';
    updateOrderPanel();
}

function renderCheckoutOrderComposition() {
    const container = document.getElementById('checkout-order-items');
    const emptyMessage = document.getElementById('checkout-empty-message');
    const selected = getSelectedDishes();
    
    container.innerHTML = '';
    const hasSelection = Object.keys(selected).length > 0;
    emptyMessage.style.display = hasSelection ? 'none' : 'block';
    container.style.display = hasSelection ? 'grid' : 'none';
    
    Object.entries(selected).forEach(([category, dishId]) => {
        const dish = dishes.find(d => d.id === dishId);
        if (dish) {
            const dishElement = document.createElement('div');
            dishElement.className = 'dish';
            dishElement.innerHTML = `
                <img src="${dish.image}" alt="${dish.name}">
                <p>${dish.name}</p>
                <p>${dish.count}</p>
                <p class="price">${dish.price} ₽</p>
                <button class="remove-btn">Удалить</button>
            `;
            dishElement.querySelector('.remove-btn').onclick = () => {
                updateSelectedDish(category, null);
                renderCheckoutOrderComposition();
                updateFormOrderSummary();
                if (Object.keys(getSelectedDishes()).length === 0) showLunchSection();
            };
            container.appendChild(dishElement);
        }
    });
}

function updateFormOrderSummary() {
    const container = document.getElementById('form-order-items');
    const selected = getSelectedDishes();
    let total = 0;
    
    container.innerHTML = '';
    const categories = [
        { id: 'soup', name: 'Суп' },
        { id: 'main', name: 'Главное блюдо' },
        { id: 'salad', name: 'Салат' },
        { id: 'drink', name: 'Напиток' },
        { id: 'dessert', name: 'Десерт' }
    ];
    
    categories.forEach(cat => {
        const dish = dishes.find(d => d.id === selected[cat.id]);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'form-order-item';
        if (dish) {
            itemDiv.innerHTML = `<span>${cat.name}: ${dish.name}</span><span class="price">${dish.price} ₽</span>`;
            total += dish.price;
        } else {
            itemDiv.innerHTML = `<span>${cat.name}: ${cat.id === 'main' ? 'Не выбрано' : 'Не выбран'}</span>`;
        }
        container.appendChild(itemDiv);
    });
    
    document.getElementById('form-total-price').textContent = `${total} ₽`;
}

function checkCombo(selected) {
    const hasSoup = !!selected.soup, hasMain = !!selected.main, hasSalad = !!selected.salad, hasDrink = !!selected.drink;
    if ((hasSoup && hasMain && hasSalad && hasDrink) || (hasSoup && hasMain && hasDrink) || 
        (hasMain && hasSalad && hasDrink) || (hasMain && hasDrink) || (hasSoup && hasSalad && hasDrink)) {
        return true;
    }
    return false;
}

async function submitOrder(event) {
    event.preventDefault();
    const selected = getSelectedDishes();
    
    if (!checkCombo(selected)) {
        alert('Неполный заказ. Выберите одно из доступных комбо.');
        return;
    }
    
    const deliveryType = document.getElementById('delivery_type').value;
    let deliveryTime = null;
    
    if (deliveryType === 'by_time') {
        deliveryTime = document.getElementById('delivery_time').value;
        if (!deliveryTime) {
            alert('Пожалуйста, выберите время доставки');
            return;
        }
        const time = new Date(`2000-01-01T${deliveryTime}`);
        const min = new Date('2000-01-01T07:00'), max = new Date('2000-01-01T23:00');
        if (time < min || time > max) {
            alert('Время доставки должно быть с 7:00 до 23:00');
            return;
        }
        const now = new Date(), selectedTime = new Date();
        const [h, m] = deliveryTime.split(':');
        selectedTime.setHours(parseInt(h), parseInt(m), 0, 0);
        if (selectedTime < now) {
            alert('Время доставки не может быть раньше текущего времени');
            return;
        }
    }
    
    const orderData = {
        full_name: document.getElementById('full_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        delivery_address: document.getElementById('delivery_address').value,
        delivery_type: deliveryType,
        comment: document.getElementById('comment').value,
        subscribe: document.getElementById('subscribe').checked ? 1 : 0
    };
    
    if (deliveryTime) orderData.delivery_time = deliveryTime;
    if (selected.soup) orderData.soup_id = selected.soup;
    if (selected.main) orderData.main_course_id = selected.main;
    if (selected.salad) orderData.salad_id = selected.salad;
    if (selected.drink) orderData.drink_id = selected.drink;
    if (selected.dessert) orderData.dessert_id = selected.dessert;
    
    try {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
            alert('Ошибка: API ключ не найден.');
            return;
        }
        
        const response = await fetch(`https://edu.std-900.ist.mospolytech.ru/labs/api/orders?api_key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при отправке заказа');
        }
        
        clearSelectedDishes();
        alert('Заказ успешно оформлен!');
        showLunchSection();
        document.getElementById('order-form').reset();
        
    } catch (error) {
        alert(`Ошибка при оформлении заказа: ${error.message}`);
    }
}