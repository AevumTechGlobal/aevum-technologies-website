const profilePlaceholder = '/images/team-profile-placeholder.svg';

export const TEAM_IMAGE_PATHS = Object.freeze({
  founder: '/images/WhatsApp Image 2026-11-10 at 4.09.44 PM.jpeg',
  member01: '/images/WhatsApp Image 2026-11-10 at 4.13.01 PM (1).jpeg',
  member02: '/images/WhatsApp Image 2026-11-06 at 1.54.38 PM.jpeg',
  member03: '/images/WhatsApp Image 2026-11-06 at 6.24.34 PM.jpeg',
  member04: '/images/WhatsApp Image 2026-11-06 at 7.05.08 PM.jpeg',
  member05: '/images/WhatsApp Image 2026-11-06 at 7.12.14 PM.jpeg',
  member06: '/images/WhatsApp Image 2026-11-06 at 12.42.42 PM.jpeg',
  member07: '/images/WhatsApp Image 2026-11-10 at 4.12.46 PM.jpeg',
  member08: '/images/WhatsApp Image 2026-11-07 at 2.44.05 PM.jpeg',
});

const teamMembers = [
  {
    name: 'Joseph Sunday',
    position: 'Sociology | Deal Sourcing | Client Relations & Administrative Support',
    skills: [
      'Sociology',
      'Deal Sourcing',
      'Client Relations',
      'Administrative Support',
      'Business Relationships',
    ],
  },
  {
    name: 'Joshua Bumojo Atabo',
    position: 'Computer Scientist | AI Engineer | Systems & Automation Enthusiast',
    skills: [
      'AI Engineering',
      'Low-Level Programming',
      'Python',
      'HTML & CSS',
      'Game Assistance Systems',
      'Prompt Engineering',
      'Agentic AI Workflows',
    ],
  },
  {
    name: 'Mercy Unekwuojo Edibo',
    position: 'Accounting | Finance Management | Operations & Administration',
    skills: [
      'Accounting',
      'Financial Management',
      'Operations Management',
      'Administration',
      'Logistics & Coordination',
    ],
  },
  {
    name: 'Olayiwola Salawu',
    position: 'Computer Scientist | Systems Architect | Backend Engineer',
    skills: [
      'Systems Architecture',
      'Backend Engineering',
      'Go',
      'Python',
      'Software Engineering',
      'Backend Systems Design',
    ],
  },
  {
    name: 'Ositadinma Divine A.',
    position: 'Full-Stack Developer | Agentic Builder | AI Enthusiast',
    skills: [
      'Full-Stack Development',
      'Rust, Go & Python',
      'Docker',
      'PostgreSQL & Redis',
      'Firebase',
      'Flutter',
      'Agentic Development',
      'Artificial Intelligence',
    ],
  },
  {
    name: 'Stephen Joshua',
    position: 'Computer Scientist | Technology & Creative Media Enthusiast',
    skills: [
      'Computer Science',
      'Software Development',
      'Cybersecurity',
      'Graphic Design',
      'Video Editing',
      'Digital Creativity',
      'Emerging Technologies',
    ],
  },
  {
    name: 'Joshua Sunday',
    position: 'Frontend Developer | UI/UX Designer | Digital Creative',
    skills: [
      'Frontend Development',
      'UI/UX Design',
      'Graphic Design',
      'Figma',
      'UI Prototyping',
      'Basic Networking',
      'Cybersecurity Support',
    ],
  },
  {
    name: 'Olaitan Toluwanimi Michael',
    position: 'JavaScript Developer | Agentic Programmer | Digital Strategist',
    skills: [
      'JavaScript',
      'React',
      'Prompt Engineering',
      'Agentic Programming',
      'AI-Assisted Development',
      'Public Speaking',
      'Sales & Business Strategy',
      'YouTube Management',
    ],
  },
].map((member, index) => {
  const memberNumber = String(index + 1).padStart(2, '0');
  return {
    ...member,
    photo: TEAM_IMAGE_PATHS[`member${memberNumber}`] || profilePlaceholder,
  };
});

function createTeamCard(member, index) {
  const card = document.createElement('article');
  card.className = 'team-card';

  const photoFrame = document.createElement('div');
  photoFrame.className = 'team-photo-frame';
  const photo = document.createElement('img');
  photo.src = member.photo;
  photo.alt = `Portrait of ${member.name}`;
  photo.loading = 'lazy';
  photo.width = 480;
  photo.height = 520;
  photoFrame.append(photo);

  const body = document.createElement('div');
  body.className = 'team-card-body';
  const number = document.createElement('span');
  number.className = 'team-card-number';
  number.textContent = String(index + 1).padStart(2, '0');
  const name = document.createElement('h3');
  name.textContent = member.name;
  const position = document.createElement('p');
  position.className = 'team-position';
  position.textContent = member.position;
  const skills = document.createElement('ul');
  skills.className = 'team-skills';
  for (const skill of member.skills.slice(0, 4)) {
    const tag = document.createElement('li');
    tag.textContent = skill;
    skills.append(tag);
  }

  const details = document.createElement('details');
  details.className = 'team-profile-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Full areas of expertise';
  const fullSkills = document.createElement('ul');
  fullSkills.className = 'team-skills team-skills-full';
  for (const skill of member.skills) {
    const tag = document.createElement('li');
    tag.textContent = skill;
    fullSkills.append(tag);
  }
  details.append(summary, fullSkills);

  body.append(number, name, position, skills, details);
  card.append(photoFrame, body);
  return card;
}

export function renderTeamProfiles(container) {
  const founderPhoto = document.querySelector('.founder-profile-image');
  if (founderPhoto instanceof HTMLImageElement) {
    founderPhoto.alt = 'Portrait of the Aevum founder';
    if (TEAM_IMAGE_PATHS.founder) founderPhoto.src = TEAM_IMAGE_PATHS.founder;
  }
  if (!(container instanceof HTMLElement)) return;

  const fragment = document.createDocumentFragment();
  teamMembers.forEach((member, index) => fragment.append(createTeamCard(member, index)));
  container.replaceChildren(fragment);
}
