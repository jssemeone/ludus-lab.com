document.addEventListener('DOMContentLoaded', function() {
  console.log("Игра BB84: Загрузка скрипта");
  
  // Элементы DOM
  const polarizationOptions = document.querySelectorAll('.polarization-option');
  const manualModeBtn = document.getElementById('manualModeBtn');
  const semiAutoBtn = document.getElementById('semiAutoBtn');
  const autoModeBtn = document.getElementById('autoModeBtn');
  const siftKeyBtn = document.getElementById('siftKey');
  const newKeyBtn = document.getElementById('newKeyBtn');
  const finalKeySection = document.getElementById('finalKeySection');
  const rawKeyGrid = document.getElementById('rawKeyGrid');
  const finalKeyGrid = document.getElementById('finalKeyGrid');
  const rawKeyCount = document.getElementById('rawKeyCount');
  const matchCount = document.getElementById('matchCount');
  const interceptCount = document.getElementById('interceptCount');
  const explanation = document.getElementById('explanation');
  const aliceStatus = document.getElementById('aliceStatus');
  const bobStatus = document.getElementById('bobStatus');
  const eveAlert = document.getElementById('eveAlert');
  const eveIcon = document.getElementById('eveIcon');
  const aliceBasis = document.getElementById('aliceBasis');
  const bobBasisElement = document.getElementById('bobBasis');
  const quantumChannel = document.getElementById('quantumChannel');
  const classicalChannel = document.getElementById('classicalChannel');
  const protocolHeader = document.getElementById('protocolHeader');
  const protocolContent = document.getElementById('protocolContent');
  const bitHistory = document.getElementById('bitHistory');
  const bitHistoryInfo = document.getElementById('bitHistoryInfo');
  const siftNotification = document.getElementById('siftNotification');
  const siftKeyNotification = document.getElementById('siftKeyNotification');
  
  // Переменные для управления анимацией классического канала
  let classicalChannelInterval = null;
  
  // Состояние игры
  let selectedBasis = 'rectilinear';
  let selectedValue = '0';
  let rawKey = [];
  const FINAL_KEY_LENGTH = 8;
  const MIN_MATCHES_FOR_SIFTING = 8;
  let eveIntercepts = 0;
  let matchingIndices = [];
  let semiAutoInterval = null;
  let autoInterval = null;
  let isSemiAutoActive = false;
  let isAutoActive = false;
  let siftKeyPressed = false;
  
  // Новые переменные для управления уведомлениями
  let lastSiftNotificationCount = -1;
  
  // Переменные для управления анимацией
  let interceptTimeout = null;
  let interceptHideTimeout = null;

  // Инициализация
  initGame();

  function initGame() {
    console.log("Игра BB84: Инициализация");
    // Создаем сетку для сырых ключей
    createKeyGrid(rawKeyGrid, 16);
    // Создаем сетку для финального ключа
    createKeyGrid(finalKeyGrid, FINAL_KEY_LENGTH);
    
    // Обработчики выбора поляризации
    polarizationOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Снимаем выделение со всех
        polarizationOptions.forEach(opt => {
          opt.classList.remove('selected');
        });
        // Выбираем новый вариант
        this.classList.add('selected');
        selectedBasis = this.getAttribute('data-basis');
        selectedValue = this.getAttribute('data-value');
      });
    });
    
    // Обработчик ручного режима
    manualModeBtn.addEventListener('click', function() {
      if (siftKeyPressed) return;
      sendPhoton();
    });
    
    // Обработчик полуавтоматического режима
    semiAutoBtn.addEventListener('click', function() {
      if (siftKeyPressed) return;
      if (isSemiAutoActive) {
        stopSemiAuto();
      } else {
        stopAuto();
        startSemiAuto();
      }
    });
    
    // Обработчик автоматического режима
    autoModeBtn.addEventListener('click', function() {
      if (siftKeyPressed) return;
      if (isAutoActive) {
        stopAuto();
      } else {
        stopSemiAuto();
        startAuto();
      }
    });
    
    // Обработчик просеивания ключа
    siftKeyBtn.addEventListener('click', function() {
      siftKey();
    });
    
    // Обработчик новой игры
    newKeyBtn.addEventListener('click', function() {
      resetGame();
    });
    
    // Обработчик сворачивания/разворачивания описания протокола
    protocolHeader.addEventListener('click', function() {
      toggleProtocol();
    });
    
    // Инициализируем игру
    resetGame();
  }

  function startSemiAuto() {
    isSemiAutoActive = true;
    semiAutoBtn.classList.add('active-mode');
    semiAutoInterval = setInterval(() => {
      if (rawKey.length < 100 && !siftKeyPressed) {
        sendPhoton();
      }
    }, 1500);
  }

  function stopSemiAuto() {
    isSemiAutoActive = false;
    semiAutoBtn.classList.remove('active-mode');
    if (semiAutoInterval) {
      clearInterval(semiAutoInterval);
      semiAutoInterval = null;
    }
  }

  function startAuto() {
    isAutoActive = true;
    autoModeBtn.classList.add('active-mode');
    autoInterval = setInterval(() => {
      if (rawKey.length < 100 && !siftKeyPressed) {
        // Случайный выбор базиса и значения
        const randomBasis = Math.random() < 0.5 ? 'rectilinear' : 'diagonal';
        const randomValue = Math.random() < 0.5 ? '0' : '1';
        
        // Выбираем соответствующий элемент поляризации
        polarizationOptions.forEach(opt => {
          if (opt.getAttribute('data-basis') === randomBasis && 
              opt.getAttribute('data-value') === randomValue) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
        
        selectedBasis = randomBasis;
        selectedValue = randomValue;
        sendPhoton();
      }
    }, 1500);
  }

  function stopAuto() {
    isAutoActive = false;
    autoModeBtn.classList.remove('active-mode');
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  function toggleProtocol() {
    const isExpanded = protocolContent.style.display === 'block';
    const toggleIcon = protocolHeader.querySelector('.toggle-icon');
    if (isExpanded) {
      protocolContent.style.display = 'none';
      toggleIcon.textContent = '+';
    } else {
      protocolContent.style.display = 'block';
      toggleIcon.textContent = '-';
    }
  }

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
    keyBit.dataset.index = rawKey.length;
    // Добавляем обработчик клика для информации
    keyBit.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      showBitHistory(index);
    });
    // Добавляем в сетку
    rawKeyGrid.appendChild(keyBit);
    // Обновляем CSS для динамического размера сетки
    rawKeyGrid.style.gridTemplateColumns = `repeat(${rawKeyGrid.children.length}, 1fr)`;
    return keyBit;
  }

  function showBitHistory(index) {
    if (index >= rawKey.length) return;
    const bit = rawKey[index];
    // Формируем историю
    let historyHTML = `<div class="history-title">История кубита #${index}:</div>`;
    
    // Базис Алисы
    let aliceBasisSymbol = '';
    if (bit.aliceBasis === 'rectilinear') {
      aliceBasisSymbol = bit.aliceValue === '0' ? '|' : '—';
      historyHTML += `<div class="history-item">Алиса отправила: <span class="rectilinear-basis">${aliceBasisSymbol} (${bit.aliceValue})</span></div>`;
    } else {
      aliceBasisSymbol = bit.aliceValue === '0' ? '/' : '\\';
      historyHTML += `<div class="history-item">Алиса отправила: <span class="diagonal-basis">${aliceBasisSymbol} (${bit.aliceValue})</span></div>`;
    }
    
    // Базис Боба
    let bobBasisSymbol = '';
    if (bit.bobBasis === 'rectilinear') {
      bobBasisSymbol = bit.bobValue === '0' ? '|' : '—';
      historyHTML += `<div class="history-item">Боб измерил: <span class="rectilinear-basis">${bobBasisSymbol} (${bit.bobValue})</span></div>`;
    } else {
      bobBasisSymbol = bit.bobValue === '0' ? '/' : '\\';
      historyHTML += `<div class="history-item">Боб измерил: <span class="diagonal-basis">${bobBasisSymbol} (${bit.bobValue})</span></div>`;
    }
    
    // Перехват Евой
    if (bit.wasIntercepted) {
      historyHTML += `<div class="history-item">⚠️ Перехват: <span class="intercepted">Да</span></div>`;
    } else {
      historyHTML += `<div class="history-item">Перехват: Нет</div>`;
    }
    
    // Совпадение базисов
    if (bit.matches) {
      historyHTML += `<div class="history-item">✓ Совпадение базисов: <span class="matched">Да</span></div>`;
    } else {
      historyHTML += `<div class="history-item">✗ Совпадение базисов: Нет</div>`;
    }
    
    // Статус использования
    if (bit.wasIntercepted) {
      historyHTML += `<div class="history-item history-status">Статус: <span class="status-intercepted">Отброшен (скомпрометирован)</span></div>`;
    } else if (bit.matches) {
      // Проверяем, является ли кубит избыточным
      const indexInMatching = matchingIndices.indexOf(index);
      if (indexInMatching >= 0 && indexInMatching >= FINAL_KEY_LENGTH) {
        historyHTML += `<div class="history-item history-status">Статус: <span class="status-excess">Подходит для формирования ключа, но является избыточным</span></div>`;
      } else if (indexInMatching >= 0) {
        historyHTML += `<div class="history-item history-status">Статус: <span class="status-used">Используется в ключе</span></div>`;
      }
    } else {
      historyHTML += `<div class="history-item history-status">Статус: <span class="status-not-matched">Базисы не совпали</span></div>`;
    }
    
    // Отображаем историю
    bitHistory.innerHTML = historyHTML;
    bitHistory.style.display = 'block';
    
    // Скрываем уведомление о необходимости просмотре истории
    if (bitHistoryInfo && bitHistoryInfo.style.display !== 'none') {
      bitHistoryInfo.style.opacity = '0';
      setTimeout(() => {
        bitHistoryInfo.style.display = 'none';
      }, 300);
    }
  }

  function activateQuantumChannel() {
    quantumChannel.classList.remove('inactive');
    quantumChannel.classList.add('active');
    classicalChannel.classList.remove('active');
    classicalChannel.classList.add('inactive');
    // Останавливаем анимацию классического канала
    stopClassicalChannelAnimation();
  }

  function activateClassicalChannel() {
    quantumChannel.classList.remove('active');
    quantumChannel.classList.add('inactive');
    classicalChannel.classList.remove('inactive');
    classicalChannel.classList.add('active');
    // Запускаем анимацию классического канала
    startClassicalChannelAnimation();
  }

  function startClassicalChannelAnimation() {
    if (classicalChannelInterval) return;
    
    classicalChannelInterval = setInterval(() => {
      // Пакет от Алисы к Бобу
      const packetToBob = document.createElement('div');
      packetToBob.className = 'data-packet to-bob';
      classicalChannel.appendChild(packetToBob);
      
      // Пакет от Боба к Алисе (с задержкой)
      setTimeout(() => {
        const packetToAlice = document.createElement('div');
        packetToAlice.className = 'data-packet to-alice';
        classicalChannel.appendChild(packetToAlice);
        
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
    if (classicalChannelInterval) {
      clearInterval(classicalChannelInterval);
      classicalChannelInterval = null;
    }
    // Удаляем все пакеты данных
    const packets = classicalChannel.querySelectorAll('.data-packet');
    packets.forEach(packet => {
      if (packet.parentNode) {
        packet.parentNode.removeChild(packet);
      }
    });
  }

  function sendPhoton() {
    if (siftKeyPressed) return;
    
    aliceStatus.textContent = 'Отправляет кубит...';
    
    // Сохраняем текущие выбранные значения
    const currentBasis = selectedBasis;
    const currentValue = selectedValue;
    
    // Создаем фотон
    const photon = document.createElement('div');
    photon.className = 'photon';
    photon.textContent = currentValue;
    
    // Добавляем стиль в зависимости от базиса
    if (currentBasis === 'rectilinear') {
      photon.style.background = 'linear-gradient(45deg, #00ff80, #006b40)';
      photon.style.color = '#001a08';
    } else {
      photon.style.background = 'linear-gradient(45deg, #e6d000, #8b7100)';
      photon.style.color = '#0a0800';
    }
    
    // Добавляем в канал
    quantumChannel.appendChild(photon);
    
    // Анимация базиса Алисы
    if (aliceBasis) {
      aliceBasis.style.opacity = '1';
      // Создаем контейнер для базиса с соответствующим символом
      if (currentBasis === 'rectilinear') {
        // Для прямого базиса: "|" для 0, "—" для 1
        if (currentValue === '0') {
          aliceBasis.textContent = '|';
        } else {
          aliceBasis.textContent = '—';
        }
        aliceBasis.style.background = 'rgba(0, 255, 128, 0.2)';
        aliceBasis.style.borderColor = '#00ff80';
      } else {
        // Для диагонального базиса: "/" для 0, "\" для 1
        if (currentValue === '0') {
          aliceBasis.textContent = '/';
        } else {
          aliceBasis.textContent = '\\';
        }
        aliceBasis.style.background = 'rgba(230, 208, 0, 0.2)';
        aliceBasis.style.borderColor = '#e6d000';
      }
    }
    
    // Случайно решаем, будет ли перехват
    const shouldIntercept = Math.random() < 0.3; // 30% шанс перехвата
    
    if (shouldIntercept) {
      // Показываем Еву через некоторое время (раньше, чтобы было заметно)
      interceptTimeout = setTimeout(() => {
        if (eveIcon) {
          eveIcon.style.opacity = '1';
        }
        if (eveAlert) {
          eveAlert.style.display = 'block';
          setTimeout(() => {
            eveAlert.style.display = 'none';
          }, 2000);
        }
      }, 300); // Уменьшено с 500 до 300 мс для более раннего появления
      
      // Скрываем Еву позже, чтобы она была видна дольше
      interceptHideTimeout = setTimeout(() => {
        if (eveIcon) {
          eveIcon.style.opacity = '0';
        }
      }, 2200); // Увеличено время показа Евы
    }
    
    // Анимация движения фотона
    setTimeout(() => {
      photon.style.animation = 'photonTravel 2s linear forwards';
      
      // Анимация завершена
      setTimeout(() => {
        // Удаляем фотон
        if (photon.parentNode) {
          photon.parentNode.removeChild(photon);
        }
        
        // Скрываем базис Алисы
        if (aliceBasis) {
          aliceBasis.style.opacity = '0';
        }
        
        // Измерение Боба
        measurePhoton(shouldIntercept, currentBasis, currentValue);
        
        // Восстанавливаем статус Алисы
        aliceStatus.textContent = 'Готова отправить кубит';
        
        // Сбрасываем таймауты
        if (interceptTimeout) {
          clearTimeout(interceptTimeout);
          interceptTimeout = null;
        }
        
        // Не скрываем Еву здесь, так как у нас есть отдельный таймаут для этого
      }, 2000);
    }, 10);
  }

  function setButtonsDisabled(disabled) {
    manualModeBtn.disabled = disabled || siftKeyPressed;
    // Теперь также отключаем кнопки автоматических режимов
    semiAutoBtn.disabled = disabled || siftKeyPressed;
    autoModeBtn.disabled = disabled || siftKeyPressed;
    siftKeyBtn.disabled = disabled || !isSiftingAvailable() || siftKeyPressed;
    
    // Обновляем подсветку кнопки Просеять ключ
    if (!siftKeyBtn.disabled) {
      siftKeyBtn.classList.add('sift-active');
    } else {
      siftKeyBtn.classList.remove('sift-active');
    }
  }

  function isSiftingAvailable() {
    const matches = rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    return matches >= MIN_MATCHES_FOR_SIFTING;
  }

  function measurePhoton(wasIntercepted, aliceBasis, aliceValue) {
    // Случайный выбор базиса Бобом
    const bobBasis = Math.random() < 0.5 ? 'rectilinear' : 'diagonal';
    
    // Анимация базиса Боба
    if (bobBasisElement) {
      bobBasisElement.style.opacity = '1';
      // Создаем контейнер для базиса с соответствующим символом
      if (bobBasis === 'rectilinear') {
        // Для прямого базиса: "+" для прямого, "×" для диагонального
        bobBasisElement.textContent = '+';
        bobBasisElement.style.background = 'rgba(0, 255, 128, 0.2)';
        bobBasisElement.style.borderColor = '#00ff80';
      } else {
        bobBasisElement.textContent = '×';
        bobBasisElement.style.background = 'rgba(230, 208, 0, 0.2)';
        bobBasisElement.style.borderColor = '#e6d000';
      }
    }
    
    // Устанавливаем статус Боба
    if (bobStatus) {
      bobStatus.textContent = `Измеряет в ${bobBasis === 'rectilinear' ? 'прямом' : 'диагональном'} базисе...`;
    }
    
    // Результат измерения
    let bobValue;
    
    if (wasIntercepted) {
      // Если был перехват, Ева измерила в случайном базисе
      const eveBasis = Math.random() < 0.5 ? 'rectilinear' : 'diagonal';
      let eveValue;
      
      if (eveBasis === aliceBasis) {
        // Если базис совпадает, результат верный
        eveValue = aliceValue;
      } else {
        // Если базис не совпадает, результат случайный
        eveValue = Math.round(Math.random()).toString();
      }
      
      // Теперь Боб измеряет состояние, которое могло быть изменено
      if (bobBasis === eveBasis) {
        bobValue = eveValue;
      } else {
        bobValue = Math.round(Math.random()).toString();
      }
      
      // Увеличиваем счетчик перехватов
      eveIntercepts++;
      if (interceptCount) {
        interceptCount.textContent = eveIntercepts;
      }
    } else {
      // Без перехвата
      if (bobBasis === aliceBasis) {
        // Если базис совпадает, результат верный
        bobValue = aliceValue;
      } else {
        // Если базис не совпадает, результат случайный
        bobValue = Math.round(Math.random()).toString();
      }
    }
    
    // Отображаем результат
    setTimeout(() => {
      if (bobStatus) {
        bobStatus.textContent = `Получен бит: ${bobValue}`;
      }
      
      // Передаем сохраненные значения Алисы
      addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted);
      
      // Скрываем базис Боба
      setTimeout(() => {
        if (bobBasisElement) {
          bobBasisElement.style.opacity = '0';
        }
      }, 1500);
    }, 1000);
  }

  function addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted) {
    const index = rawKey.length;
    
    // Добавляем в сырую ключевую последовательность
    rawKey.push({
      aliceValue,
      aliceBasis,
      bobValue,
      bobBasis,
      wasIntercepted,
      matches: aliceBasis === bobBasis
    });
    
    // Если нужно добавить новый кубит в сетку
    if (index >= rawKeyGrid.children.length) {
      addKeyBit();
    }
    
    // Обновляем отображение
    const rawKeyCells = rawKeyGrid.querySelectorAll('.key-bit');
    if (index < rawKeyCells.length) {
      const cell = rawKeyCells[index];
      // Устанавливаем значение
      cell.textContent = aliceValue;
      
      // Цвет в зависимости от совпадения базисов
      if (aliceBasis === bobBasis) {
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
      
      // Анимируем появление нового кубита
      cell.classList.add('new');
      
      // Проверяем, можно ли просеять ключ
      const matches = rawKey.filter(item => item.matches && !item.wasIntercepted).length;
      checkSiftingAvailability(matches);
    }
    
    // Обновляем счетчик
    if (rawKeyCount) {
      rawKeyCount.textContent = rawKey.length;
    }
    
    // Обновляем количество совпадений (без перехваченных)
    const matches = rawKey.filter(item => item.matches && !item.wasIntercepted).length;
    if (matchCount) {
      matchCount.textContent = matches;
    }
    
    // Обновляем состояние кнопки Просеять ключ
    siftKeyBtn.disabled = !isSiftingAvailable() || siftKeyPressed;
    
    // Обновляем подсветку кнопки Просеять ключ
    if (!siftKeyBtn.disabled) {
      siftKeyBtn.classList.add('sift-active');
    } else {
      siftKeyBtn.classList.remove('sift-active');
    }
  }

  function checkSiftingAvailability(matches) {
    // Проверяем, достаточно ли совпадений для просеивания (без перехваченных)
    if (matches >= MIN_MATCHES_FOR_SIFTING) {
      // Показываем уведомление каждые 4 кубита (вместо 7)
      if (lastSiftNotificationCount === -1 || matches - lastSiftNotificationCount >= 4) {
        // Обновляем счетчик последнего уведомления
        lastSiftNotificationCount = matches;
        
        // Показываем уведомление
        if (siftNotification) {
          siftNotification.style.display = 'block';
          setTimeout(() => {
            siftNotification.style.display = 'none';
          }, 3000);
        }
        
        // Обновляем объяснение
        if (explanation) {
          explanation.innerHTML = `
            <p>Вы отправили достаточно кубитов! Нажмите "Просеять ключ", чтобы создать секретный ключ.</p>
            <p>Только совпадающие базисы без перехвата (${matches}) будут использованы для формирования финального ключа.</p>
          `;
        }
      }
    }
  }

  function siftKey() {
    // Устанавливаем флаг, что кнопка Просеять ключ была нажата
    siftKeyPressed = true;
    
    // Останавливаем все режимы
    stopSemiAuto();
    stopAuto();
    
    // Отключаем все кнопки
    setButtonsDisabled(true);
    
    // Деактивируем квантовый канал
    quantumChannel.classList.remove('active');
    quantumChannel.classList.add('inactive');
    
    // Переключаем каналы: выключаем квантовый, включаем классический
    activateClassicalChannel();
    
    // Получаем совпадающие биты и их индексы (исключая перехваченные)
    matchingIndices = [];
    const matchingBits = rawKey
      .map((item, index) => {
        // Исключаем перехваченные кубиты
        if (item.matches && !item.wasIntercepted) {
          matchingIndices.push(index);
          return item.aliceValue;
        }
        return null;
      })
      .filter(bit => bit !== null);
    
    // Проверяем, достаточно ли битов для формирования 8-битного ключа
    if (matchingBits.length < FINAL_KEY_LENGTH) {
      // Если недостаточно, выводим сообщение
      if (explanation) {
        explanation.innerHTML = `
          <p>⚠️ Недостаточно данных для формирования 8-битного ключа!</p>
          <p>Вам нужно отправить еще кубитов, чтобы после исключения перехваченных осталось как минимум 8 совпадающих.</p>
          <p>Сейчас у вас ${matchingBits.length} подходящих кубитов.</p>
        `;
      }
      // Включаем кнопки обратно
      siftKeyPressed = false;
      setButtonsDisabled(false);
      return;
    }
    
    // Берем первые 8 бит для финального ключа
    const finalKey = matchingBits.slice(0, FINAL_KEY_LENGTH);
    
    // Показываем область финального ключа
    if (finalKeySection) {
      finalKeySection.style.display = 'block';
    }
    
    // Отображаем финальный ключ
    const finalKeyCells = finalKeyGrid.querySelectorAll('.key-bit');
    for (let i = 0; i < FINAL_KEY_LENGTH; i++) {
      if (i < finalKey.length && finalKeyCells[i]) {
        finalKeyCells[i].textContent = finalKey[i];
        finalKeyCells[i].classList.add('active');
        // Добавляем атрибут с индексом исходного кубита
        if (i < matchingIndices.length) {
          finalKeyCells[i].dataset.sourceIndex = matchingIndices[i];
        }
        // Добавляем обработчик для подсветки
        finalKeyCells[i].addEventListener('mouseenter', function() {
          highlightSourceBit(this.dataset.sourceIndex);
        });
        finalKeyCells[i].addEventListener('mouseleave', function() {
          unhighlightSourceBit(this.dataset.sourceIndex);
        });
      }
    }
    
    // Обновляем объяснение
    if (explanation) {
      explanation.innerHTML = `
        <p><strong>Поздравляем! Вы создали секретный 8-битный квантовый ключ:</strong> ${finalKey.join('')}</p>
        <p>Этот ключ можно использовать для безопасного шифрования сообщений с Бобом.</p>
        <p>Любая попытка перехвата (было ${eveIntercepts}) нарушила бы квантовые состояния и была бы обнаружена при сравнении части ключа.</p>
      `;
    }
    
    // Показываем кнопку "Сгенерировать новый ключ"
    if (newKeyBtn) {
      newKeyBtn.style.display = 'flex';
    }
    
    // Показываем уведомление о просмотре истории кубитов
    if (bitHistoryInfo) {
      bitHistoryInfo.style.display = 'block';
      setTimeout(() => {
        bitHistoryInfo.style.opacity = '1';
      }, 50);
    }
  }

  function highlightSourceBit(sourceIndex) {
    if (sourceIndex === undefined || sourceIndex === null) return;
    const rawKeyCells = rawKeyGrid.querySelectorAll('.key-bit');
    if (sourceIndex < rawKeyCells.length) {
      rawKeyCells[sourceIndex].classList.add('highlight');
    }
  }

  function unhighlightSourceBit(sourceIndex) {
    if (sourceIndex === undefined || sourceIndex === null) return;
    const rawKeyCells = rawKeyGrid.querySelectorAll('.key-bit');
    if (sourceIndex < rawKeyCells.length) {
      rawKeyCells[sourceIndex].classList.remove('highlight');
    }
  }

  function resetGame() {
    // Сбрасываем флаг Просеять ключ
    siftKeyPressed = false;
    
    // Переключаем каналы: выключаем классический, включаем квантовый
    activateQuantumChannel();
    
    // Сбрасываем состояние
    rawKey = [];
    matchingIndices = [];
    eveIntercepts = 0;
    
    // Останавливаем режимы
    stopSemiAuto();
    stopAuto();
    
    // Сбрасываем счетчик уведомлений
    lastSiftNotificationCount = -1;
    
    // Сбрасываем интерфейс
    if (rawKeyCount) {
      rawKeyCount.textContent = '0';
    }
    if (matchCount) {
      matchCount.textContent = '0';
    }
    if (interceptCount) {
      interceptCount.textContent = '0';
    }
    
    // Скрываем историю кубитов
    if (bitHistory) {
      bitHistory.style.display = 'none';
    }
    
    // Скрываем уведомление о просмотре истории
    if (bitHistoryInfo) {
      bitHistoryInfo.style.display = 'none';
      bitHistoryInfo.style.opacity = '0';
    }
    
    // Сбрасываем сетки
    const rawKeyCells = rawKeyGrid.querySelectorAll('.key-bit');
    rawKeyCells.forEach(cell => {
      cell.textContent = '';
      cell.style.background = 'rgba(0, 10, 20, 0.7)';
      cell.style.borderColor = 'rgba(0, 50, 80, 0.4)';
      cell.classList.remove('new', 'source', 'highlight', 'intercept');
    });
    
    const finalKeyCells = finalKeyGrid.querySelectorAll('.key-bit');
    finalKeyCells.forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('active', 'highlight');
    });
    
    // Сбрасываем статусы
    if (aliceStatus) {
      aliceStatus.textContent = 'Готова отправить кубит';
    }
    if (bobStatus) {
      bobStatus.textContent = 'Ожидает кубит';
    }
    
    // Сбрасываем объяснение
    if (explanation) {
      explanation.innerHTML = `
        <p>Выберите один из четырех вариантов поляризации кубита и отправьте его Бобу. Боб будет случайным образом выбирать базис для измерения.</p>
        <p>Когда вы отправите достаточно кубитов, нажмите "Просеять ключ", чтобы создать секретный ключ из совпадающих измерений.</p>
      `;
    }
    
    // Активируем кнопки
    setButtonsDisabled(false);
    
    // Скрываем финальный ключ и кнопку нового ключа
    if (finalKeySection) {
      finalKeySection.style.display = 'none';
    }
    if (newKeyBtn) {
      newKeyBtn.style.display = 'none';
    }
    
    // Сбрасываем анимацию Евы
    if (eveIcon) {
      eveIcon.style.opacity = '0';
    }
    if (eveAlert) {
      eveAlert.style.display = 'none';
    }
    
    // Сбрасываем базисы
    if (aliceBasis) {
      aliceBasis.style.opacity = '0';
    }
    if (bobBasisElement) {
      bobBasisElement.style.opacity = '0';
    }
    
    // Сбрасываем таймауты
    if (interceptTimeout) {
      clearTimeout(interceptTimeout);
      interceptTimeout = null;
    }
    if (interceptHideTimeout) {
      clearTimeout(interceptHideTimeout);
      interceptHideTimeout = null;
    }
  }
});
