(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-switch');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
  function updateThemeButton() {
    const isDark = currentTheme() === 'dark';
    themeButton.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    themeButton.setAttribute('aria-label', isDark ? 'Светлая тема: включить' : 'Тёмная тема: включить');
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
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
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
    contactForm.hidden = true;
    contactDraft.hidden = false;
    formStatus.textContent = 'Отправка ещё не подключена.';
    document.querySelector('[data-copy-request]').focus();
  });
  document.querySelector('[data-edit-request]').addEventListener('click', () => {
    contactDraft.hidden = true;
    contactForm.hidden = false;
    contactForm.elements.name.focus();
  });
  document.querySelector('[data-copy-request]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(requestText.value);
      formStatus.textContent = 'Заявка скопирована. Отправка ещё не подключена.';
    } catch {
      requestText.focus();
      requestText.select();
      formStatus.textContent = 'Скопируйте выделенный текст. Отправка ещё не подключена.';
    }
  });
})();
