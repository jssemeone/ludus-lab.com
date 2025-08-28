document.addEventListener('DOMContentLoaded', function() {
  console.log("Игра BB84: Загрузка скрипта");
  
  // Элементы DOM
  const polarizationOptions = document.querySelectorAll('.polarization-option');
  const sendPhotonBtn = document.getElementById('sendPhoton');
  const autoSendBtn = document.getElementById('autoSendBtn');
  const siftKeyBtn = document.getElementById('siftKey');
  const newKeyBtn = document.getElementById('newKeyBtn');
  const siftKeyNotification = document.getElementById('siftKeyNotification');
  const siftNotification = document.getElementById('siftNotification');
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
  const instructionsHeader = document.getElementById('instructionsHeader');
  const instructionsContent = document.getElementById('instructionsContent');
  const bitHistory = document.getElementById('bitHistory');
  
  // Проверка наличия всех элементов
  const elementsExist = [
    polarizationOptions, sendPhotonBtn, autoSendBtn, siftKeyBtn, newKeyBtn, rawKeyGrid, finalKeyGrid,
    rawKeyCount, matchCount, interceptCount, explanation, aliceStatus,
    bobStatus, eveAlert, eveIcon, aliceBasis, bobBasisElement, quantumChannel,
    siftKeyNotification, finalKeySection, instructionsHeader, instructionsContent,
    bitHistory, siftNotification
  ].every(element => element !== null);
  
  if (!elementsExist) {
    console.error("Ошибка: Не все необходимые DOM-элементы найдены");
    return;
  }
  
  console.log("Игра BB84: Все DOM-элементы найдены");
  
  // Состояние игры
  let selectedBasis = 'rectilinear';
  let selectedValue = '0';
  let rawKey = [];
  const FINAL_KEY_LENGTH = 8;
  const MIN_MATCHES_FOR_SIFTING = 8;
  let eveIntercepts = 0;
  let matchingIndices = []; // Индексы совпадающих кубитов
  let autoSendInterval = null;
  let isAutoSending = false;
  
  // Новые переменные для управления уведомлениями
  let lastSiftNotificationCount = -1; // Инициализируем как -1, чтобы первое уведомление показалось сразу
  
  // Переменные для управления анимацией
  let interceptTimeout = null;
  let expandInterval = null;
  
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
        console.log(`Игра BB84: Выбрана поляризация: базис=${this.getAttribute('data-basis')}, значение=${this.getAttribute('data-value')}`);
        
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
    
    // Обработчик отправки кубита
    sendPhotonBtn.addEventListener('click', sendPhoton);
    
    // Обработчик автоматической отправки
    autoSendBtn.addEventListener('click', toggleAutoSend);
    
    // Обработчик просеивания ключа
    siftKeyBtn.addEventListener('click', siftKey);
    
    // Обработчик новой игры
    newKeyBtn.addEventListener('click', resetGame);
    
    // Обработчик сворачивания/разворачивания инструкций
    instructionsHeader.addEventListener('click', toggleInstructions);
    
    // Инициализируем игру
    resetGame();
  }
  
  function toggleInstructions() {
    const isExpanded = instructionsContent.style.display === 'block';
    const toggleIcon = instructionsHeader.querySelector('.toggle-icon');
    
    if (isExpanded) {
      instructionsContent.style.display = 'none';
      toggleIcon.textContent = '+';
    } else {
      instructionsContent.style.display = 'block';
      toggleIcon.textContent = '-';
    }
  }
  
  function createKeyGrid(gridElement, size) {
    console.log(`Игра BB84: Создание сетки размером ${size}`);
    gridElement.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
      const keyBit = document.createElement('div');
      keyBit.className = 'key-bit';
      keyBit.dataset.index = i;
      
      // Добавляем обработчик клика для информации
      keyBit.addEventListener('click', function() {
        showBitHistory(i);
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
      showBitHistory(rawKey.length);
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
      historyHTML += `<div class="history-item history-status">Статус: <span class="status-used">Используется в ключе</span></div>`;
    } else {
      historyHTML += `<div class="history-item history-status">Статус: <span class="status-not-matched">Базисы не совпали</span></div>`;
    }
    
    // Отображаем историю
    bitHistory.innerHTML = historyHTML;
    bitHistory.style.display = 'block';
  }
  
  function sendPhoton() {
    console.log("Игра BB84: Отправка кубита начата");
    
    try {
      // Удаляем предыдущие элементы анимации
      const existingLines = quantumChannel.querySelectorAll('.intercept-line');
      existingLines.forEach(line => {
        try {
          quantumChannel.removeChild(line);
        } catch (e) {
          console.log("Игра BB84: Ошибка при удалении линии перехвата", e);
        }
      });
      
      // Сбрасываем таймауты
      if (interceptTimeout) {
        clearTimeout(interceptTimeout);
        interceptTimeout = null;
      }
      
      if (expandInterval) {
        clearInterval(expandInterval);
        expandInterval = null;
      }
      
      // Сбрасываем Еву
      if (eveIcon) {
        eveIcon.style.opacity = '0';
        eveIcon.classList.remove('eve-active');
      }
      
      // Сохраняем текущие выбранные значения
      const currentBasis = selectedBasis;
      const currentValue = selectedValue;
      
      console.log(`Игра BB84: Сохраненные значения - базис=${currentBasis}, значение=${currentValue}`);
      
      // Отключаем кнопку на время анимации
      sendPhotonBtn.disabled = true;
      aliceStatus.textContent = 'Отправляет кубит...';
      
      // Создаем фотон
      const photon = document.createElement('div');
      photon.className = 'photon';
      photon.textContent = currentValue;
      
      // Добавляем стиль в зависимости от базиса
      if (currentBasis === 'rectilinear') {
        // Изменено: зеленый цвет для прямого базиса
        photon.style.background = 'linear-gradient(45deg, #00ff80, #006b40)';
        photon.style.color = '#001a08';
      } else {
        photon.style.background = 'linear-gradient(45deg, #e6d000, #8b7100)';
        photon.style.color = '#0a0800';
      }
      
      // Добавляем в канал
      if (quantumChannel) {
        quantumChannel.appendChild(photon);
      } else {
        console.error("Игра BB84: quantumChannel не найден");
        sendPhotonBtn.disabled = false;
        return;
      }
      
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
      console.log(`Игра BB84: Перехват ${shouldIntercept ? 'произойдет' : 'не произойдет'}`);
      
      if (shouldIntercept) {
        // Показываем Еву через некоторое время
        interceptTimeout = setTimeout(() => {
          try {
            if (eveIcon) {
              // Сбрасываем стили Евы перед показом
              eveIcon.style.opacity = '0';
              eveIcon.classList.remove('eve-active');
              
              // Убедимся, что Ева находится в пределах канала
              eveIcon.style.left = '50%';
              eveIcon.style.top = '50%';
              eveIcon.style.transform = 'translate(-50%, -50%)';
              
              // Показываем Еву
              setTimeout(() => {
                eveIcon.style.opacity = '1';
                eveIcon.classList.add('eve-active');
              }, 50);
            }
            
            if (eveAlert) {
              eveAlert.style.display = 'block';
              setTimeout(() => {
                eveAlert.style.display = 'none';
              }, 2000);
            }
            
            // Анимация перехвата
            if (quantumChannel) {
              const interceptLine = document.createElement('div');
              interceptLine.className = 'intercept-line';
              interceptLine.style.position = 'absolute';
              interceptLine.style.height = '2px';
              interceptLine.style.width = '0';
              interceptLine.style.background = 'linear-gradient(90deg, transparent, #ff4444, transparent)';
              interceptLine.style.top = '50%';
              interceptLine.style.left = '50%';
              interceptLine.style.transform = 'translate(-50%, -50%)';
              quantumChannel.appendChild(interceptLine);
              
              // Анимация расширения линии
              let width = 0;
              expandInterval = setInterval(() => {
                try {
                  width += 2;
                  interceptLine.style.width = `${width}%`;
                  interceptLine.style.left = `${50 - width/2}%`;
                  
                  if (width >= 100) {
                    clearInterval(expandInterval);
                    expandInterval = null;
                    
                    setTimeout(() => {
                      if (quantumChannel && quantumChannel.contains(interceptLine)) {
                        try {
                          quantumChannel.removeChild(interceptLine);
                        } catch (removeError) {
                          console.error('Игра BB84: Ошибка при удалении линии перехвата:', removeError);
                        }
                      }
                    }, 500);
                  }
                } catch (lineError) {
                  console.error('Игра BB84: Ошибка в анимации линии перехвата:', lineError);
                  clearInterval(expandInterval);
                  expandInterval = null;
                  
                  // Пытаемся удалить линию, если она существует
                  if (quantumChannel && interceptLine && quantumChannel.contains(interceptLine)) {
                    try {
                      quantumChannel.removeChild(interceptLine);
                    } catch (removeError) {
                      console.error('Игра BB84: Ошибка при удалении линии перехвата:', removeError);
                    }
                  }
                }
              }, 20);
            }
          } catch (eveError) {
            console.error('Игра BB84: Ошибка при отображении Евы:', eveError);
          }
        }, 500);
      }
      
      // Анимация движения фотона
      setTimeout(() => {
        try {
          if (photon) {
            photon.style.transform = 'translateX(100px)';
            
            // Анимация завершена
            setTimeout(() => {
              try {
                // Удаляем фотон
                if (photon && photon.parentNode) {
                  photon.parentNode.removeChild(photon);
                }
                
                // Скрываем базис Алисы
                if (aliceBasis) {
                  aliceBasis.style.opacity = '0';
                }
                
                // Измерение Боба
                console.log("Игра BB84: Передача в measurePhoton");
                measurePhoton(shouldIntercept, currentBasis, currentValue);
                
                // Включаем кнопку
                sendPhotonBtn.disabled = false;
                
                // Сбрасываем таймауты
                if (interceptTimeout) {
                  clearTimeout(interceptTimeout);
                  interceptTimeout = null;
                }
                
                if (expandInterval) {
                  clearInterval(expandInterval);
                  expandInterval = null;
                }
                
                // Скрываем Еву
                if (eveIcon) {
                  eveIcon.style.opacity = '0';
                  eveIcon.classList.remove('eve-active');
                }
              } catch (measureError) {
                console.error('Игра BB84: Ошибка при завершении анимации:', measureError);
                sendPhotonBtn.disabled = false;
              }
            }, 2000);
          }
        } catch (photonError) {
          console.error('Игра BB84: Ошибка в анимации фотона:', photonError);
          sendPhotonBtn.disabled = false;
        }
      }, 10);
    } catch (mainError) {
      console.error('Игра BB84: Критическая ошибка при отправке фотона:', mainError);
      sendPhotonBtn.disabled = false;
    }
  }
  
  function toggleAutoSend() {
    if (isAutoSending) {
      // Останавливаем автоматическую отправку
      clearInterval(autoSendInterval);
      autoSendInterval = null;
      isAutoSending = false;
      autoSendBtn.textContent = 'Автоматическая отправка';
      autoSendBtn.style.background = 'linear-gradient(to bottom, #001a2d, #000c1a)';
    } else {
      // Запускаем автоматическую отправку
      autoSendBtn.textContent = 'Остановить автоматическую отправку';
      autoSendBtn.style.background = 'linear-gradient(to bottom, #8b0000, #5a0000)';
      isAutoSending = true;
      
      autoSendInterval = setInterval(() => {
        // Проверяем, не превышен ли лимит
        if (rawKey.length < 100) { // Ограничение для предотвращения бесконечной отправки
          sendPhoton();
        } else {
          clearInterval(autoSendInterval);
          autoSendInterval = null;
          isAutoSending = false;
          autoSendBtn.textContent = 'Автоматическая отправка';
          autoSendBtn.style.background = 'linear-gradient(to bottom, #001a2d, #000c1a)';
        }
      }, 1500);
    }
  }
  
  function measurePhoton(wasIntercepted, aliceBasis, aliceValue) {
    console.log(`Игра BB84: measurePhoton вызвана (перехват=${wasIntercepted}, базис=${aliceBasis}, значение=${aliceValue})`);
    
    try {
      // Случайный выбор базиса Бобом
      const bobBasis = Math.random() < 0.5 ? 'rectilinear' : 'diagonal';
      console.log(`Игра BB84: Боб выбрал базис: ${bobBasis}`);
      
      // Анимация базиса Боба
      if (bobBasisElement) {
        bobBasisElement.style.opacity = '1';
        
        // Создаем контейнер для базиса с соответствующим символом
        if (bobBasis === 'rectilinear') {
          // Для прямого базиса: "|" для 0, "—" для 1
          if (aliceValue === '0') {
            bobBasisElement.textContent = '+';
          } else {
            bobBasisElement.textContent = '×';
          }
          bobBasisElement.style.background = 'rgba(0, 255, 128, 0.2)';
          bobBasisElement.style.borderColor = '#00ff80';
        } else {
          // Для диагонального базиса: "/" для 0, "\" для 1
          if (aliceValue === '0') {
            bobBasisElement.textContent = '×';
          } else {
            bobBasisElement.textContent = '+';
          }
          bobBasisElement.style.background = 'rgba(230, 208, 0, 0.2)';
          bobBasisElement.style.borderColor = '#e6d000';
        }
      }
      
      // Устанавливаем статус Боба
      if (bobStatus) {
        // Расширяем поле статуса, чтобы текст отображался целиком
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
        
        console.log(`Игра BB84: Ева измерила: базис=${eveBasis}, значение=${eveValue}`);
        
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
      
      console.log(`Игра BB84: Результат измерения Боба: базис=${bobBasis}, значение=${bobValue}`);
      
      // Отображаем результат
      setTimeout(() => {
        try {
          if (bobStatus) {
            bobStatus.textContent = `Получен бит: ${bobValue}`;
          }
          
          console.log("Игра BB84: Передача в addToRawKey");
          // Передаем сохраненные значения Алисы
          addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted);
        } catch (addError) {
          console.error('Игра BB84: Ошибка при добавлении в сырой ключ:', addError);
          if (sendPhotonBtn) {
            sendPhotonBtn.disabled = false;
          }
        }
        
        // Скрываем базис Боба
        setTimeout(() => {
          if (bobBasisElement) {
            bobBasisElement.style.opacity = '0';
          }
          if (aliceStatus) {
            aliceStatus.textContent = 'Готова отправить кубит';
          }
        }, 1500);
      }, 1000);
    } catch (measureError) {
      console.error('Игра BB84: Ошибка в процессе измерения:', measureError);
      if (sendPhotonBtn) {
        sendPhotonBtn.disabled = false;
      }
    }
  }
  
  function addToRawKey(aliceValue, aliceBasis, bobValue, bobBasis, wasIntercepted) {
    console.log(`Игра BB84: addToRawKey вызвана (Алиса: значение=${aliceValue}, базис=${aliceBasis}, Боб: значение=${bobValue}, базис=${bobBasis}, перехват=${wasIntercepted})`);
    
    try {
      const index = rawKey.length;
      console.log(`Игра BB84: Индекс в сыром ключе: ${index}`);
      
      // Добавляем в сырую ключевую последовательность
      rawKey.push({
        aliceValue,
        aliceBasis,
        bobValue,
        bobBasis,
        wasIntercepted,
        matches: aliceBasis === bobBasis
      });
      
      console.log(`Игра BB84: Добавлено в сырой ключ: совпадение=${aliceBasis === bobBasis}`);
      
      // Если нужно добавить новый кубит в сетку
      if (index >= rawKeyGrid.children.length) {
        addKeyBit();
      }
      
      // Обновляем отображение
      const rawKeyCells = rawKeyGrid ? rawKeyGrid.querySelectorAll('.key-bit') : [];
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
      console.log(`Игра BB84: Совпадений (без перехваченных): ${matches}`);
      
      if (matchCount) {
        matchCount.textContent = matches;
      }
    } catch (addError) {
      console.error('Игра BB84: Ошибка при добавлении в сырой ключ:', addError);
      if (sendPhotonBtn) {
        sendPhotonBtn.disabled = false;
      }
    }
  }
  
  function checkSiftingAvailability(matches) {
    // Проверяем, достаточно ли совпадений для просеивания (без перехваченных)
    if (matches >= MIN_MATCHES_FOR_SIFTING) {
      // Показываем уведомление только если это первое уведомление или прошло 4 кубита с последнего уведомления
      if (lastSiftNotificationCount === -1 || matches - lastSiftNotificationCount >= 4) {
        // Показываем уведомление
        if (siftKeyNotification) {
          siftKeyNotification.style.display = 'block';
          
          // Анимируем уведомление
          setTimeout(() => {
            siftKeyNotification.style.opacity = '1';
            siftKeyNotification.style.transform = 'translateY(0)';
          }, 50);
        }
        
        // Показываем дублирующее уведомление в том же месте, где и уведомления о перехвате
        if (siftNotification) {
          siftNotification.style.display = 'block';
          
          // Анимируем уведомление
          setTimeout(() => {
            siftNotification.style.opacity = '1';
            siftNotification.style.transform = 'translateY(0)';
          }, 50);
          
          // Скрываем через 2 секунды
          setTimeout(() => {
            siftNotification.style.display = 'none';
          }, 2000);
        }
        
        // Обновляем счетчик последнего уведомления
        lastSiftNotificationCount = matches;
        
        // Показываем кнопку просеивания
        if (siftKeyBtn) {
          siftKeyBtn.style.display = 'flex';
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
    console.log("Игра BB84: Просеивание ключа");
    
    try {
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
      
      console.log(`Игра BB84: Совпадающие биты (без перехваченных): ${matchingBits.join('')}`);
      console.log(`Игра BB84: Индексы совпадающих кубитов: ${matchingIndices.join(', ')}`);
      
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
        return;
      }
      
      // Берем первые 8 бит для финального ключа
      const finalKey = matchingBits.slice(0, FINAL_KEY_LENGTH);
      
      console.log(`Игра BB84: Финальный ключ: ${finalKey.join('')}`);
      
      // Показываем область финального ключа
      if (finalKeySection) {
        finalKeySection.style.display = 'block';
        
        // Анимируем появление
        setTimeout(() => {
          finalKeySection.style.opacity = '1';
          finalKeySection.style.transform = 'translateY(0)';
        }, 50);
      }
      
      // Отображаем финальный ключ
      const finalKeyCells = finalKeyGrid ? finalKeyGrid.querySelectorAll('.key-bit') : [];
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
      
      // Добавляем обработчики для кубитов в сыром ключе
      const rawKeyCells = rawKeyGrid.querySelectorAll('.key-bit');
      rawKeyCells.forEach((cell, index) => {
        cell.addEventListener('click', function() {
          showBitHistory(index);
        });
      });
      
      // Обновляем объяснение
      if (explanation) {
        explanation.innerHTML = `
          <p><strong>Поздравляем! Вы создали секретный 8-битный квантовый ключ:</strong> ${finalKey.join('')}</p>
          <p>Этот ключ можно использовать для безопасного шифрования сообщений с Бобом.</p>
          <p>Любая попытка перехвата (было ${eveIntercepts}) нарушила бы квантовые состояния и была бы обнаружена при сравнении части ключа.</p>
        `;
      }
      
      // Отключаем кнопку отправки
      if (sendPhotonBtn) {
        sendPhotonBtn.disabled = true;
        sendPhotonBtn.textContent = 'Ключ сгенерирован';
      }
      
      // Скрываем уведомление
      if (siftKeyNotification) {
        siftKeyNotification.style.display = 'none';
      }
      if (siftNotification) {
        siftNotification.style.display = 'none';
      }
      
      // Скрываем кнопку просеивания
      if (siftKeyBtn) {
        siftKeyBtn.style.display = 'none';
      }
      
      // Показываем кнопку "Сгенерировать новый ключ"
      if (newKeyBtn) {
        newKeyBtn.style.display = 'flex';
      }
      
      // Анимация финального ключа
      if (finalKeyCells) {
        finalKeyCells.forEach((cell, index) => {
          if (index < finalKey.length && cell) {
            setTimeout(() => {
              cell.style.transform = 'scale(1.2)';
              setTimeout(() => {
                cell.style.transform = 'scale(1)';
              }, 300);
            }, index * 150);
          }
        });
      }
    } catch (siftError) {
      console.error('Игра BB84: Ошибка при просеивании ключа:', siftError);
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
  
  function highlightFinalKeyBit(finalKeyIndex) {
    const finalKeyCells = finalKeyGrid.querySelectorAll('.key-bit');
    if (finalKeyIndex < finalKeyCells.length) {
      finalKeyCells[finalKeyIndex].classList.add('highlight');
    }
  }
  
  function unhighlightFinalKeyBit(finalKeyIndex) {
    const finalKeyCells = finalKeyGrid.querySelectorAll('.key-bit');
    if (finalKeyIndex < finalKeyCells.length) {
      finalKeyCells[finalKeyIndex].classList.remove('highlight');
    }
  }
  
  function resetGame() {
    console.log("Игра BB84: Сброс игры");
    
    try {
      // Сбрасываем состояние
      rawKey = [];
      matchingIndices = [];
      eveIntercepts = 0;
      
      // Сбрасываем счетчик уведомлений
      lastSiftNotificationCount = -1;
      
      // Останавливаем автоматическую отправку
      if (isAutoSending) {
        clearInterval(autoSendInterval);
        autoSendInterval = null;
        isAutoSending = false;
        autoSendBtn.textContent = 'Автоматическая отправка';
        autoSendBtn.style.background = 'linear-gradient(to bottom, #001a2d, #000c1a)';
      }
      
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
      
      // Сбрасываем сетки
      const rawKeyCells = rawKeyGrid ? rawKeyGrid.querySelectorAll('.key-bit') : [];
      rawKeyCells.forEach(cell => {
        if (cell) {
          cell.textContent = '';
          cell.style.background = 'rgba(0, 10, 20, 0.7)';
          cell.style.borderColor = 'rgba(0, 50, 80, 0.4)';
          cell.innerHTML = '';
          cell.classList.remove('new', 'source', 'highlight', 'intercept');
          
          // Удаляем обработчики событий
          const newCell = cell.cloneNode(true);
          cell.parentNode.replaceChild(newCell, cell);
        }
      });
      
      const finalKeyCells = finalKeyGrid ? finalKeyGrid.querySelectorAll('.key-bit') : [];
      finalKeyCells.forEach(cell => {
        if (cell) {
          cell.textContent = '';
          cell.classList.remove('active', 'highlight');
          delete cell.dataset.sourceIndex;
          
          // Удаляем обработчики событий
          const newCell = cell.cloneNode(true);
          cell.parentNode.replaceChild(newCell, cell);
        }
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
      
      // Активируем кнопку отправки
      if (sendPhotonBtn) {
        sendPhotonBtn.disabled = false;
        sendPhotonBtn.textContent = 'Отправить кубит';
      }
      
      // Скрываем уведомление и кнопку просеивания
      if (siftKeyNotification) {
        siftKeyNotification.style.display = 'none';
      }
      if (siftNotification) {
        siftNotification.style.display = 'none';
      }
      
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
        eveIcon.classList.remove('eve-active');
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
      
      if (expandInterval) {
        clearInterval(expandInterval);
        expandInterval = null;
      }
      
      // Удаляем возможные оставшиеся линии перехвата
      const existingLines = quantumChannel.querySelectorAll('.intercept-line');
      existingLines.forEach(line => {
        try {
          quantumChannel.removeChild(line);
        } catch (e) {
          console.log("Игра BB84: Ошибка при удалении линии перехвата", e);
        }
      });
      
      console.log("Игра BB84: Сброс завершен");
    } catch (resetError) {
      console.error('Игра BB84: Ошибка при сбросе игры:', resetError);
    }
  }
});
