import './site.js';

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const serviceSelect = document.querySelector('select[name="service"]');
const serviceValues = new Set(['cybersecurity', 'software-development', 'cloud-solutions', 'ai-automation', 'data-analytics', 'education-mentorship', 'security-consulting-advisory']);
const turnstileContainer = document.querySelector('#turnstile-widget');
let turnstileWidgetId;
let turnstileToken = '';
let isSending = false;

function showFieldError(inputName, message) {
  const error = document.getElementById(`${inputName}-error`);
  if (error) error.textContent = message;

  if (form instanceof HTMLFormElement) {
    const control = form.elements.namedItem(inputName);
    if (control instanceof HTMLElement) {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    }
  }
}

function setStatus(message) {
  if (status instanceof HTMLElement) status.textContent = message;
}

function setSubmitAvailability() {
  if (!(form instanceof HTMLFormElement)) return;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = isSending || !turnstileToken;
  }
}

function setServiceSelection(value) {
  if (!(serviceSelect instanceof HTMLSelectElement)) return;
  serviceSelect.value = serviceValues.has(value) ? value : '';
}

function validateSelectedServices() {
  if (!(serviceSelect instanceof HTMLSelectElement)) {
    showFieldError('service', 'Please select a service.');
    return false;
  }

  if (!serviceSelect.value) {
    showFieldError('service', 'Please select a service.');
    return false;
  }

  showFieldError('service', '');
  return true;
}

function resetTurnstile() {
  turnstileToken = '';
  if (turnstileWidgetId !== undefined && globalThis.turnstile) {
    globalThis.turnstile.reset(turnstileWidgetId);
  }
  setSubmitAvailability();
}

async function loadTurnstile() {
  if (!(turnstileContainer instanceof HTMLElement)) return;

  try {
    const configResponse = await fetch('/api/contact', {
      headers: { Accept: 'application/json' },
    });
    const config = await configResponse.json().catch(() => null);
    if (!configResponse.ok || !config || typeof config.siteKey !== 'string') {
      throw new Error('Secure verification is not configured.');
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstileApi = 'true';
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });

    const turnstile = globalThis.turnstile;
    if (!turnstile) throw new Error('Secure verification could not be loaded.');

    turnstileWidgetId = turnstile.render(turnstileContainer, {
      sitekey: config.siteKey,
      action: 'contact',
      size: 'compact',
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
      callback: (token) => {
        turnstileToken = token;
        setSubmitAvailability();
      },
      'expired-callback': () => {
        turnstileToken = '';
        setStatus('Security verification expired. Please complete it again.');
        setSubmitAvailability();
      },
      'error-callback': () => {
        turnstileToken = '';
        setStatus('Security verification could not be completed. Please try again.');
        setSubmitAvailability();
      },
    });
  } catch {
    setStatus('Secure verification is unavailable. Please reload the page or contact us directly by email or phone.');
  }
}

function initialiseContactForm() {
  if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;

  const parameters = new URLSearchParams(window.location.search);
  const queryService = parameters.get('service');
  const interest = parameters.get('interest');

  if (queryService) {
    const requested = queryService.split(',').map((value) => value.trim().toLowerCase());
    const selectedService = requested.find((value) => serviceValues.has(value));
    if (selectedService) setServiceSelection(selectedService);
  }

  if (interest === 'career') setServiceSelection('');

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement) && !(target instanceof HTMLSelectElement)) return;

    if (target.name === 'name') showFieldError('name', '');
    if (target.name === 'email') showFieldError('email', '');
    if (target.name === 'phone') showFieldError('phone', '');
    if (target.name === 'message') showFieldError('message', '');
    if (target.name === 'acknowledge') showFieldError('acknowledge', '');
    if (target.name === 'service') validateSelectedServices();

    if (!isSending) setStatus('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSending) return;

    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const phone = form.elements.namedItem('phone');
    const service = form.elements.namedItem('service');
    const message = form.elements.namedItem('message');
    const acknowledge = form.elements.namedItem('acknowledge');
    const honeypot = form.elements.namedItem('website');

    if (!(name instanceof HTMLInputElement)
      || !(email instanceof HTMLInputElement)
      || !(phone instanceof HTMLInputElement)
      || !(service instanceof HTMLSelectElement)
      || !(message instanceof HTMLTextAreaElement)
      || !(acknowledge instanceof HTMLInputElement)
      || !(honeypot instanceof HTMLInputElement)) {
      setStatus('The form could not be initialised. Please reload the page and try again.');
      return;
    }

    const nameValue = name.value.trim();
    const emailValue = email.value.trim();
    const phoneValue = phone.value.trim();
    const messageValue = message.value.trim();

    name.setCustomValidity(nameValue.length < 2 ? 'Please enter your full name.' : '');
    email.setCustomValidity(emailValue && email.checkValidity() ? '' : 'Please enter a valid email address.');
    phone.setCustomValidity(phoneValue && (phoneValue.length < 7 || phoneValue.length > 30 || !/^\+?[0-9][0-9\s().-]{5,28}$/.test(phoneValue)) ? 'Please enter a valid phone number, or leave it blank.' : '');
    service.setCustomValidity(service.value ? '' : 'Please select a service.');
    message.setCustomValidity(messageValue.length < 10 ? 'Please enter at least ten characters.' : '');
    acknowledge.setCustomValidity(acknowledge.checked ? '' : 'Please confirm that you agree to the Privacy Policy and Terms of Use.');

    showFieldError('name', name.validationMessage);
    showFieldError('email', email.validationMessage);
    showFieldError('phone', phone.validationMessage);
    showFieldError('service', service.validationMessage);
    showFieldError('message', message.validationMessage);
    showFieldError('acknowledge', acknowledge.validationMessage);

    const valid = name.checkValidity()
      && email.checkValidity()
      && phone.checkValidity()
      && service.checkValidity()
      && message.checkValidity()
      && acknowledge.checkValidity()
      && validateSelectedServices();

    if (!valid) {
      setStatus('Please review the highlighted fields and complete the required information.');
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    if (honeypot.value.trim()) {
      setStatus('This enquiry could not be validated. No message was sent.');
      return;
    }

    if (!turnstileToken) {
      setStatus('Please complete the security verification before sending your enquiry.');
      return;
    }

    isSending = true;
    setSubmitAvailability();
    setStatus('Sending your enquiry...');
    let submitted = false;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameValue,
          email: emailValue,
          phone: phoneValue,
          service: service.value,
          message: messageValue,
          acknowledge: acknowledge.checked,
          website: honeypot.value,
          turnstileToken,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(result && typeof result.error === 'string'
          ? result.error
          : 'We could not submit your enquiry right now. Please try again later.');
        return;
      }

      submitted = true;
      form.reset();
      showFieldError('name', '');
      showFieldError('email', '');
      showFieldError('phone', '');
      showFieldError('service', '');
      showFieldError('message', '');
      showFieldError('acknowledge', '');
      setStatus('Thank you. Your enquiry has been submitted.');
    } catch {
      setStatus('We could not connect to the enquiry service. Please try again later or contact us directly.');
    } finally {
      isSending = false;
      resetTurnstile();
      setSubmitAvailability();
      if (submitted) setStatus('Thank you. Your enquiry has been submitted.');
    }
  });

  void loadTurnstile();
}

initialiseContactForm();
