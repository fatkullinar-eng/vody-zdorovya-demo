/* ============================================================
   «Воды Здоровья» — промо «Собери карту России»
   Демонстрационный макет. Чистый JavaScript, без библиотек.

   Как устроено:
   - 8 округов по 3 вопроса = 24;
   - верный ответ записывается, три верных ответа открывают округ;
   - прогресс хранится в localStorage;
   - друг открывает ссылку ?ref=...&district=... , отвечает на один
     вопрос, а «подарок» кладётся в общий ящик localStorage (vz_inbox_v1);
   - вкладка владельца ловит событие storage и засчитывает округ.
   ============================================================ */

'use strict';

/* ---------- Настройки, которые меняются при запуске ---------- */
const CONFIG = {
  storageKey: 'vz_map_v1',
  inboxKey: 'vz_inbox_v1',
  guestKey: 'vz_guest_v1',
  // Сюда можно вписать адрес сервера заявок. Пока пусто — форма демонстрационная.
  formEndpoint: ''
};

/* ---------- Данные квиза ----------
   Все факты взяты с официального сайта healthwaters.ru (страница «О компании»
   и каталог). Формулировки перед реальной акцией нужно согласовать с брендом. */
const DISTRICTS = [
  {
    id: 'cfo',
    name: 'Центральный',
    short: 'Центр',
    questions: [
      {
        text: 'В каком году компания «Воды Здоровья» начала доставлять воду на дом и в офис?',
        options: ['1995', '2001', '2014'],
        correct: 1,
        fact: 'Компания занимается доставкой воды на дом и в офис с 2001 года.'
      },
      {
        text: 'В каком году открылся собственный завод минеральных вод компании?',
        options: ['2008', '2014', '2019'],
        correct: 1,
        fact: 'Завод минеральных вод «Воды Здоровья» открылся в 2014 году.'
      },
      {
        text: 'Какие две марки выпускает собственный завод компании?',
        options: ['«Биовита» и «Стэлмас»', '«Ессентуки» и «Боржоми»', '«SVETLA» и «Donat Mg»'],
        correct: 0,
        fact: 'Свой завод производит минеральную воду «Биовита» и питьевую воду «Стэлмас».'
      }
    ]
  },
  {
    id: 'szfo',
    name: 'Северо-Западный',
    short: 'Северо-Запад',
    questions: [
      {
        text: 'На какую глубину уходит скважина, из которой добывают воду?',
        options: ['Около 30 метров', 'Более 100 метров', 'Около 500 метров'],
        correct: 1,
        fact: 'Скважина глубиной более 100 метров защищена от человеческого фактора.'
      },
      {
        text: 'Как компания сохраняет природный состав воды?',
        options: ['Добавляет минералы', 'Не использует сложных систем очистки', 'Применяет обратный осмос'],
        correct: 1,
        fact: 'Компания не использует сложных систем очистки и сохраняет свойства природной воды.'
      },
      {
        text: 'Сколько бутылок продукции продаётся примерно за месяц?',
        options: ['200 тысяч', '2 миллиона', '20 миллионов'],
        correct: 1,
        fact: 'По данным компании, в месяц продаётся свыше 2 миллионов бутылок.'
      }
    ]
  },
  {
    id: 'yfo',
    name: 'Южный',
    short: 'Юг',
    questions: [
      {
        text: 'Из какой страны поставляется минеральная вода Sulinka?',
        options: ['Словакия', 'Словения', 'Армения'],
        correct: 0,
        fact: 'Минеральная вода Sulinka приезжает из Словакии.'
      },
      {
        text: 'Из какой страны поставляется минеральная вода SVETLA?',
        options: ['Словакия', 'Словения', 'Грузия'],
        correct: 1,
        fact: 'Минеральная вода SVETLA — из Словении.'
      },
      {
        text: 'Из какой страны поставляется минеральная вода «БЖНИ»?',
        options: ['Армения', 'Азербайджан', 'Сербия'],
        correct: 0,
        fact: 'Минеральная вода «БЖНИ» приезжает из Армении.'
      }
    ]
  },
  {
    id: 'skfo',
    name: 'Северо-Кавказский',
    short: 'Кавказ',
    questions: [
      {
        text: 'Какая вода из линейки относится к лечебной?',
        options: ['«Стэлмас Zn Se»', '«Donat Mg»', '«Стэлмас Кремнистая»'],
        correct: 1,
        fact: 'Donat Mg — минеральная лечебная вода из Словении.'
      },
      {
        text: 'Как называется лечебно-столовая вода с высоким содержанием магния?',
        options: ['«БиоВита»', '«Стэлмас Mg»', '«Sulinka»'],
        correct: 1,
        fact: '«Стэлмас Mg» — минеральная лечебно-столовая вода российского производства.'
      },
      {
        text: 'Какая известная лечебная вода в каталоге производится в России?',
        options: ['«Donat Mg»', '«Sulinka»', '«Ессентуки № 4»'],
        correct: 2,
        fact: '«Ессентуки № 4» — российская минеральная вода в каталоге компании.'
      }
    ]
  },
  {
    id: 'pfo',
    name: 'Приволжский',
    short: 'Поволжье',
    questions: [
      {
        text: 'Какая категория воды есть в каталоге компании?',
        options: ['Ледниковая', 'Кислородная', 'Вулканическая'],
        correct: 1,
        fact: 'В каталоге есть кислородная, активная, детская, питьевая, минеральная и лечебная вода.'
      },
      {
        text: 'Для кого в каталоге есть отдельная категория воды?',
        options: ['Для домашних растений', 'Для автомобилей', 'Для детей'],
        correct: 2,
        fact: 'У компании есть отдельная категория детской воды.'
      },
      {
        text: 'Какая вода в каталоге называется «активной»?',
        options: ['«Стэлмас»', '«БиоВита»', '«Sulinka»'],
        correct: 1,
        fact: 'Активная вода «БиоВита» — собственная марка компании.'
      }
    ]
  },
  {
    id: 'ufo',
    name: 'Уральский',
    short: 'Урал',
    questions: [
      {
        text: 'Какие два микроэлемента указаны в названии воды «Стэлмас Zn Se»?',
        options: ['Кальций и магний', 'Железо и медь', 'Цинк и селен'],
        correct: 2,
        fact: 'Zn — цинк, Se — селен. Оба элемента вынесены в название воды.'
      },
      {
        text: 'Как называется минеральная вода «Стэлмас» с кремнием?',
        options: ['«Стэлмас Железистая»', '«Стэлмас Кремнистая»', '«Стэлмас Йодированная»'],
        correct: 1,
        fact: 'В каталоге есть минеральная вода «Стэлмас Кремнистая».'
      },
      {
        text: 'Для чего предназначена вода «Стэлмас О2 спорт»?',
        options: ['Для спорта и активного образа жизни', 'Для детского питания', 'Для кулинарии'],
        correct: 0,
        fact: '«Стэлмас О2 спорт» — вода для спорта и активного образа жизни.'
      }
    ]
  },
  {
    id: 'sfo',
    name: 'Сибирский',
    short: 'Сибирь',
    questions: [
      {
        text: 'Какие объёмы бутылок есть в каталоге компании?',
        options: ['Только 0,5 л', '0,33 л, 0,6 л и 1,5 л — все есть', 'Только 19 л'],
        correct: 1,
        fact: 'В каталоге встречаются бутылки 0,33, 0,5, 0,6, 1, 1,25, 1,5, 5 и 19 литров.'
      },
      {
        text: 'Какая большая тара для кулера есть в каталоге?',
        options: ['10 и 25 литров', '5 и 19 литров', '3 и 7 литров'],
        correct: 1,
        fact: 'Компания предлагает воду в таре 5 и 19 литров.'
      },
      {
        text: 'Что ещё, кроме воды, можно заказать в компании?',
        options: ['Только воду', 'Только стаканы', 'Кулеры и помпы'],
        correct: 2,
        fact: 'В каталоге есть кулеры и помпы для воды, а также косметика, соки и витамины.'
      }
    ]
  },
  {
    id: 'dfo',
    name: 'Дальневосточный',
    short: 'Дальний Восток',
    questions: [
      {
        text: 'От какой суммы доставка днём бесплатная?',
        options: ['От 1000 рублей', 'От 2500 рублей', 'От 5000 рублей'],
        correct: 1,
        fact: 'Дневная доставка бесплатна от 2500 рублей, вечерняя — от 3000 рублей.'
      },
      {
        text: 'По какому номеру можно позвонить бесплатно по России?',
        options: ['8 800 100 15 15', '8 900 123 45 67', '8 495 000 00 00'],
        correct: 0,
        fact: 'Бесплатный номер компании — 8 800 100 15 15.'
      },
      {
        text: 'В каком из этих городов компания доставляет воду?',
        options: ['Тюмень', 'Иркутск', 'Владивосток'],
        correct: 0,
        fact: 'Среди городов доставки: Москва, Санкт-Петербург, Самара, Тольятти, Тюмень, Калининград.'
      }
    ]
  }
];

/* ---------- Состояние ---------- */
const DEFAULT_STATE = () => ({
  version: 1,
  refCode: null,
  solved: [],
  answers: {},
  attempts: {},
  progress: {},
  current: null,
  participant: null,
  submitted: false
});

let state = DEFAULT_STATE();

/* ---------- Короткие помощники ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function baseUrl() {
  return location.href.split(/[?#]/)[0];
}

function cleanUrl() {
  try {
    history.replaceState(null, '', baseUrl());
  } catch (e) {
    /* на file:// история может быть недоступна — не критично */
  }
}

function saveState() {
  writeJson(CONFIG.storageKey, state);
}

function loadState() {
  const raw = readJson(CONFIG.storageKey, null);
  const next = DEFAULT_STATE();
  if (!raw || typeof raw !== 'object') return next;

  if (typeof raw.refCode === 'string' && raw.refCode) next.refCode = raw.refCode;
  if (Array.isArray(raw.solved)) {
    next.solved = raw.solved.filter(id => DISTRICTS.some(d => d.id === id));
  }

  // Оставляем только ответы на существующие вопросы: если контент поменяют,
  // старые ключи не должны ломать прогресс.
  if (raw.answers && typeof raw.answers === 'object') {
    Object.keys(raw.answers).forEach(key => {
      const [districtId, qIndex] = key.split('-');
      const district = DISTRICTS.find(d => d.id === districtId);
      if (district && Number.isInteger(Number(qIndex)) && district.questions[Number(qIndex)]) {
        next.answers[key] = Number(raw.answers[key]);
      }
    });
  }

  if (raw.attempts && typeof raw.attempts === 'object') {
    Object.keys(raw.attempts).forEach(key => {
      const value = Number(raw.attempts[key]);
      if (Number.isFinite(value) && value >= 0) next.attempts[key] = value;
    });
  }

  if (raw.progress && typeof raw.progress === 'object') {
    Object.keys(raw.progress).forEach(key => {
      if (!DISTRICTS.some(d => d.id === key)) return;
      const value = Number(raw.progress[key]);
      if (Number.isFinite(value)) next.progress[key] = Math.max(0, Math.min(3, value));
    });
  }

  if (typeof raw.current === 'string' && DISTRICTS.some(d => d.id === raw.current)) {
    next.current = raw.current;
  }
  if (typeof raw.participant === 'string') next.participant = raw.participant;
  next.submitted = raw.submitted === true;

  return next;
}

function randomCode(length) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function ensureRefCode() {
  if (!state.refCode) {
    state.refCode = randomCode(6);
    saveState();
  }
  return state.refCode;
}

/* ---------- Экраны ---------- */
const SCREENS = () => $$('.screen');

function showScreen(name) {
  const screens = SCREENS();
  if (!screens.some(s => s.dataset.screen === name)) return;

  closeShare();
  if (name !== 'map') hideToast();

  screens.forEach(screen => {
    screen.classList.toggle('is-active', screen.dataset.screen === name);
  });
  document.body.dataset.screen = name;

  if (name === 'map') renderMap();
  if (name === 'final') renderFinal();
  updateHead();

  window.scrollTo(0, 0);
  const active = $('.screen.is-active');
  const focusTarget = active ? active.querySelector('[tabindex="-1"]') : null;
  if (focusTarget) {
    setTimeout(() => focusTarget.focus({ preventScroll: true }), 40);
  }
}

function updateHead() {
  const count = $('#head-count');
  if (count) count.textContent = String(state.solved.length);
}

function updateStartButtons() {
  const heroStart = $('#hero-start');
  let label = 'Начать собирать';

  if (state.solved.length === 8) label = 'Забрать приз';
  else if (state.solved.length > 0) label = 'Продолжить — ' + state.solved.length + ' из 8';
  else if (Object.keys(state.answers).length > 0) label = 'Продолжить квиз';

  if (heroStart) heroStart.textContent = label;
  $$('[data-start]').forEach(btn => { btn.textContent = label; });
}

function startOrContinue() {
  if (state.solved.length === 8) {
    showFinal();
    return;
  }

  if (state.current) {
    const district = DISTRICTS.find(d => d.id === state.current);
    if (district && !state.solved.includes(district.id)) {
      startDistrict(district.id);
      return;
    }
  }

  if (state.solved.length > 0) {
    showScreen('map');
    return;
  }

  startDistrict(DISTRICTS[0].id);
}

/* ---------- Квиз ---------- */
let optionEls = [];
let currentDistrictId = null;

function currentDistrict() {
  return DISTRICTS.find(d => d.id === currentDistrictId) || null;
}

function startDistrict(id) {
  const district = DISTRICTS.find(d => d.id === id);
  if (!district) return;

  if (state.solved.includes(id)) {
    if (document.body.dataset.screen !== 'map') {
      renderMap();
      showScreen('map');
    }
    showToast(id, 'already');
    return;
  }

  currentDistrictId = id;
  state.current = id;

  const progress = Number(state.progress[id]);
  if (!Number.isInteger(progress) || progress < 0 || progress > 2) {
    state.progress[id] = 0;
  }
  saveState();

  renderQuestion();
  showScreen('quiz');
}

function renderQuestion() {
  const district = currentDistrict();
  if (!district) {
    showScreen('map');
    return;
  }

  const index = Number(state.progress[district.id]) || 0;
  const question = district.questions[index];
  if (!question) {
    completeDistrict(district);
    return;
  }

  const key = district.id + '-' + index;
  const answered = Object.prototype.hasOwnProperty.call(state.answers, key);
  const attempts = Number(state.attempts[key]) || 0;

  const districtLabel = $('#quiz-district');
  const counter = $('#quiz-counter');
  const questionEl = $('#quiz-question');
  const optionsEl = $('#quiz-options');
  const feedback = $('#quiz-feedback');
  const actions = $('#quiz-actions');
  const card = $('#quiz-card');

  if (districtLabel) districtLabel.textContent = district.name + ' округ';
  if (counter) counter.textContent = 'Вопрос ' + (index + 1) + ' из ' + district.questions.length;
  if (questionEl) questionEl.textContent = question.text;

  if (optionsEl) {
    optionsEl.innerHTML = '';
    optionEls = [];
  }
  if (feedback) { feedback.hidden = true; feedback.className = 'quiz__feedback'; feedback.innerHTML = ''; }
  if (actions) actions.hidden = true;
  if (card) card.classList.remove('is-shaking');

  question.options.forEach((text, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.index = String(i);

    const keyEl = document.createElement('span');
    keyEl.className = 'option__key';
    keyEl.textContent = ['А', 'Б', 'В'][i] || String(i + 1);

    const textEl = document.createElement('span');
    textEl.className = 'option__text';
    textEl.textContent = text;

    button.appendChild(keyEl);
    button.appendChild(textEl);
    button.addEventListener('click', () => handleAnswer(i));
    optionsEl.appendChild(button);
    optionEls.push(button);
  });

  if (answered) {
    optionEls.forEach(btn => { btn.disabled = true; });
    if (optionEls[question.correct]) optionEls[question.correct].classList.add('is-correct');
    showFeedback('ok', '<strong>Верно.</strong> ' + question.fact);
    showNext(index === district.questions.length - 1 ? 'Получить округ' : 'Дальше');
  } else if (attempts >= 2) {
    if (optionEls[question.correct]) optionEls[question.correct].classList.add('is-hint');
    showFeedback('bad', 'Подсказка: ' + question.fact + ' Правильный вариант подсвечен.');
  }

  updateQuizProgress(index, answered);
}

function updateQuizProgress(index, answered) {
  const district = currentDistrict();
  const bar = $('#quiz-bar');
  const count = Object.keys(state.answers).length;

  if (bar && district) {
    const filled = (index + (answered ? 1 : 0)) / district.questions.length;
    bar.style.width = Math.round(filled * 100) + '%';
  }

  const global = $('#quiz-global');
  const answers = $('#quiz-answers');
  if (global) global.textContent = 'Открыто округов: ' + state.solved.length + ' из 8';
  if (answers) answers.textContent = 'Верных ответов: ' + count + ' из 24';
}

function showFeedback(type, html) {
  const feedback = $('#quiz-feedback');
  if (!feedback) return;
  feedback.className = 'quiz__feedback ' + (type === 'ok' ? 'is-ok' : 'is-bad');
  feedback.innerHTML = html;
  feedback.hidden = false;
}

function showNext(label) {
  const actions = $('#quiz-actions');
  const next = $('#quiz-next');
  if (next) next.textContent = label;
  if (actions) actions.hidden = false;
}

function handleAnswer(index) {
  const district = currentDistrict();
  if (!district) return;

  const qIndex = Number(state.progress[district.id]) || 0;
  const question = district.questions[qIndex];
  const key = district.id + '-' + qIndex;
  if (!question) return;
  if (Object.prototype.hasOwnProperty.call(state.answers, key)) return;

  const buttons = optionEls;
  const card = $('#quiz-card');

  if (index === question.correct) {
    state.answers[key] = index;
    saveState();

    buttons.forEach(btn => {
      btn.disabled = true;
      btn.classList.remove('is-hint');
    });
    if (buttons[index]) buttons[index].classList.add('is-correct');

    showFeedback('ok', '<strong>Верно.</strong> ' + question.fact);
    showNext(qIndex === district.questions.length - 1 ? 'Получить округ' : 'Дальше');
    updateQuizProgress(qIndex, true);
    updateHead();
    return;
  }

  const attempts = (Number(state.attempts[key]) || 0) + 1;
  state.attempts[key] = attempts;
  saveState();

  if (buttons[index]) {
    buttons[index].classList.add('is-wrong');
    buttons[index].disabled = true;
  }

  if (attempts >= 2) {
    if (buttons[question.correct]) buttons[question.correct].classList.add('is-hint');
    showFeedback('bad', 'Подсказка: ' + question.fact + ' Правильный вариант подсвечен.');
  } else {
    showFeedback('bad', 'Пока не то. Попробуйте другой вариант — подсказка появится после второй попытки.');
  }

  if (card) {
    card.classList.remove('is-shaking');
    void card.offsetWidth;
    card.classList.add('is-shaking');
    setTimeout(() => card.classList.remove('is-shaking'), 420);
  }
}

function nextQuestion() {
  const district = currentDistrict();
  if (!district) return;

  const qIndex = Number(state.progress[district.id]) || 0;
  const key = district.id + '-' + qIndex;
  if (!Object.prototype.hasOwnProperty.call(state.answers, key)) return;

  if (qIndex >= district.questions.length - 1) {
    completeDistrict(district);
    return;
  }

  state.progress[district.id] = qIndex + 1;
  saveState();
  renderQuestion();
}

function completeDistrict(district) {
  const allAnswered = district.questions.every((_, i) =>
    Object.prototype.hasOwnProperty.call(state.answers, district.id + '-' + i)
  );
  if (!allAnswered) return;

  if (!state.solved.includes(district.id)) state.solved.push(district.id);
  state.progress[district.id] = 3;
  state.current = null;
  saveState();

  currentDistrictId = null;
  renderMap();
  showScreen('map');
  updateStartButtons();

  $$('[data-district="' + district.id + '"]').forEach(el => {
    el.classList.add('is-new');
    setTimeout(() => el.classList.remove('is-new'), 1200);
  });

  showToast(district.id, 'quiz');
}

/* ---------- Карта ---------- */
function getMissing() {
  return DISTRICTS.filter(d => !state.solved.includes(d.id));
}

function renderMap() {
  const solved = state.solved;

  $$('[data-district]').forEach(el => {
    el.classList.toggle('is-filled', solved.includes(el.dataset.district));
  });
  $$('[data-label]').forEach(el => {
    el.classList.toggle('is-filled', solved.includes(el.dataset.label));
  });

  const mapCount = $('#map-count');
  if (mapCount) mapCount.textContent = String(solved.length);

  const missingCount = $('#missing-count');
  if (missingCount) missingCount.textContent = String(8 - solved.length);

  const headCount = $('#head-count');
  if (headCount) headCount.textContent = String(solved.length);

  // Полоска из 8 сегментов
  const progress = $('#map-progress');
  if (progress) {
    progress.innerHTML = '';
    DISTRICTS.forEach(d => {
      const segment = document.createElement('span');
      if (solved.includes(d.id)) segment.classList.add('is-filled');
      progress.appendChild(segment);
    });
  }

  // Список округов для мобильной версии
  const list = $('#map-list');
  if (list) {
    list.innerHTML = '';
    DISTRICTS.forEach(d => {
      const item = document.createElement('li');
      if (solved.includes(d.id)) item.classList.add('is-filled');
      const name = document.createElement('span');
      name.textContent = d.name;
      const status = document.createElement('span');
      status.textContent = solved.includes(d.id) ? 'собран' : 'не открыт';
      item.appendChild(name);
      item.appendChild(status);
      list.appendChild(item);
    });
  }

  // Кнопки недостающих округов
  const chips = $('#missing-chips');
  const missing = getMissing();
  if (chips) {
    chips.innerHTML = '';
    missing.forEach(d => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = d.name;
      chip.title = 'Открыть округ «' + d.name + '»';
      chip.addEventListener('click', () => startDistrict(d.id));
      chips.appendChild(chip);
    });
  }

  const lead = $('#missing-lead');
  const shareCta = $('#share-cta');
  const continueBtn = $('#continue-quiz');
  const cardTitle = $('.missing-card .card__title');

  if (missing.length === 0) {
    if (lead) lead.textContent = 'Все восемь округов на карте. Заберите приз.';
    if (shareCta) shareCta.hidden = true;
    if (continueBtn) continueBtn.textContent = 'Забрать приз';
    if (cardTitle) cardTitle.textContent = 'Карта собрана';
  } else {
    if (lead) lead.textContent = 'Каждый округ открывается тремя верными ответами. Или помощью друга — он ответит на один вопрос.';
    if (shareCta) shareCta.hidden = false;
    if (continueBtn) continueBtn.textContent = 'Продолжить квиз';
    if (cardTitle) cardTitle.textContent = 'Не хватает ' + missing.length;
    if (missingCount) missingCount.textContent = String(missing.length);
  }

  updateHead();
  updateStartButtons();
}

/* ---------- Плашка «округ собран» ---------- */
let toastDistrictId = null;
let toastKind = null;

function showToast(districtId, kind) {
  const district = DISTRICTS.find(d => d.id === districtId);
  const toast = $('#district-toast');
  if (!district || !toast) return;

  toastDistrictId = districtId;
  toastKind = kind;

  const eyebrow = $('.district-toast .eyebrow');
  const title = $('#toast-title');
  const text = $('#toast-text');
  const next = $('#toast-next');

  const allDone = state.solved.length === 8;

  if (eyebrow) eyebrow.textContent = allDone ? 'Карта собрана' : kind === 'already' ? 'Уже на карте' : 'Округ собран';
  if (title) title.textContent = district.name + ' округ';
  if (next) next.hidden = kind === 'already';

  if (allDone) {
    if (text) text.textContent = 'Все восемь округов на месте. Осталось оставить заявку.';
    if (next) next.textContent = 'Забрать приз';
  } else if (kind === 'friend') {
    if (text) text.textContent = 'Друг ответил на вопрос — округ засчитан вам. Собрано ' + state.solved.length + ' из 8.';
  } else if (kind === 'already') {
    if (text) text.textContent = 'Этот округ уже собран. Можно выбрать другой.';
  } else {
    if (text) text.textContent = 'Собрано ' + state.solved.length + ' из 8 округов.';
    if (next) next.textContent = 'Следующий округ';
  }

  toast.hidden = false;
}

function hideToast() {
  const toast = $('#district-toast');
  if (toast) toast.hidden = true;
  toastDistrictId = null;
  toastKind = null;
}

/* ---------- Шеринг ---------- */
let shareDistrictId = null;

function buildShareLink(districtId) {
  ensureRefCode();
  const base = baseUrl();
  try {
    const url = new URL(base);
    url.searchParams.set('ref', state.refCode);
    url.searchParams.set('district', districtId);
    return url.toString();
  } catch (e) {
    return base + '?ref=' + encodeURIComponent(state.refCode) + '&district=' + encodeURIComponent(districtId);
  }
}

function shareText(districtId) {
  const district = DISTRICTS.find(d => d.id === districtId);
  if (!district) return 'Соберите карту России в акции «Воды Здоровья».';
  return 'Я собираю карту России в акции «Воды Здоровья». Мне не хватает округа «' +
    district.name + '» — ответь на один вопрос по ссылке, и он засчитается.';
}

function renderShareChips() {
  const container = $('#share-districts');
  if (!container) return;
  container.innerHTML = '';

  const missing = getMissing();
  missing.forEach(d => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (d.id === shareDistrictId ? ' is-active' : '');
    chip.textContent = d.name;
    chip.addEventListener('click', () => {
      shareDistrictId = d.id;
      renderShareChips();
      updateShare();
    });
    container.appendChild(chip);
  });
}

function updateShare() {
  const input = $('#share-url');
  if (!shareDistrictId) return;

  const link = buildShareLink(shareDistrictId);
  const text = shareText(shareDistrictId);

  if (input) input.value = link;

  const status = $('#share-status');
  if (status) status.textContent = '';

  const tg = $('#share-tg');
  const vk = $('#share-vk');
  const wa = $('#share-wa');
  const native = $('#share-native');

  if (tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
  if (vk) vk.href = 'https://vk.com/share.php?url=' + encodeURIComponent(link) + '&title=' + encodeURIComponent(text);
  if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(text + '\n' + link);
  if (native) native.hidden = !(navigator.share && typeof navigator.share === 'function');
}

function openShare() {
  const missing = getMissing();
  if (missing.length === 0) {
    showFinal();
    return;
  }

  if (!shareDistrictId || !missing.some(d => d.id === shareDistrictId)) {
    shareDistrictId = missing[0].id;
  }

  ensureRefCode();
  renderShareChips();
  updateShare();

  const sheet = $('#share-sheet');
  if (sheet) sheet.hidden = false;
  document.documentElement.classList.add('lock');

  const closeBtn = $('.sheet__close');
  if (closeBtn) setTimeout(() => closeBtn.focus({ preventScroll: true }), 30);
}

function closeShare() {
  const sheet = $('#share-sheet');
  if (sheet) sheet.hidden = true;
  document.documentElement.classList.remove('lock');
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* переходим к запасному способу */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

/* ---------- Друг и «подарки» ---------- */
function readGuest() {
  try {
    const raw = sessionStorage.getItem(CONFIG.guestKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeGuest(value) {
  try {
    sessionStorage.setItem(CONFIG.guestKey, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function writeInbox(toRef, districtId) {
  const list = readJson(CONFIG.inboxKey, []);
  const safe = Array.isArray(list) ? list : [];
  const exists = safe.some(item => item && item.to === toRef && item.district === districtId);
  if (exists) return;

  safe.push({ to: toRef, district: districtId, ts: Date.now() });
  writeJson(CONFIG.inboxKey, safe);

  // Если вкладка владельца открыта, она получит событие storage.
  // Если нет — запись дождётся следующего открытия сайта.
}

function consumeInbox() {
  if (!state.refCode) return [];

  const list = readJson(CONFIG.inboxKey, []);
  if (!Array.isArray(list) || list.length === 0) return [];

  const mine = list.filter(item => item && item.to === state.refCode);
  if (mine.length === 0) return [];

  const rest = list.filter(item => !(item && item.to === state.refCode));
  writeJson(CONFIG.inboxKey, rest);

  const added = [];
  mine.forEach(item => {
    const district = DISTRICTS.find(d => d.id === item.district);
    if (district && !state.solved.includes(district.id)) {
      state.solved.push(district.id);
      state.progress[district.id] = 3;
      added.push(district.id);
    }
  });

  if (added.length > 0) saveState();
  return added;
}

function initFriend(ref, districtId, demo) {
  const district = DISTRICTS.find(d => d.id === districtId);
  if (!district) {
    cleanUrl();
    showScreen('hero');
    return;
  }

  showScreen('friend');

  const main = $('#friend-main');
  const done = $('#friend-done');
  const own = $('#friend-own');
  if (main) main.hidden = false;
  if (done) done.hidden = true;
  if (own) own.hidden = true;

  // Человек открыл собственную ссылку. Округ себе не начисляем.
  if (ref === state.refCode && !demo) {
    if (main) main.hidden = true;
    if (own) own.hidden = false;
    return;
  }

  const districtLabel = $('#friend-district');
  if (districtLabel) districtLabel.textContent = district.name;

  const saved = readGuest();
  const alreadyDone = saved && saved.done === true &&
    saved.ref === ref && saved.district === districtId;

  if (alreadyDone) {
    showFriendDone(district, demo);
    return;
  }

  renderFriendQuestion(district, ref, demo);
}

function renderFriendQuestion(district, ref, demo) {
  const question = district.questions[0];
  const questionEl = $('#friend-question');
  const optionsEl = $('#friend-options');
  const feedback = $('#friend-feedback');
  const actions = $('#friend-actions');
  const next = $('#friend-next');

  if (questionEl) questionEl.textContent = question.text;
  if (feedback) { feedback.hidden = true; feedback.className = 'quiz__feedback'; feedback.innerHTML = ''; }
  if (actions) actions.hidden = true;
  if (optionsEl) optionsEl.innerHTML = '';

  let attempts = 0;
  const buttons = [];

  question.options.forEach((text, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';

    const keyEl = document.createElement('span');
    keyEl.className = 'option__key';
    keyEl.textContent = ['А', 'Б', 'В'][i] || String(i + 1);

    const textEl = document.createElement('span');
    textEl.className = 'option__text';
    textEl.textContent = text;

    button.appendChild(keyEl);
    button.appendChild(textEl);
    button.addEventListener('click', () => {
      if (i === question.correct) {
        buttons.forEach(btn => { btn.disabled = true; btn.classList.remove('is-hint'); });
        button.classList.add('is-correct');
        if (feedback) {
          feedback.className = 'quiz__feedback is-ok';
          feedback.innerHTML = '<strong>Верно.</strong> ' + question.fact;
          feedback.hidden = false;
        }
        if (actions) actions.hidden = false;
        if (next) next.textContent = 'Помочь другу';

        writeInbox(ref, district.id);
        writeGuest({ ref: ref, district: district.id, demo: demo, done: true });
        return;
      }

      attempts += 1;
      button.classList.add('is-wrong');
      button.disabled = true;

      if (attempts >= 2) {
        if (buttons[question.correct]) buttons[question.correct].classList.add('is-hint');
        if (feedback) {
          feedback.className = 'quiz__feedback is-bad';
          feedback.innerHTML = 'Подсказка: ' + question.fact + ' Правильный вариант подсвечен.';
          feedback.hidden = false;
        }
      } else if (feedback) {
        feedback.className = 'quiz__feedback is-bad';
        feedback.textContent = 'Пока не то. Попробуйте другой вариант.';
        feedback.hidden = false;
      }
    });

    optionsEl.appendChild(button);
    buttons.push(button);
  });
}

function showFriendDone(district, demo) {
  const main = $('#friend-main');
  const done = $('#friend-done');
  const own = $('#friend-own');
  const text = $('#friend-done-text');
  const returnBtn = $('#friend-return');
  const startBtn = $('#friend-start');

  if (main) main.hidden = true;
  if (own) own.hidden = true;
  if (done) done.hidden = false;

  if (text) {
    text.textContent = 'Округ «' + district.name + '» засчитан другу. ' +
      'Спасибо за помощь — в демо-версии зачисление работает в пределах одного браузера.';
  }
  if (returnBtn) returnBtn.hidden = !demo;
  if (startBtn) startBtn.hidden = demo;
}

/* ---------- Финал ---------- */
function ensureParticipant() {
  if (!state.participant) {
    const year = new Date().getFullYear();
    const number = Math.floor(10000 + Math.random() * 90000);
    state.participant = 'VZ-' + year + '-' + number;
    saveState();
  }
  return state.participant;
}

function renderFinal() {
  ensureParticipant();

  const number = $('#participant-number');
  if (number) number.textContent = state.participant || '—';

  const finalMap = $('#final-map');
  const hubMap = $('#map-hub');
  if (finalMap && hubMap) {
    finalMap.innerHTML = hubMap.innerHTML;
    $$('.map__district', finalMap).forEach(path => {
      path.classList.add('is-filled');
      path.removeAttribute('tabindex');
      path.removeAttribute('role');
    });
    $$('.map__label', finalMap).forEach(label => label.classList.add('is-filled'));
  }

  const error = $('#form-error');
  if (error) error.hidden = true;
}

function showFinal() {
  if (state.solved.length < 8) {
    renderMap();
    showScreen('map');
    return;
  }
  hideToast();
  renderFinal();
  showScreen('final');
}

/* ---------- Форма ---------- */
function handleFormSubmit(event) {
  event.preventDefault();

  const nameInput = $('#field-name');
  const phoneInput = $('#field-phone');
  const emailInput = $('#field-email');
  const ageInput = $('#check-age');
  const consentInput = $('#check-consent');
  const errorEl = $('#form-error');

  [nameInput, phoneInput, emailInput].forEach(input => {
    if (input) input.classList.remove('is-invalid');
  });
  if (errorEl) errorEl.hidden = true;

  const errors = [];
  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const digits = phone.replace(/\D/g, '');

  if (name.length < 2) {
    errors.push({ input: nameInput, message: 'Укажите имя — хотя бы два символа.' });
  }
  if (digits.length < 5) {
    errors.push({ input: phoneInput, message: 'Введите демо-номер: минимум пять цифр.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ input: emailInput, message: 'Проверьте адрес электронной почты.' });
  }
  if (!ageInput || !ageInput.checked) {
    errors.push({ input: ageInput, message: 'Подтвердите, что вам есть 18 лет.' });
  }
  if (!consentInput || !consentInput.checked) {
    errors.push({ input: consentInput, message: 'Нужно согласие на обработку персональных данных.' });
  }

  if (errors.length > 0) {
    const first = errors[0];
    if (first.input) {
      first.input.classList.add('is-invalid');
      first.input.focus({ preventScroll: false });
    }
    if (errorEl) {
      errorEl.textContent = first.message;
      errorEl.hidden = false;
    }
    return;
  }

  // Демо-режим: данные никуда не отправляются и не сохраняются.
  // Если появится сервер, здесь будет fetch(CONFIG.formEndpoint, ...).
  state.submitted = true;
  saveState();

  const thanksNumber = $('#thanks-number');
  if (thanksNumber) thanksNumber.textContent = state.participant || '—';

  showScreen('thanks');
}

/* ---------- Сброс ---------- */
function resetAll(reload) {
  try {
    localStorage.removeItem(CONFIG.storageKey);
    localStorage.removeItem(CONFIG.inboxKey);
  } catch (e) { /* игнорируем */ }

  try {
    sessionStorage.removeItem(CONFIG.guestKey);
  } catch (e) { /* игнорируем */ }

  state = DEFAULT_STATE();

  if (reload) {
    cleanUrl();
    location.reload();
  }
}

/* ---------- Запуск ---------- */
function init() {
  const params = new URLSearchParams(location.search);

  if (params.get('reset') === '1') {
    resetAll(false);
    cleanUrl();
  }

  state = loadState();

  const ref = params.get('ref');
  const districtParam = params.get('district');
  const demo = params.get('demo') === '1';

  // Общие обработчики
  $$('[data-go]').forEach(el => {
    el.addEventListener('click', event => {
      event.preventDefault();
      showScreen(el.dataset.go || 'hero');
    });
  });

  const heroStart = $('#hero-start');
  if (heroStart) heroStart.addEventListener('click', startOrContinue);

  $$('[data-start]').forEach(btn => {
    btn.addEventListener('click', startOrContinue);
  });

  const nextBtn = $('#quiz-next');
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

  const continueBtn = $('#continue-quiz');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      if (state.solved.length === 8) {
        showFinal();
        return;
      }
      const next = getMissing()[0];
      if (next) startDistrict(next.id);
    });
  }

  const shareCta = $('#share-cta');
  if (shareCta) shareCta.addEventListener('click', openShare);

  const toastNext = $('#toast-next');
  if (toastNext) {
    toastNext.addEventListener('click', () => {
      if (state.solved.length === 8) {
        hideToast();
        showFinal();
        return;
      }
      const next = getMissing()[0];
      hideToast();
      if (next) startDistrict(next.id);
    });
  }

  const toastClose = $('#toast-close');
  if (toastClose) toastClose.addEventListener('click', hideToast);

  const resetBtn = $('#reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const ok = window.confirm('Сбросить весь прогресс демонстрации? Собранные округа и ответы будут удалены.');
      if (ok) {
        resetAll(true);
      }
    });
  }

  // Карта: клики и клавиатура
  const hubMap = $('#map-hub');
  if (hubMap) {
    $$('.map__district', hubMap).forEach(path => {
      const activate = () => {
        const id = path.dataset.district;
        if (state.solved.includes(id)) {
          showToast(id, 'already');
        } else {
          startDistrict(id);
        }
      };
      path.addEventListener('click', activate);
      path.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  // Шеринг
  const sheet = $('#share-sheet');
  if (sheet) {
    $$('[data-close-sheet]', sheet).forEach(el => {
      el.addEventListener('click', closeShare);
    });
  }

  const copyBtn = $('#share-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const input = $('#share-url');
      const status = $('#share-status');
      if (!input) return;
      const ok = await copyText(input.value);
      if (status) {
        status.textContent = ok
          ? 'Ссылка скопирована.'
          : 'Не удалось скопировать автоматически — выделите ссылку и скопируйте вручную.';
      }
      if (!ok) input.select();
    });
  }

  const maxBtn = $('#share-max');
  if (maxBtn) {
    maxBtn.addEventListener('click', async () => {
      const status = $('#share-status');
      if (!shareDistrictId) return;
      const text = shareText(shareDistrictId) + '\n' + buildShareLink(shareDistrictId);
      const ok = await copyText(text);
      if (status) status.textContent = ok ? 'Текст для Max скопирован.' : 'Не удалось скопировать текст.';
    });
  }

  const nativeBtn = $('#share-native');
  if (nativeBtn) {
    nativeBtn.addEventListener('click', () => {
      if (!shareDistrictId) return;
      const link = buildShareLink(shareDistrictId);
      navigator.share({
        title: 'Соберите карту России',
        text: shareText(shareDistrictId),
        url: link
      }).catch(error => {
        if (error && error.name !== 'AbortError') copyText(shareText(shareDistrictId) + '\n' + link);
      });
    });
  }

  if (nativeBtn) nativeBtn.hidden = !(navigator.share && typeof navigator.share === 'function');

  const demoBtn = $('#share-demo-open');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      if (!shareDistrictId) return;
      const link = buildShareLink(shareDistrictId) + '&demo=1';
      closeShare();
      const win = window.open(link, '_blank');
      if (!win) location.href = link;
    });
  }

  // Клавиатура: цифры 1–3 выбирают ответ
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (sheet && !sheet.hidden) closeShare();
      return;
    }

    if (document.body.dataset.screen !== 'quiz') return;
    if (event.target && event.target.matches('input, textarea, select')) return;

    const map = { '1': 0, '2': 1, '3': 2 };
    if (Object.prototype.hasOwnProperty.call(map, event.key)) {
      const button = optionEls[map[event.key]];
      if (button && !button.disabled) button.click();
    }
  });

  // Экран друга
  const friendNext = $('#friend-next');
  if (friendNext) {
    friendNext.addEventListener('click', () => {
      const district = DISTRICTS.find(d => d.id === districtParam);
      if (district) showFriendDone(district, demo);
    });
  }

  const friendReturn = $('#friend-return');
  if (friendReturn) {
    friendReturn.addEventListener('click', () => {
      cleanUrl();
      // Вкладка друга могла не знать, что карта владельца уже изменилась.
      state = loadState();
      const added = consumeInbox();
      renderMap();
      showScreen('map');
      if (added.length > 0) showToast(added[0], 'friend');
      // Вкладка, открытая кнопкой «Посмотреть глазами друга», обычно закрывается.
      // Если браузер запретил закрытие — остаёмся на карте с плашкой о подарке.
      try { window.close(); } catch (e) { /* не критично */ }
    });
  }

  const friendStart = $('#friend-start');
  if (friendStart) {
    friendStart.addEventListener('click', () => {
      const district = DISTRICTS.find(d => d.id === districtParam);
      if (district && !state.solved.includes(district.id)) {
        state.solved.push(district.id);
        state.progress[district.id] = 3;
        saveState();
      }
      cleanUrl();
      renderMap();
      showScreen('map');
      if (district) showToast(district.id, 'friend');
    });
  }

  // Форма
  const form = $('#final-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  ['#field-name', '#field-phone', '#field-email'].forEach(sel => {
    const input = $(sel);
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const error = $('#form-error');
        if (error) error.hidden = true;
      });
    }
  });

  // «Подарки» от друзей: приходят из другой вкладки
  window.addEventListener('storage', event => {
    if (event.key !== CONFIG.inboxKey) return;
    state = loadState();
    const added = consumeInbox();
    if (added.length === 0) return;

    renderMap();
    updateStartButtons();

    if (document.body.dataset.screen === 'map') {
      showToast(added[0], 'friend');
    }
  });

  window.addEventListener('focus', () => {
    if (document.body.dataset.screen === 'friend') return;
    const added = consumeInbox();
    if (added.length > 0) {
      renderMap();
      updateStartButtons();
      if (document.body.dataset.screen === 'map') showToast(added[0], 'friend');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (document.body.dataset.screen === 'friend') return;
    const added = consumeInbox();
    if (added.length > 0) {
      renderMap();
      updateStartButtons();
      if (document.body.dataset.screen === 'map') showToast(added[0], 'friend');
    }
  });

  // Ветка «друг» выполняется до основной инициализации
  if (ref && districtParam) {
    initFriend(ref, districtParam, demo);
    return;
  }

  consumeInbox();
  renderMap();
  updateStartButtons();
  updateHead();

  // Восстановление после перезагрузки
  if (state.current) {
    const district = DISTRICTS.find(d => d.id === state.current);
    const progress = district ? Number(state.progress[district.id]) || 0 : 0;
    if (district && !state.solved.includes(district.id) && progress < 3) {
      startDistrict(district.id);
      return;
    }
  }

  if (state.solved.length > 0) {
    showScreen('map');
    return;
  }

  showScreen('hero');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
