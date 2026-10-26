document.addEventListener('DOMContentLoaded', () => {
  // 1. Automatically make the solid black background of Document.jpg transparent
  //    if a JPG with a black background is loaded on a local server.
  const heroImg = document.getElementById('hero-portrait-img');
  if (heroImg) {
    const stripBlackBg = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = heroImg.naturalWidth;
        const h = heroImg.naturalHeight;
        if (!w || !h) return;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(heroImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        if (data[3] === 0) return;
        const visited = new Uint8Array(w * h);
        const stack = [0, w - 1];

        while (stack.length > 0) {
          const idx = stack.pop();
          if (visited[idx]) continue;
          visited[idx] = 1;

          const p = idx * 4;
          if (data[p] < 18 && data[p + 1] < 18 && data[p + 2] < 18) {
            data[p + 3] = 0;
            const x = idx % w;
            const y = (idx / w) | 0;
            if (x > 0) stack.push(idx - 1);
            if (x < w - 1) stack.push(idx + 1);
            if (y > 0) stack.push(idx - w);
            if (y < h - 1) stack.push(idx + w);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        heroImg.src = canvas.toDataURL('image/png');
      } catch (err) {
        // Skips gracefully if opened via file:// protocol
      }
    };

    if (heroImg.complete) {
      stripBlackBg();
    } else {
      heroImg.addEventListener('load', stripBlackBg, { once: true });
    }
  }

  // 2. On touch/phone viewports, only toggle skill card description on explicit tap
  const skillCards = document.querySelectorAll('.skill-card');
  skillCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
        const wasOpen = card.classList.contains('is-tapped');
        skillCards.forEach((c) => c.classList.remove('is-tapped'));
        if (!wasOpen) {
          card.classList.add('is-tapped');
        }
      }
    });
  });

  // 3. Navigation & Anchor Clicks Land in the Middle of the Screen
  const internalLinks = document.querySelectorAll(
    '.floating-nav a[href^="#"], .footer-nav a[href^="#"], .btn-lime[href^="#"]'
  );

  internalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#' || targetId === '#blog-coming-soon') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      link.blur();

      if (targetId === '#hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const elementTop = window.scrollY + rect.top;
      const centeredTop = elementTop - (window.innerHeight / 2) + (rect.height / 2);

      window.scrollTo({
        top: Math.max(0, centeredTop),
        behavior: 'smooth',
      });
    });
  });

  // 4. Accordion Toggle ("What I worked on")
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('is-open');
      item.classList.toggle('is-open', !isOpen);
      header.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // 5. Scroll-linked animations & Center-Screen Active Section Detection
  const blogArrow = document.getElementById('blog-scroll-arrow');
  const wipSection = document.getElementById('working-on');
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const navLinks = document.querySelectorAll('.floating-nav .nav-item:not(.nav-logo)');
  const sections = document.querySelectorAll('header[id], section[id]');

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - windowHeight);
    const pageProgress = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Blog arrow glides from -140px to 0px and locks flush right when visible
    if (blogArrow && wipSection) {
      const rect = wipSection.getBoundingClientRect();
      const arrivalProgress = Math.min(
        1,
        Math.max(0, (windowHeight - rect.top) / (windowHeight * 0.45))
      );
      const shiftX = -140 * (1 - arrivalProgress);
      blogArrow.style.transform = `translate3d(${shiftX.toFixed(1)}px, 0, 0)`;
    }

    // Back-to-top button rises from bottom (60px -> 0px) as user reaches the bottom
    if (scrollTopBtn) {
      const bottomProgress = Math.min(1, Math.max(0, (pageProgress - 0.65) / 0.35));
      const translateY = (1 - bottomProgress) * 60;
      scrollTopBtn.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
      scrollTopBtn.style.opacity = (0.25 + bottomProgress * 0.75).toFixed(2);
    }

    // Highlight the section closest to the middle of the screen
    const viewportCenter = windowHeight / 2;
    let currentSectionId = 'hero';
    let minDistance = Infinity;

    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        currentSectionId = sec.getAttribute('id');
      }
    });

    if (scrollY < 80) {
      currentSectionId = 'hero';
    }

    navLinks.forEach((link) => {
      const target = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', target === currentSectionId);
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll);
  handleScroll();

  // 6. Back-to-top click handler
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 7. Prototype Contact Form handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sent!';
      setTimeout(() => {
        submitBtn.textContent = originalText;
        contactForm.reset();
      }, 2000);
    });
  }
});