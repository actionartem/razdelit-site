(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-switch');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
  function updateThemeButton() {
    const isDark = currentTheme() === 'dark';
    const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';
    themeButton.dataset.icon = isDark ? 'sun' : 'moon';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    document.querySelector('meta[name="theme-color"]').content = isDark ? '#151925' : '#fafbf8';
  }
  try {
    const saved = localStorage.getItem('razdelit-landing-theme');
    if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  } catch { /* A blocked browser storage does not prevent the theme switch. */ }
  updateThemeButton();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('razdelit-landing-theme', root.dataset.theme); } catch { /* Optional preference. */ }
    updateThemeButton();
    sendDemoTheme();
  });
  systemTheme.addEventListener('change', updateThemeButton);

  const backToTop = document.querySelector('.back-to-top');
  const headerObserver = new IntersectionObserver(([entry]) => { backToTop.hidden = entry.isIntersecting; });
  headerObserver.observe(document.querySelector('.site-header'));

  const demoFrame = document.querySelector('.guest-demo-frame');
  const scenarioButtons = [...document.querySelectorAll('[data-demo-scenario]')];
  const resetButton = document.querySelector('[data-demo-reset]');
  let demoScenario = 'items';
  function sendDemoTheme() {
    demoFrame.contentWindow?.postMessage({ type: 'razdelit-demo-theme', theme: currentTheme() }, location.origin);
  }
  function enableDemo() {
    scenarioButtons.forEach(button => { button.disabled = false; });
    resetButton.disabled = false;
    sendDemoTheme();
  }
  function startDemo(scenario) {
    demoScenario = scenario;
    scenarioButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoScenario === scenario)));
    demoFrame.contentWindow.postMessage({ type: 'razdelit-demo-scenario', scenario }, location.origin);
  }
  demoFrame.addEventListener('load', enableDemo);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === demoFrame.contentWindow && event.data?.type === 'razdelit-demo-ready') enableDemo();
  });
  scenarioButtons.forEach(button => button.addEventListener('click', () => startDemo(button.dataset.demoScenario)));
  resetButton.addEventListener('click', () => startDemo(demoScenario));
  systemTheme.addEventListener('change', sendDemoTheme);

  const supportDialog = document.querySelector('#support-dialog');
  document.querySelector('[data-open-support]').addEventListener('click', () => supportDialog.showModal());
  document.querySelector('.dialog-close').addEventListener('click', () => supportDialog.close());
  supportDialog.addEventListener('click', event => {
    const bounds = supportDialog.getBoundingClientRect();
    if (event.target === supportDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) supportDialog.close();
  });

  const contactDialog = document.querySelector('#contact-dialog');
  const contactForm = document.querySelector('#contact-form');
  const contactDraft = document.querySelector('#contact-draft');
  const requestText = document.querySelector('#request-text');
  const formStatus = contactDraft.querySelector('.form-status');
  const sendStatus = document.querySelector('#contact-send-status');
  const submitButton = contactForm.querySelector('[type="submit"]');
  let sending = false;
  let submission = null;
  function requestId() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }
  const modeButtons = [...document.querySelectorAll('[data-contact-mode]')];
  const savedContacts = { call: '', message: '' };
  let contactMode = 'call';
  document.querySelector('[data-open-contact]').addEventListener('click', () => {
    contactDialog.showModal();
    if (!contactForm.hidden) contactForm.elements.name.focus();
  });
  document.querySelector('[data-close-contact]').addEventListener('click', () => contactDialog.close());
  contactDialog.addEventListener('click', event => {
    const bounds = contactDialog.getBoundingClientRect();
    if (event.target === contactDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) contactDialog.close();
  });
  modeButtons.forEach(button => button.addEventListener('click', () => {
    savedContacts[contactMode] = contactForm.elements.contact.value;
    contactMode = button.dataset.contactMode;
    modeButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const isCall = contactMode === 'call';
    document.querySelector('#contact-field-label').textContent = isCall ? 'Телефон' : 'Email или Telegram';
    document.querySelector('#message-field-label').textContent = isCall ? 'О заведении и удобном времени' : 'Сообщение';
    contactForm.elements.contact.type = isCall ? 'tel' : 'text';
    contactForm.elements.contact.autocomplete = isCall ? 'tel' : 'off';
    contactForm.elements.contact.value = savedContacts[contactMode];
    contactForm.elements.contact.setCustomValidity('');
    contactForm.elements.message.required = !isCall;
  }));
  contactForm.elements.contact.addEventListener('input', () => contactForm.elements.contact.setCustomValidity(''));
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const contact = contactForm.elements.contact;
    if (contactMode === 'call' && (contact.value.replace(/\D/g, '').length < 10 || contact.value.replace(/\D/g, '').length > 15)) {
      contact.setCustomValidity('Укажите телефон с кодом города или страны.');
      contact.reportValidity();
      return;
    }
    const name = contactForm.elements.name.value.trim();
    const message = contactForm.elements.message.value.trim();
    if (!name || !contact.value.trim() || (contactMode === 'message' && !message)) return;
    requestText.value = [contactMode === 'call' ? 'Прошу перезвонить' : 'Сообщение для «Разделить»', 'Имя: ' + name, 'Контакт: ' + contact.value.trim(), message].filter(Boolean).join('\n\n');
    const payload = { mode: contactMode, name, contact: contact.value.trim(), message, website: contactForm.elements.website.value };
    const fingerprint = JSON.stringify(payload);
    if (!submission || submission.fingerprint !== fingerprint) submission = { fingerprint, id: requestId() };
    sending = true;
    contactForm.setAttribute('aria-busy', 'true');
    [...contactForm.elements].forEach(element => { element.disabled = true; });
    submitButton.textContent = 'Отправляем…';
    sendStatus.textContent = 'Отправляем заявку.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('https://api.simpletracker.ru/razdelit/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: submission.id }), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (response.status === 429) throw new Error('Слишком много попыток. Попробуйте через 10 минут.');
        if (result.error === 'unconfirmed') throw new Error('Не удалось подтвердить доставку. Заявка могла прийти — свяжитесь автору в Telegram по ссылке ниже.');
        throw new Error('Не удалось отправить заявку. Данные сохранены: попробуйте ещё раз или свяжитесь автору в Telegram по ссылке ниже.');
      }
      contactForm.hidden = true;
      contactDraft.hidden = false;
      sendStatus.textContent = '';
      formStatus.textContent = 'Спасибо! Свяжемся с вами по указанному контакту.';
      document.querySelector('[data-copy-request]').focus();
    } catch (error) {
      sendStatus.textContent = error.name === 'AbortError' || error instanceof TypeError
        ? 'Не удалось подтвердить доставку. Данные сохранены. Попробуйте снова или свяжитесь автору в Telegram по ссылке ниже.'
        : error.message;
    } finally {
      clearTimeout(timeout);
      sending = false;
      contactForm.removeAttribute('aria-busy');
      [...contactForm.elements].forEach(element => { element.disabled = false; });
      submitButton.textContent = 'Отправить заявку';
    }
  });
  document.querySelector('[data-edit-request]').addEventListener('click', () => {
    contactForm.reset();
    submission = null;
    savedContacts.call = savedContacts.message = '';
    sendStatus.textContent = '';
    contactDraft.hidden = true;
    contactForm.hidden = false;
    contactForm.elements.name.focus();
  });
  document.querySelector('[data-copy-request]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(requestText.value);
      formStatus.textContent = 'Текст отправленной заявки скопирован.';
    } catch {
      requestText.focus();
      requestText.select();
      formStatus.textContent = 'Скопируйте выделенный текст.';
    }
  });
})();
