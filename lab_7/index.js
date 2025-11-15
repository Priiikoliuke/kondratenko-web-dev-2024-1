// Загрузка с API
async function loadDishes() {
    try {
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        const apiDishes = await response.json();
        
        // Преобразуем данные API в удобный формат
        dishes = apiDishes.map(dish => {
            // Приводим категории к нашему формату
            let category = dish.category;
            if (category === 'main-course') {
                category = 'main';
            }
            
            return {
                keyword: dish.keyword,
                name: dish.name,
                price: dish.price,
                category: category,
                count: dish.count,
                image: dish.image,
                kind: dish.kind
            };
        });
        
        console.log('Загружено блюд:', dishes.length);
        
    } catch (error) {
        console.error('Ошибка при загрузке блюд:', error);
    }
}

const selected = {};
const activeFilters = {};

const comboOptions = [
    {
        title: 'Комбо 1',
        description: 'Суп + Главное блюдо + Салат + Напиток',
        required: ['soup', 'main', 'salad', 'drink']
    },
    {
        title: 'Комбо 2',
        description: 'Суп + Главное блюдо + Напиток',
        required: ['soup', 'main', 'drink']
    },
    {
        title: 'Комбо 3',
        description: 'Главное блюдо + Салат + Напиток',
        required: ['main', 'salad', 'drink']
    },
    {
        title: 'Комбо 4',
        description: 'Главное блюдо + Напиток',
        required: ['main', 'drink']
    },
    {
        title: 'Комбо 5',
        description: 'Суп + Салат + Напиток',
        required: ['soup', 'salad', 'drink']
    }
];

window.onload = async () => {
    await loadDishes();
    renderCombos();
    renderAllCategories();
};

function renderCombos() {
    const container = document.getElementById('combos-container');

    comboOptions.forEach(combo => {
        const comboEl = document.createElement('div');
        comboEl.className = 'combo-option';
        comboEl.innerHTML = `
                    <div class="combo-title">${combo.title}</div>
                    <div class="combo-description">${combo.description}</div>
                    <div class="combo-note">Можно добавить десерт</div>
                `;
        container.appendChild(comboEl);
    });
}

function renderAllCategories() {
    const container = document.getElementById('dishes-container');
    container.innerHTML = '';

    createCategorySection('soup', 'Супы', [
        { text: 'рыбный', kind: 'fish' },
        { text: 'мясной', kind: 'meat' },
        { text: 'вегетарианский', kind: 'veg' }
    ]);

    createCategorySection('main', 'Главные блюда', [
        { text: 'рыбное', kind: 'fish' },
        { text: 'мясное', kind: 'meat' },
        { text: 'вегетарианское', kind: 'veg' }
    ]);

    createCategorySection('salad', 'Салаты и стартеры', [
        { text: 'рыбный', kind: 'fish' },
        { text: 'мясной', kind: 'meat' },
        { text: 'вегетарианский', kind: 'veg' }
    ]);

    createCategorySection('drink', 'Напитки', [
        { text: 'холодный', kind: 'cold' },
        { text: 'горячий', kind: 'hot' }
    ]);

    createCategorySection('dessert', 'Десерты', [
        { text: 'маленькая порция', kind: 'small' },
        { text: 'средняя порция', kind: 'medium' },
        { text: 'большая порция', kind: 'large' }
    ]);
}

function createCategorySection(category, title, filters) {
    const container = document.getElementById('dishes-container');

    const section = document.createElement('section');
    section.innerHTML = `<h2>${title}</h2>`;

    const filtersDiv = document.createElement('div');
    filtersDiv.className = 'filters';

    filters.forEach(filter => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = filter.text;
        button.dataset.kind = filter.kind;
        button.onclick = () => toggleFilter(category, filter.kind, button);
        filtersDiv.appendChild(button);
    });

    section.appendChild(filtersDiv);

    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu';
    menuDiv.id = `${category}-menu`;
    section.appendChild(menuDiv);

    container.appendChild(section);

    renderCategory(category);
}

function renderCategory(category) {
    const menuElement = document.getElementById(`${category}-menu`);
    menuElement.innerHTML = '';

    let categoryDishes = dishes.filter(d => d.category === category);

    if (activeFilters[category]) {
        categoryDishes = categoryDishes.filter(d => d.kind === activeFilters[category]);
    }

    if (categoryDishes.length === 0) {
        menuElement.innerHTML = '<p>Блюда не найдены</p>';
        return;
    }

    categoryDishes.forEach(dish => {
        const dishElement = document.createElement('div');
        dishElement.className = 'dish';
        dishElement.innerHTML = `
                    <img src="${dish.image}" alt="${dish.name}">
                    <p>${dish.name}</p>
                    <p>${dish.count}</p>
                    <p class="price">${dish.price} ₽</p>
                    <button>Добавить</button>
                `;
        dishElement.querySelector('button').onclick = () => selectDish(dish);
        menuElement.appendChild(dishElement);
    });
}

function toggleFilter(category, kind, button) {
    const isActive = button.classList.contains('active');

    const categorySection = button.closest('section');
    categorySection.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (!isActive) {
        button.classList.add('active');
        activeFilters[category] = kind;
    } else {
        activeFilters[category] = null;
    }

    renderCategory(category);
}

function selectDish(dish) {
    selected[dish.category] = dish;
    updateOrder();
}

function updateOrder() {
    const categories = ['soup', 'main', 'salad', 'drink', 'dessert'];
    let total = 0;
    let hasSelection = false;

    categories.forEach(category => {
        const orderElement = document.getElementById(`${category}-order`).querySelector('.order-item');
        if (selected[category]) {
            orderElement.innerHTML = `<span>${selected[category].name}</span><span>${selected[category].price} ₽</span>`;
            total += selected[category].price;
            hasSelection = true;
        } else {
            const notSelectedText = category === 'drink' ? 'Напиток не выбран' : 'Блюдо не выбрано';
            orderElement.innerHTML = `<span>${notSelectedText}</span>`;
        }
    });

    document.getElementById('order-empty').style.display = hasSelection ? 'none' : 'block';
    document.getElementById('order-items').style.display = hasSelection ? 'block' : 'none';
    document.getElementById('total').style.display = hasSelection ? 'block' : 'none';
    document.getElementById('total-price').textContent = `${total} ₽`;
}

function checkCombo() {
    const hasSoup = selected.soup;
    const hasMain = selected.main;
    const hasSalad = selected.salad;
    const hasDrink = selected.drink;

    // Проверка всех возможных комбинаций
    if (hasSoup && hasMain && hasSalad && hasDrink) {
        return { valid: true, combo: 'full' };
    }
    if (hasSoup && hasMain && hasDrink) {
        return { valid: true, combo: 'soup_main_drink' };
    }
    if (hasMain && hasSalad && hasDrink) {
        return { valid: true, combo: 'main_salad_drink' };
    }
    if (hasMain && hasDrink) {
        return { valid: true, combo: 'main_drink' };
    }
    if (hasSoup && hasSalad && hasDrink) {
        return { valid: true, combo: 'soup_salad_drink' };
    }

    // Если комбо не собрано, определение недостающих элементов
    const missing = [];
    if (!hasSoup && !hasMain && !hasSalad && !hasDrink) {
        missing.push('любое основное блюдо и напиток');
    } else {
        // Определение ближайших комбо
        if (!hasSoup && hasMain && hasSalad && hasDrink) {
            missing.push('суп');
        } else if (hasSoup && !hasMain && hasSalad && hasDrink) {
            missing.push('главное блюдо');
        } else if (hasSoup && !hasSalad && hasDrink) {
            missing.push('салат');
        } else if (hasSoup && hasMain && hasSalad && !hasDrink) {
            missing.push('напиток');
        } else {
            // Общий случай
            if (!hasMain) missing.push('главное блюдо');
            if (!hasDrink) missing.push('напиток');
            if (hasMain && hasDrink && !hasSoup && !hasSalad) {
            } else {
                if (!hasSoup && hasMain && hasDrink) missing.push('суп или салат');
                if (!hasSalad && hasMain && hasDrink) missing.push('салат или суп');
            }
        }
    }

    return { valid: false, missing };
}

function showNotification(missing) {
    const notification = document.createElement('div');
    notification.className = 'notification';

    let message = '';
    if (missing.includes('любое основное блюдо и напиток')) {
        message = 'Выберите любое основное блюдо и напиток для составления комбо';
    } else {
        message = `Для завершения заказа необходимо добавить: ${missing.join(', ')}`;
    }

    notification.innerHTML = `
                <div class="notification-content">
                    <h3>Неполный заказ</h3>
                    <p>${message}</p>
                    <button class="notification-btn">Окей</button>
                </div>
            `;

    document.body.appendChild(notification);

    notification.querySelector('.notification-btn').onclick = () => {
        document.body.removeChild(notification);
    };
}

function sendOrder() {
    const check = checkCombo();
    if (!check.valid) {
        showNotification(check.missing);
        return;
    }

    // О блюдах
    const orderArray = [];

    ['soup', 'main', 'salad', 'drink', 'dessert'].forEach(c => {
        if (selected[c]) {
            orderArray.push({
                category: c,
                keyword: selected[c].keyword,
                name: selected[c].name,
                price: selected[c].price
            });
        }
    });

    // О клиенте
    const customerInfo = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        totalPrice: parseInt(document.getElementById('total-price').textContent)
    };

    console.log('Информация о клиенте:', customerInfo);
    console.log('Выбранные блюда:', orderArray);
    alert('Заказ успешно отправлен! Проверьте консоль для деталей.');
}

document.getElementById('send-order').onclick = sendOrder;