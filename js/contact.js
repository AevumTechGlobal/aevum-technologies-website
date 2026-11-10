import './site.js';

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const serviceSelect = document.querySelector('select[name="service"]');
const serviceValues = new Set(['cybersecurity', 'software-development', 'cloud-solutions', 'ai-automation', 'data-analytics', 'education-mentorship', 'security-consulting-advisory']);

function showFieldError(inputName, message) {
  const error = document.getElementById(`${inputName}-error`);
  if (error) error.textContent = message;
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
    if (target.name === 'message') showFieldError('message', '');
    if (target.name === 'acknowledge') showFieldError('acknowledge', '');
    if (target.name === 'service') {
      validateSelectedServices();
    }

    status.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const phone = form.elements.namedItem('phone');
    const service = form.elements.namedItem('service');
    const message = form.elements.namedItem('message');
    const acknowledge = form.elements.namedItem('acknowledge');
    const honeypot = form.elements.namedItem('website');

    if (!(name instanceof HTMLInputElement)
      || !(email instanceof HTMLInputElement)
      || !(service instanceof HTMLSelectElement)
      || !(message instanceof HTMLTextAreaElement)
      || !(acknowledge instanceof HTMLInputElement)
      || !(honeypot instanceof HTMLInputElement)) {
      status.textContent = 'The form could not be initialised. Please reload the page and try again.';
      return;
    }

    const nameValue = name.value.trim();
    const emailValue = email.value.trim();
    const messageValue = message.value.trim();
    const phoneValue = phone instanceof HTMLInputElement ? phone.value.trim() : '';

    name.setCustomValidity(nameValue.length < 2 ? 'Please enter your full name.' : '');
    email.setCustomValidity(emailValue && email.checkValidity() ? '' : 'Please enter a valid email address.');
    service.setCustomValidity(service.value ? '' : 'Please select a service.');
    message.setCustomValidity(messageValue.length < 10 ? 'Please enter at least ten characters.' : '');
    acknowledge.setCustomValidity(acknowledge.checked ? '' : 'Please confirm that you agree to the Privacy Policy and Terms of Use.');

    showFieldError('name', name.validationMessage);
    showFieldError('email', email.validationMessage);
    showFieldError('service', service.validationMessage);
    showFieldError('message', message.validationMessage);
    showFieldError('acknowledge', acknowledge.validationMessage);

    const valid = name.checkValidity() && email.checkValidity() && service.checkValidity() && message.checkValidity() && acknowledge.checkValidity() && validateSelectedServices();

    if (!valid) {
      status.textContent = 'Please review the highlighted fields and complete the required information.';
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    if (honeypot.value.trim()) {
      status.textContent = 'This enquiry could not be validated. No message was sent.';
      return;
    }

    const formattedPhone = phoneValue ? ` Phone: ${phoneValue}` : '';
    status.textContent = `Your enquiry is ready to be sent, but no secure delivery endpoint is configured yet. Please contact Aevum directly by email or telephone to complete this request. Email: aveumtechnologies@gmail.com. Phone: +234 807 991 2429.${formattedPhone}`;
  });
}

initialiseContactForm();
