(() => {
  'use strict';

  const CONTACT_EMAIL = '';
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('#site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      siteNav.classList.toggle('is-open', !isOpen);
    });

    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation');
        siteNav.classList.remove('is-open');
      });
    });
  }

  const filterButtons = document.querySelectorAll('.filter-button');
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      portfolioCards.forEach(card => {
        const categories = card.dataset.category.split(' ');
        card.hidden = filter !== 'all' && !categories.includes(filter);
      });
    });
  });

  const projectDetails = {
    thriller: {
      title: 'The Hollow Hour',
      genre: 'Mystery · Cinematic concept · Promotional graphics',
      objective: 'Create a suspenseful visual direction for an imagined mystery story without revealing its central secret.',
      approach: 'A restrained palette, directional light, and fragmented landscape suggest tension while keeping the fictional book concept at the center.',
      deliverables: ['Original concept cover artwork', 'Trailer storyboard direction', 'Sample social graphic']
    },
    romance: {
      title: 'A Summer in Bloom',
      genre: 'Contemporary romance · Social concept',
      objective: 'Introduce an imagined summer romance through warm, intimate campaign visuals.',
      approach: 'Golden-hour tones and elegant typography make the concept feel tender and inviting without relying on stock character imagery.',
      deliverables: ['Original concept cover artwork', 'Sample social post direction', 'Launch announcement concept']
    },
    fantasy: {
      title: 'The Ember Atlas',
      genre: 'Fantasy adventure · Cinematic concept',
      objective: 'Suggest a richly imagined world for a fictional fantasy title.',
      approach: 'A map-inspired composition, atmospheric light, and layered mountain silhouettes hint at exploration and myth.',
      deliverables: ['Original concept cover artwork', 'Trailer moodboard direction', 'Promotional graphic concept']
    },
    editorial: {
      title: 'The Reading Room',
      genre: 'Editorial · Author spotlight concept',
      objective: "Show how an editorial-style feature could introduce an author's inspiration and book themes.",
      approach: 'An editorial page layout prioritizes a clear headline, a thoughtful reading experience, and space for an author-approved call to action.',
      deliverables: ['Article layout concept', 'Sample headline and structure', 'Book-link placement example']
    },
    memoir: {
      title: 'Notes from the Open Road',
      genre: 'Memoir · Author branding concept',
      objective: 'Present a fictional personal-growth memoir with a reflective, open visual identity.',
      approach: 'Natural textures, spacious typography, and a warm, grounded palette suggest an honest personal narrative.',
      deliverables: ['Original concept cover artwork', 'Author spotlight direction', 'Sample social content concept']
    },
    children: {
      title: 'The Little Lantern',
      genre: "Children's fiction · Editorial and graphics concept",
      objective: "Create a friendly visual starting point for an imagined children's story.",
      approach: 'Soft color, simple shapes, and warm light keep the concept playful and age-aware.',
      deliverables: ['Original concept cover artwork', 'Book spotlight direction', 'Sample launch graphic']
    }
  };

  const projectDialog = document.querySelector('#project-dialog');
  const dialogTitle = document.querySelector('#dialog-title');
  const dialogGenre = document.querySelector('.dialog-genre');
  const dialogBody = document.querySelector('.dialog-body');

  function openProject(key) {
    const project = projectDetails[key];
    if (!project || !projectDialog || !dialogTitle || !dialogGenre || !dialogBody) return;
    dialogTitle.textContent = project.title;
    dialogGenre.textContent = project.genre;
    dialogBody.replaceChildren();
    const objective = document.createElement('p');
    objective.textContent = project.objective;
    const approach = document.createElement('p');
    approach.textContent = project.approach;
    const heading = document.createElement('strong');
    heading.textContent = 'Sample deliverables';
    const list = document.createElement('ul');
    project.deliverables.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      list.append(listItem);
    });
    dialogBody.append(objective, approach, heading, list);
    projectDialog.showModal();
  }

  document.querySelectorAll('[data-project]').forEach(trigger => {
    trigger.addEventListener('click', () => openProject(trigger.dataset.project));
  });

  const closeDialog = document.querySelector('.dialog-close');
  if (projectDialog && closeDialog) {
    closeDialog.addEventListener('click', () => projectDialog.close());
    projectDialog.addEventListener('click', event => {
      if (event.target === projectDialog) projectDialog.close();
    });
    projectDialog.querySelector('.dialog-cta').addEventListener('click', () => projectDialog.close());
  }

  document.querySelectorAll('[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      const form = document.querySelector('#inquiry-form');
      const matchingOption = form && Array.from(form.querySelectorAll('[name="services"]')).find(option => option.value === link.dataset.service);
      if (matchingOption) matchingOption.checked = true;
    });
  });
  document.querySelectorAll('[data-package]').forEach(link => {
    link.addEventListener('click', () => {
      const form = document.querySelector('#inquiry-form');
      const additional = form && form.elements.namedItem('additional');
      if (additional) additional.value = `Package of interest: ${link.dataset.package}`;
    });
  });

  const form = document.querySelector('#inquiry-form');
  const formStatus = document.querySelector('#form-status');
  if (form && formStatus) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      formStatus.className = 'form-status';
      formStatus.textContent = '';
      form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));

      if (!form.reportValidity()) {
        const invalid = form.querySelector(':invalid');
        if (invalid) invalid.setAttribute('aria-invalid', 'true');
        formStatus.classList.add('is-error');
        formStatus.textContent = 'Please complete the required fields and check the permission confirmation.';
        if (invalid) invalid.focus();
        return;
      }

      if (!CONTACT_EMAIL) {
        formStatus.classList.add('is-error');
        formStatus.textContent = 'The inquiry is valid, but no business email is configured yet. Set CONTACT_EMAIL in script.js to enable email submission.';
        return;
      }

      const data = new FormData(form);
      const services = data.getAll('services');
      const fields = [
        ['Author name', data.get('authorName')],
        ['Email', data.get('email')],
        ['Book title', data.get('bookTitle')],
        ['Genre', data.get('genre')],
        ['Description', data.get('description')],
        ['Book cover URL', data.get('coverUrl')],
        ['Book page URL', data.get('bookUrl')],
        ['Author website or social profile', data.get('authorUrl')],
        ['Services requested', services.length ? services.join(', ') : 'Not specified'],
        ['Target audience', data.get('audience')],
        ['Preferred timeline', data.get('timeline')],
        ['Estimated budget', data.get('budget')],
        ['Additional information', data.get('additional')]
      ];
      const body = fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`).join('\n');
      const subject = `Book promotion inquiry: ${data.get('bookTitle')}`;
      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      formStatus.classList.add('is-success');
      formStatus.textContent = 'Your email app should open with your inquiry. Please send the message there to complete submission.';
    });
  }

  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
