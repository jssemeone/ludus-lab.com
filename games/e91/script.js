// Константы игры
const FINAL_KEY_LENGTH = 8;
const MIN_MATCHES_FOR_SIFTING = 8;

// Состояние игры
let gameState = {
    selectedAliceBasis: 'a1',
    selectedBobBasis: 'b1',
    rawKey: [],
    eveIntercepts: 0,
    matchingIndices: [],
    semiAutoInterval: null,
    autoInterval: null,
    isSemiAutoActive: false,
    isAutoActive: false,
    siftKeyPressed: false,
    lastSiftNotificationCount: -1,
    interceptTimeout: null,
    interceptHideTimeout: null,
    classicalChannelInterval: null
};

// Элементы DOM
const elements = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Игра E91: Загрузка скрипта");
    initializeElements();
    initializeGame();
});

// Инициализация элементов DOM
function initializeElements() {
    elements.aliceBasisOptions = document.querySelectorAll('.basis-option[data-basis^="a"]');
    elements.bobBasisOptions = document.querySelectorAll('.basis-option[data-basis^="b"]');
    elements.manualModeBtn = document.getElementById('manualModeBtn');
    elements.semiAutoBtn = document.getElementById('semiAutoBtn');
    elements.autoModeBtn = document.getElementById('autoModeBtn');
    elements.siftKeyBtn = document.getElementById('siftKey');
    elements.newKeyBtn = document.getElementById('newKeyBtn');
    elements.finalKeySection = document.getElementById('finalKeySection');
    elements.rawKeyGrid = document.getElementById('rawKeyGrid');
    elements.finalKeyGrid = document.getElementById('finalKeyGrid');
    elements.rawKeyCount = document.getElementById('rawKeyCount');
    elements.matchCount = document.getElementById('matchCount');
    elements.interceptCount = document.getElementById('interceptCount');
    elements.explanation = document.getElementById('explanation');
    elements.aliceStatus = document.getElementById('aliceStatus');
    elements.bobStatus = document.getElementById('bobStatus');
    elements.eveAlert = document.getElementById('eveAlert');
    elements.eveIcon = document.getElementById('eveIcon');
    elements.aliceBasisIndicator = document.getElementById('aliceBasis');
    elements.bobBasisElement = document.getElementById('bobBasis');
    elements.quantumChannel = document.getElementById('quantumChannel');
    elements.classicalChannel = document.getElementById('classicalChannel');
    elements.protocolHeader = document.getElementById('protocolHeader');
    elements.protocolContent = document.getElementById('protocolContent');
    elements.bitHistory = document.getElementById('bitHistory');
    elements.bitHistoryInfo = document.getElementById('bitHistoryInfo');
    elements.siftNotification = document.getElementById('siftNotification');
    elements.siftKeyNotification = document.getElementById('siftKeyNotification');
    elements.entangledPhotons = document.getElementById('entangledPhotons');
}

// Основная инициализация игры
function initializeGame() {
    createKeyGrid(elements.rawKeyGrid, 16);
    createKeyGrid(elements.finalKeyGrid, FINAL_KEY_LENGTH);
    
    setupEventListeners();
    resetGame();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики выбора базиса Алисы
    elements.aliceBasisOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectBasis('alice', this);
        });
    });
    
    // Обработчики выбора базиса Боба
    elements.bobBasisOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectBasis('bob', this);
        });
    });
    
    // Обработчики кнопок
    elements.manualModeBtn.addEventListener('click', () => sendEntangledPair());
    elements.semiAutoBtn.addEventListener('click', toggleSemiAutoMode);
    elements.autoModeBtn.addEventListener('click', toggleAutoMode);
    elements.siftKeyBtn.addEventListener('click', siftKey);
    elements.newKeyBtn.addEventListener('click', resetGame);
    elements.protocolHeader.addEventListener('click', toggleProtocol);
}

// Функции управления статусами
function updateAliceStatus(basis, result) {
    const statusLine1 = elements.aliceStatus.querySelector('.status-line-1');
    const statusLine2 = elements.aliceStatus.querySelector('.status-line-2');
    statusLine1.textContent = `Применила базис: ${basis}`;
    if (result !== null) {
        statusLine2.textContent = `Результат измерения: ${result}`;
    }
}

function updateBobStatus(basis, result) {
    const statusLine1 = elements.bobStatus.querySelector('.status-line-1');
    const statusLine2 = elements.bobStatus.querySelector('.status-line-2');
    statusLine1.textContent = `Применил базис: ${basis}`;
    if (result !== null) {
        statusLine2.textContent = `Результат измерения: ${result}`;
    }
}

// Функции управления режимами
function toggleSemiAutoMode() {
    if (gameState.siftKeyPressed) return;
    if (gameState.isSemiAutoActive) {
        stopSemiAuto();
    } else {
        stopAuto();
        startSemiAuto();
    }
}

function toggleAutoMode() {
    if (gameState.siftKeyPressed) return;
    if (gameState.isAutoActive) {
        stopAuto();
    } else {
        stopSemiAuto();
        startAuto();
    }
}

function startSemiAuto() {
    gameState.isSemiAutoActive = true;
    elements.semiAutoBtn.classList.add('active-mode');
    gameState.semiAutoInterval = setInterval(() => {
        if (gameState.rawKey.length < 100 && !gameState.siftKeyPressed) {
            sendEntangledPair();
        }
    }, 1500);
}

function stopSemiAuto() {
    gameState.isSemiAutoActive = false;
    elements.semiAutoBtn.classList.remove('active-mode');
    if (gameState.semiAutoInterval) {
        clearInterval(gameState.semiAutoInterval);
        gameState.semiAutoInterval = null;
    }
}

function startAuto() {
    gameState.isAutoActive = true;
    elements.autoModeBtn.classList.add('active-mode');
    gameState.autoInterval = setInterval(() => {
        if (gameState.rawKey.length < 100 && !gameState.siftKeyPressed) {
            selectRandomBases();
            sendEntangledPair();
        }
    }, 1500);
}

function stopAuto() {
    gameState.isAutoActive = false;
    elements.autoModeBtn.classList.remove('active-mode');
    if (gameState.autoInterval) {
        clearInterval(gameState.autoInterval);
        gameState.autoInterval = null;
    }
}

// Функции управления базисами
function selectBasis(character, element) {
    const options = character === 'alice' ? elements.aliceBasisOptions : elements.bobBasisOptions;
    
    // Снимаем выделение со всех базисов
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Выбираем новый вариант
    element.classList.add('selected');
    
    const basis = element.getAttribute('data-basis');
    const basisName = basis.toUpperCase();
    
    if (character === 'alice') {
        gameState.selectedAliceBasis = basis;
        updateAliceStatus(basisName, null);
    } else {
        gameState.selectedBobBasis = basis;
        updateBobStatus(basisName, null);
    }
}

function selectRandomBases() {
    const randomAliceBasis = ['a1', 'a2', 'a3'][Math.floor(Math.random() * 3)];
    const randomBobBasis = ['b1', 'b2', 'b3'][Math.floor(Math.random() * 3)];
    
    // Выбираем соответствующие элементы базисов
    elements.aliceBasisOptions.forEach(opt => {
        if (opt.getAttribute('data-basis') === randomAliceBasis) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    elements.bobBasisOptions.forEach(opt => {
        if (opt.getAttribute('data-basis') === randomBobBasis) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    gameState.selectedAliceBasis = randomAliceBasis;
    gameState.selectedBobBasis = randomBobBasis;
    
    // Обновляем статусы
    updateAliceStatus(randomAliceBasis.toUpperCase(), null);
    updateBobStatus(randomBobBasis.toUpperCase(), null);
}

// Функции управления каналами
function activateQuantumChannel() {
    elements.quantumChannel.classList.remove('inactive');
    elements.quantumChannel.classList.add('active');
    elements.classicalChannel.classList.remove('active');
    elements.classicalChannel.classList.add('inactive');
    stopClassicalChannelAnimation();
    elements.entangledPhotons.classList.remove('inactive');
}

function activateClassicalChannel() {
    elements.quantumChannel.classList.remove('active');
    elements.quantumChannel.classList.add('inactive');
    elements.classicalChannel.classList.remove('inactive');
    elements.classicalChannel.classList.add('active');
    startClassicalChannelAnimation();
    elements.entangledPhotons.classList.add('inactive');
}

function startClassicalChannelAnimation() {
    if (gameState.classicalChannelInterval) return;
    
    gameState.classicalChannelInterval = setInterval(() => {
        // Пакет от Алисы к Бобу
        const packetToBob = document.createElement('div');
        packetToBob.className = 'data-packet to-bob';
        elements.classicalChannel.appendChild(packetToBob);
        
        // Пакет от Боба к Алисе (с задержкой)
        setTimeout(() => {
            const packetToAlice = document.createElement('div');
            packetToAlice.className = 'data-packet to-alice';
            elements.classicalChannel.appendChild(packetToAlice);
            
            // Удаляем пакеты после завершения анимации
            setTimeout(() => {
                if (packetToBob.parentNode) {
                    packetToBob.parentNode.removeChild(packetToBob);
                }
            }, 2000);
            
            setTimeout(() => {
                if (packetToAlice.parentNode) {
                    packetToAlice.parentNode.removeChild(packetToAlice);
                }
            }, 2000);
        }, 1000);
    }, 1500);
}

function stopClassicalChannelAnimation() {
    if (gameState.classicalChannelInterval) {
        clearInterval(gameState.classicalChannelInterval);
        gameState.classicalChannelInterval = null;
    }
    // Удаляем все пакеты данных
    const packets = elements.classicalChannel.querySelectorAll('.data-packet');
    packets.forEach(packet => {
        if (packet.parentNode) {
            packet.parentNode.removeChild(packet);
        }
    });
}

// Основная логика игры
function sendEntangledPair() {
    if (gameState.siftKeyPressed) return;
    
    const currentAliceBasis = gameState.selectedAliceBasis;
    const currentBobBasis = gameState.selectedBobBasis;
    
    // Создаем фотоны
    const photonToAlice = document.createElement('div');
    photonToAlice.className = 'photon to-alice';
    photonToAlice.textContent = '?';
    
    const photonToBob = document.createElement('div');
    photonToBob.className = 'photon to-bob';
    photonToBob.textContent = '?';
    
    // Добавляем в канал
    elements.quantumChannel.appendChild(photonToAlice);
    elements.quantumChannel.appendChild(photonToBob);
    
    // Анимация базисов
    showBasisIndicators(currentAliceBasis, currentBobBasis);
    
    // Случайно решаем, будет ли перехват
    const shouldIntercept = Math.random() < 0.3;
    
    if (shouldIntercept) {
        showEveInterception();
    }
    
    // Анимация движения фотонов
    setTimeout(() => {
        photonToAlice.style.animation = 'photonTravelToAlice 2s linear forwards';
        photonToBob.style.animation = 'photonTravelToBob 2s linear forwards';
        
        // Анимация завершена
        setTimeout(() => {
            // Удаляем фотоны и скрываем базисы
            cleanupAfterAnimation(photonToAlice, photonToBob);
            
            // Измерение запутанных фотонов
            measureEntangledPair(shouldIntercept, currentAliceBasis, currentBobBasis);
            
            // Сбрасываем таймауты
            resetInterceptTimeouts();
        }, 2000);
    }, 10);
}

function showBasisIndicators(aliceBasis, bobBasis) {
    // Анимация базиса Алисы
    if (elements.aliceBasisIndicator) {
        elements.aliceBasisIndicator.style.opacity = '1';
        if (aliceBasis === 'a1') {
            elements.aliceBasisIndicator.textContent = '|';
            elements.aliceBasisIndicator.style.background = 'rgba(0, 128, 0, 0.2)';
            elements.aliceBasisIndicator.style.borderColor = '#008000';
        } else if (aliceBasis === 'a2') {
            elements.aliceBasisIndicator.textContent = '/';
            elements.aliceBasisIndicator.style.background = 'rgba(255, 140, 0, 0.2)';
            elements.aliceBasisIndicator.style.borderColor = '#ff8c00';
        } else {
            elements.aliceBasisIndicator.textContent = '—';
            elements.aliceBasisIndicator.style.background = 'rgba(10, 186, 181, 0.2)';
            elements.aliceBasisIndicator.style.borderColor = '#0abab5';
        }
    }
    
    // Анимация базиса Боба
    if (elements.bobBasisElement) {
        elements.bobBasisElement.style.opacity = '1';
        if (bobBasis === 'b1') {
            elements.bobBasisElement.textContent = '|';
            elements.bobBasisElement.style.background = 'rgba(0, 128, 0, 0.2)';
            elements.bobBasisElement.style.borderColor = '#008000';
        } else if (bobBasis === 'b2') {
            elements.bobBasisElement.textContent = '/';
            elements.bobBasisElement.style.background = 'rgba(255, 140, 0, 0.2)';
            elements.bobBasisElement.style.borderColor = '#ff8c00';
        } else {
            elements.bobBasisElement.textContent = '—';
            elements.bobBasisElement.style.background = 'rgba(10, 186, 181, 0.2)';
            elements.bobBasisElement.style.borderColor = '#0abab5';
        }
    }
}

function showEveInterception() {
    // Показываем Еву через некоторое время
    gameState.interceptTimeout = setTimeout(() => {
        if (elements.eveIcon) {
            elements.eveIcon.style.opacity = '1';
        }
        if (elements.eveAlert) {
            elements.eveAlert.style.display = 'block';
            setTimeout(() => {
                elements.eveAlert.style.display = 'none';
            }, 2000);
        }
    }, 300);
    
    // Скрываем Еву позже
    gameState.interceptHideTimeout = setTimeout(() => {
        if (elements.eveIcon) {
            elements.eveIcon.style.opacity = '0';
        }
    }, 2200);
}

function cleanupAfterAnimation(photonToAlice, photonToBob) {
    // Удаляем фотоны
    if (photonToAlice.parentNode) {
        photonToAlice.parentNode.removeChild(photonToAlice);
    }
    if (photonToBob.parentNode) {
        photonToBob.parentNode.removeChild(photonToBob);
    }
    
    // Скрываем базисы
    if (elements.aliceBasisIndicator) {
        elements.aliceBasisIndicator.style.opacity = '0';
    }
    if (elements.bobBasisElement) {
        elements.bobBasisElement.style.opacity = '0';
    }
}

function resetInterceptTimeouts() {
    if (gameState.interceptTimeout) {
        clearTimeout(gameState.interceptTimeout);
        gameState.interceptTimeout = null;
    }
}

function measureEntangledPair(wasIntercepted, aliceBasis, bobBasis) {
    // Результаты измерений для запутанных пар
    let aliceValue, bobValue;
    
    if (wasIntercepted) {
        // Если был перехват, Ева измерила в случайном базисе
        aliceValue = Math.round(Math.random()).toString();
        bobValue = Math.round(Math.random()).toString();
        
        // Увеличиваем счетчик перехватов
        gameState.eveIntercepts++;
        if (elements.interceptCount) {
            elements.interceptCount.textContent = gameState.eveIntercepts;
        }
    } else {
        // Без перехвата - корректные квантовые корреляции
        aliceValue = Math.round(Math.random()).toString();
        
        // Результат Боба зависит от базисов и результата Алисы
        if (aliceBasis.replace('a', '') === bobBasis.replace('b', '')) {
            // Если базисы совпадают, результаты антикоррелированы
            bobValue = aliceValue === '0' ? '1' : '0';
        } else {
            // Если базисы разные, результат случайный
            bobValue = Math.round(Math.random()).toString();
        }
    }
    
    // Отображаем результат
    setTimeout(() => {
        updateAliceStatus(aliceBasis.toUpperCase(), aliceValue);
        updateBobStatus(bobBasis.toUpperCase(), bobValue);
        
        // Передаем сохраненные значения
        addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted);
        
        // Скрываем базисы
        setTimeout(() => {
            if (elements.aliceBasisIndicator) {
                elements.aliceBasisIndicator.style.opacity = '0';
            }
            if (elements.bobBasisElement) {
                elements.bobBasisElement.style.opacity = '0';
            }
        }, 1500);
    }, 1000);
}

function addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted) {
    const index = gameState.rawKey.length;
    
    // Добавляем в сырую ключевую последовательность
    gameState.rawKey.push({
        aliceValue,
        aliceBasis,
        bobValue,
        bobBasis,
        wasIntercepted,
        matches: aliceBasis.replace('a', '') === bobBasis.replace('b', '')
    });
    
    // Если нужно добавить новую пару в сетку
    if (index >= elements.rawKeyGrid.children.length) {
        addKeyBit();
    }
    
    // Обновляем отображение
    updateRawKeyDisplay(index, aliceValue, aliceBasis, bobBasis, wasIntercepted);
    
    // Обновляем счетчики
    updateCounters();
    
    // Проверяем, можно ли просеять ключ
    checkSiftingAvailability();
}

function updateRawKeyDisplay(index, aliceValue, aliceBasis, bobBasis, wasIntercepted) {
    const rawKeyCells = elements.rawKeyGrid.querySelectorAll('.key-bit');
    if (index < rawKeyCells.length) {
        const cell = rawKeyCells[index];
        // Устанавливаем значение Алисы
        cell.textContent = aliceValue;
        
        // Цвет в зависимости от совпадения базисов
        if (aliceBasis.replace('a', '') === bobBasis.replace('b', '')) {
            cell.style.background = 'rgba(0, 107, 166, 0.7)';
            cell.style.borderColor = 'rgba(0, 136, 204, 0.4)';
        } else {
            cell.style.background = 'rgba(200, 50, 50, 0.2)';
            cell.style.borderColor = 'rgba(255, 68, 68, 0.3)';
        }
        
        // Отмечаем перехват
        if (wasIntercepted) {
            cell.classList.add('intercept');
        }
        
        // Анимируем появление новой пары
        cell.classList.add('new');
    }
}

function updateCounters() {
    // Обновляем счетчик
    if (elements.rawKeyCount) {
        elements.rawKeyCount.textContent = gameState.rawKey.length;
    }
    
    // Обновляем количество совпадений (без перехваченных)
    const matches = gameState.rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    if (elements.matchCount) {
        elements.matchCount.textContent = matches;
    }
    
    // Обновляем состояние кнопки Просеять ключ
    updateSiftButtonState();
}

function updateSiftButtonState() {
    const matches = gameState.rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    elements.siftKeyBtn.disabled = !isSiftingAvailable() || gameState.siftKeyPressed;
    
    // Обновляем подсветку кнопки Просеять ключ
    if (!elements.siftKeyBtn.disabled) {
        elements.siftKeyBtn.classList.add('sift-active');
    } else {
        elements.siftKeyBtn.classList.remove('sift-active');
    }
}

function isSiftingAvailable() {
    const matches = gameState.rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    return matches >= MIN_MATCHES_FOR_SIFTING;
}

function checkSiftingAvailability() {
    const matches = gameState.rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    
    // Проверяем, достаточно ли совпадений для просеивания (без перехваченных)
    if (matches >= MIN_MATCHES_FOR_SIFTING) {
        // Показываем уведомление каждые 4 пары (вместо 7)
        if (gameState.lastSiftNotificationCount === -1 || matches - gameState.lastSiftNotificationCount >= 4) {
            // Обновляем счетчик последнего уведомления
            gameState.lastSiftNotificationCount = matches;
            
            // Показываем уведомление
            if (elements.siftNotification) {
                elements.siftNotification.style.display = 'block';
                setTimeout(() => {
                    elements.siftNotification.style.display = 'none';
                }, 3000);
            }
            
            // Обновляем объяснение
            if (elements.explanation) {
                elements.explanation.innerHTML = `
                    <p>Вы отправили достаточно запутанных пар! Нажмите "Просеять ключ", чтобы создать секретный ключ.</p>
                    <p>Только совпадающие базисы без перехвата (${matches}) будут использованы для формирования финального ключа.</p>
                `;
            }
        }
    }
}

// Функции управления ключами
function createKeyGrid(gridElement, size) {
    gridElement.innerHTML = '';
    for (let i = 0; i < size; i++) {
        const keyBit = document.createElement('div');
        keyBit.className = 'key-bit';
        keyBit.dataset.index = i;
        // Добавляем обработчик клика для информации
        keyBit.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            showBitHistory(index);
        });
        gridElement.appendChild(keyBit);
    }
    // Обновляем CSS для динамического размера сетки
    gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
}

function addKeyBit() {
    // Создаем новый кубит
    const keyBit = document.createElement('div');
    keyBit.className = 'key-bit';
    keyBit.dataset.index = gameState.rawKey.length;
    // Добавляем обработчик клика для информации
    keyBit.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        showBitHistory(index);
    });
    // Добавляем в сетку
    elements.rawKeyGrid.appendChild(keyBit);
    // Обновляем CSS для динамического размера сетки
    elements.rawKeyGrid.style.gridTemplateColumns = `repeat(${elements.rawKeyGrid.children.length}, 1fr)`;
    return keyBit;
}

function showBitHistory(index) {
    if (index >= gameState.rawKey.length) return;
    const pair = gameState.rawKey[index];
    
    // Формируем историю
    let historyHTML = `<div class="history-title">История пары #${index}:</div>`;
    
    // Базис Алисы
    let aliceBasisSymbol = getBasisSymbol(pair.aliceBasis);
    let aliceBasisClass = getBasisClass(pair.aliceBasis, 'a');
    historyHTML += `<div class="history-item">Алиса измерила в: <span class="${aliceBasisClass}">${aliceBasisSymbol} (Базис ${pair.aliceBasis.toUpperCase()})</span></div>`;
    
    // Базис Боба
    let bobBasisSymbol = getBasisSymbol(pair.bobBasis);
    let bobBasisClass = getBasisClass(pair.bobBasis, 'b');
    historyHTML += `<div class="history-item">Боб измерил в: <span class="${bobBasisClass}">${bobBasisSymbol} (Базис ${pair.bobBasis.toUpperCase()})</span></div>`;
    
    // Результаты измерений
    historyHTML += `<div class="history-item">Результат Алисы: <span class="matched">${pair.aliceValue}</span></div>`;
    historyHTML += `<div class="history-item">Результат Боба: <span class="matched">${pair.bobValue}</span></div>`;
    
    // Перехват Евой
    if (pair.wasIntercepted) {
        historyHTML += `<div class="history-item">⚠️ Перехват: <span class="intercepted">Да</span></div>`;
    } else {
        historyHTML += `<div class="history-item">Перехват: Нет</div>`;
    }
    
    // Совпадение базисов
    if (pair.matches) {
        historyHTML += `<div class="history-item">✓ Совпадение базисов: <span class="matched">Да</span></div>`;
    } else {
        historyHTML += `<div class="history-item">✗ Совпадение базисов: Нет</div>`;
    }
    
    // Статус использования
    historyHTML += getUsageStatus(pair, index);
    
    // Отображаем историю
    elements.bitHistory.innerHTML = historyHTML;
    elements.bitHistory.style.display = 'block';
    
    // Скрываем уведомление о необходимости просмотре истории
    hideBitHistoryInfo();
}

function getBasisSymbol(basis) {
    switch(basis) {
        case 'a1': case 'b1': return '|';
        case 'a2': case 'b2': return '/';
        case 'a3': case 'b3': return '—';
        default: return '?';
    }
}

function getBasisClass(basis, prefix) {
    switch(basis) {
        case `${prefix}1`: return 'basis-a1';
        case `${prefix}2`: return 'basis-a2';
        case `${prefix}3`: return 'basis-a3';
        default: return '';
    }
}

function getUsageStatus(pair, index) {
    if (pair.wasIntercepted) {
        return `<div class="history-item history-status">Статус: <span class="status-intercepted">Отброшена (скомпрометирована)</span></div>`;
    } else if (pair.matches) {
        // Проверяем, является ли пара избыточной
        const indexInMatching = gameState.matchingIndices.indexOf(index);
        if (indexInMatching >= 0 && indexInMatching >= FINAL_KEY_LENGTH) {
            return `<div class="history-item history-status">Статус: <span class="status-excess">Подходит для формирования ключа, но является избыточной</span></div>`;
        } else if (indexInMatching >= 0) {
            return `<div class="history-item history-status">Статус: <span class="status-used">Используется в ключе</span></div>`;
        }
    } else {
        return `<div class="history-item history-status">Статус: <span class="status-not-matched">Базисы не совпали</span></div>`;
    }
    return '';
}

function hideBitHistoryInfo() {
    if (elements.bitHistoryInfo && elements.bitHistoryInfo.style.display !== 'none') {
        elements.bitHistoryInfo.style.opacity = '0';
        setTimeout(() => {
            elements.bitHistoryInfo.style.display = 'none';
        }, 300);
    }
}

function siftKey() {
    // Устанавливаем флаг, что кнопка Просеять ключ была нажата
    gameState.siftKeyPressed = true;
    
    // Останавливаем все режимы
    stopSemiAuto();
    stopAuto();
    
    // Отключаем все кнопки
    setButtonsDisabled(true);
    
    // Деактивируем квантовый канал
    elements.quantumChannel.classList.remove('active');
    elements.quantumChannel.classList.add('inactive');
    
    // Переключаем каналы: выключаем квантовый, включаем классический
    activateClassicalChannel();
    
    // Получаем совпадающие биты и их индексы (исключая перехваченные)
    gameState.matchingIndices = [];
    const matchingBits = gameState.rawKey
        .map((item, index) => {
            // Исключаем перехваченные пары
            if (item.matches && !item.wasIntercepted) {
                gameState.matchingIndices.push(index);
                return item.aliceValue;
            }
            return null;
        })
        .filter(bit => bit !== null);
    
    // Проверяем, достаточно ли битов для формирования 8-битного ключа
    if (matchingBits.length < FINAL_KEY_LENGTH) {
        handleInsufficientData(matchingBits.length);
        return;
    }
    
    // Формируем финальный ключ
    createFinalKey(matchingBits);
}

function handleInsufficientData(matchingBitsLength) {
    if (elements.explanation) {
        elements.explanation.innerHTML = `
            <p>⚠️ Недостаточно данных для формирования 8-битного ключа!</p>
            <p>Вам нужно отправить еще запутанных пар, чтобы после исключения перехваченных осталось как минимум 8 совпадающих.</p>
            <p>Сейчас у вас ${matchingBitsLength} подходящих пар.</p>
        `;
    }
    // Включаем кнопки обратно
    gameState.siftKeyPressed = false;
    setButtonsDisabled(false);
    // Восстанавливаем пульсацию источника
    elements.entangledPhotons.classList.remove('inactive');
}

function createFinalKey(matchingBits) {
    // Берем первые 8 бит для финального ключа
    const finalKey = matchingBits.slice(0, FINAL_KEY_LENGTH);
    
    // Показываем область финального ключа
    if (elements.finalKeySection) {
        elements.finalKeySection.style.display = 'block';
    }
    
    // Отображаем финальный ключ
    displayFinalKey(finalKey);
    
    // Обновляем объяснение
    updateFinalExplanation(finalKey);
    
    // Показываем кнопку "Сгенерировать новый ключ"
    if (elements.newKeyBtn) {
        elements.newKeyBtn.style.display = 'flex';
    }
    
    // Показываем уведомление о просмотре истории пар
    showBitHistoryNotification();
}

function displayFinalKey(finalKey) {
    const finalKeyCells = elements.finalKeyGrid.querySelectorAll('.key-bit');
    for (let i = 0; i < FINAL_KEY_LENGTH; i++) {
        if (i < finalKey.length && finalKeyCells[i]) {
            finalKeyCells[i].textContent = finalKey[i];
            finalKeyCells[i].classList.add('active');
            // Добавляем атрибут с индексом исходной пары
            if (i < gameState.matchingIndices.length) {
                finalKeyCells[i].dataset.sourceIndex = gameState.matchingIndices[i];
            }
            // Добавляем обработчик для подсветки
            setupFinalKeyHover(finalKeyCells[i]);
        }
    }
}

function setupFinalKeyHover(cell) {
    cell.addEventListener('mouseenter', function() {
        highlightSourceBit(this.dataset.sourceIndex);
    });
    cell.addEventListener('mouseleave', function() {
        unhighlightSourceBit(this.dataset.sourceIndex);
    });
}

function updateFinalExplanation(finalKey) {
    if (elements.explanation) {
        elements.explanation.innerHTML = `
            <p><strong>Поздравляем! Вы создали секретный 8-битный квантовый ключ:</strong> ${finalKey.join('')}</p>
            <p>Этот ключ можно использовать для безопасного шифрования сообщений с Бобом.</p>
            <p>Любая попытка перехвата (было ${gameState.eveIntercepts}) нарушила бы квантовые состояния и была бы обнаружена при проверке неравенств Белла.</p>
        `;
    }
}

function showBitHistoryNotification() {
    if (elements.bitHistoryInfo) {
        elements.bitHistoryInfo.style.display = 'block';
        setTimeout(() => {
            elements.bitHistoryInfo.style.opacity = '1';
        }, 50);
    }
}

function highlightSourceBit(sourceIndex) {
    if (sourceIndex === undefined || sourceIndex === null) return;
    const rawKeyCells = elements.rawKeyGrid.querySelectorAll('.key-bit');
    if (sourceIndex < rawKeyCells.length) {
        rawKeyCells[sourceIndex].classList.add('highlight');
    }
}

function unhighlightSourceBit(sourceIndex) {
    if (sourceIndex === undefined || sourceIndex === null) return;
    const rawKeyCells = elements.rawKeyGrid.querySelectorAll('.key-bit');
    if (sourceIndex < rawKeyCells.length) {
        rawKeyCells[sourceIndex].classList.remove('highlight');
    }
}

// Вспомогательные функции
function setButtonsDisabled(disabled) {
    elements.manualModeBtn.disabled = disabled || gameState.siftKeyPressed;
    elements.semiAutoBtn.disabled = disabled || gameState.siftKeyPressed;
    elements.autoModeBtn.disabled = disabled || gameState.siftKeyPressed;
    elements.siftKeyBtn.disabled = disabled || !isSiftingAvailable() || gameState.siftKeyPressed;
    
    // Обновляем подсветку кнопки Просеять ключ
    if (!elements.siftKeyBtn.disabled) {
        elements.siftKeyBtn.classList.add('sift-active');
    } else {
        elements.siftKeyBtn.classList.remove('sift-active');
    }
}

function toggleProtocol() {
    const isExpanded = elements.protocolContent.style.display === 'block';
    const toggleIcon = elements.protocolHeader.querySelector('.toggle-icon');
    if (isExpanded) {
        elements.protocolContent.style.display = 'none';
        toggleIcon.textContent = '+';
    } else {
        elements.protocolContent.style.display = 'block';
        toggleIcon.textContent = '-';
    }
}

// Функция сброса игры
function resetGame() {
    // Сбрасываем флаг Просеять ключ
    gameState.siftKeyPressed = false;
    
    // Переключаем каналы: выключаем классический, включаем квантовый
    activateQuantumChannel();
    
    // Сбрасываем состояние
    gameState.rawKey = [];
    gameState.matchingIndices = [];
    gameState.eveIntercepts = 0;
    
    // Останавливаем режимы
    stopSemiAuto();
    stopAuto();
    
    // Сбрасываем счетчик уведомлений
    gameState.lastSiftNotificationCount = -1;
    
    // Сбрасываем интерфейс
    resetInterface();
    
    // Сбрасываем статусы
    updateAliceStatus('A1', '-');
    updateBobStatus('B1', '-');
    
    // Скрываем историю пар
    if (elements.bitHistory) {
        elements.bitHistory.style.display = 'none';
    }
    
    // Скрываем уведомление о просмотре истории
    hideBitHistoryInfo();
    
    // Сбрасываем сетки
    resetKeyGrids();
    
    // Сбрасываем объяснение
    if (elements.explanation) {
        elements.explanation.innerHTML = `
            <p>Выберите базисы для Алисы и Боба и отправьте запутанную пару. Когда вы отправите достаточно пар, нажмите "Просеять ключ", чтобы создать секретный ключ из совпадающих измерений.</p>
        `;
    }
    
    // Активируем кнопки
    setButtonsDisabled(false);
    
    // Скрываем финальный ключ и кнопку нового ключа
    if (elements.finalKeySection) {
        elements.finalKeySection.style.display = 'none';
    }
    if (elements.newKeyBtn) {
        elements.newKeyBtn.style.display = 'none';
    }
    
    // Сбрасываем анимацию Евы
    resetEveAnimation();
    
    // Сбрасываем базисы
    resetBasisIndicators();
    
    // Сбрасываем таймауты
    resetAllTimeouts();
}

function resetInterface() {
    if (elements.rawKeyCount) {
        elements.rawKeyCount.textContent = '0';
    }
    if (elements.matchCount) {
        elements.matchCount.textContent = '0';
    }
    if (elements.interceptCount) {
        elements.interceptCount.textContent = '0';
    }
}

function resetKeyGrids() {
    const rawKeyCells = elements.rawKeyGrid.querySelectorAll('.key-bit');
    rawKeyCells.forEach(cell => {
        cell.textContent = '';
        cell.style.background = 'rgba(0, 10, 20, 0.7)';
        cell.style.borderColor = 'rgba(0, 50, 80, 0.4)';
        cell.classList.remove('new', 'source', 'highlight', 'intercept');
    });
    
    const finalKeyCells = elements.finalKeyGrid.querySelectorAll('.key-bit');
    finalKeyCells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('active', 'highlight');
    });
}

function resetEveAnimation() {
    if (elements.eveIcon) {
        elements.eveIcon.style.opacity = '0';
    }
    if (elements.eveAlert) {
        elements.eveAlert.style.display = 'none';
    }
}

function resetBasisIndicators() {
    if (elements.aliceBasisIndicator) {
        elements.aliceBasisIndicator.style.opacity = '0';
    }
    if (elements.bobBasisElement) {
        elements.bobBasisElement.style.opacity = '0';
    }
}

function resetAllTimeouts() {
    if (gameState.interceptTimeout) {
        clearTimeout(gameState.interceptTimeout);
        gameState.interceptTimeout = null;
    }
    if (gameState.interceptHideTimeout) {
        clearTimeout(gameState.interceptHideTimeout);
        gameState.interceptHideTimeout = null;
    }
}