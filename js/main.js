(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  var yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  var revealEls = document.querySelectorAll(
    '.section-head,.card,.audience-card,.outcome-list li,.steps li,.quote,.trust-box,.form-card,.split-media,.diff-card,.cta-band,.hero-art,.photo-hero img,.product-card'
  );
  function forceReveal() {
    revealEls.forEach(function (el) {
      el.classList.add('in', 'force-in');
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
    setTimeout(forceReveal, 2200);
  } else {
    forceReveal();
  }

  function showFieldError(field, msg) {
    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
    var err = field.parentElement && field.parentElement.querySelector('.field-error');
    if (err) {
      err.textContent = msg;
      err.classList.add('show');
    }
  }
  function clearFieldError(field) {
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
    var err = field.parentElement && field.parentElement.querySelector('.field-error');
    if (err) {
      err.textContent = '';
      err.classList.remove('show');
    }
  }


  function serializeForm(form) {
    var lines = [];
    var seen = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') {
        if (!el.checked) return;
        if (!seen[el.name]) {
          seen[el.name] = [];
          lines.push({ key: el.name, multi: true, values: seen[el.name] });
        }
        seen[el.name].push(el.value);
        return;
      }
      if (el.type === 'radio' && !el.checked) return;
      if (el.tagName === 'BUTTON') return;
      var v = (el.value || '').trim();
      if (!v) return;
      lines.push({ key: el.name, multi: false, values: [v] });
    });
    return lines
      .map(function (row) {
        return row.key + ': ' + row.values.join(', ');
      })
      .join('\n');
  }

  function showLocalSummary(summaryId, copyBtnId, text) {
    var box = document.getElementById(summaryId);
    var btn = document.getElementById(copyBtnId);
    if (box) {
      box.hidden = false;
      box.textContent = text;
    }
    if (btn) {
      btn.hidden = false;
      btn.onclick = function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              btn.textContent = 'Copied on this device';
            },
            function () {
              btn.textContent = 'Copy failed — select summary manually';
            }
          );
        } else {
          btn.textContent = 'Select the summary text to copy';
        }
      };
    }
  }

  function wireStubForm(formId, successId) {
    var form = document.getElementById(formId);
    var success = document.getElementById(successId);
    var note = form && form.querySelector('.form-note');
    if (!form) return;

    form.querySelectorAll('input, textarea, select').forEach(function (f) {
      f.addEventListener('input', function () {
        clearFieldError(f);
        if (note && note.classList.contains('err')) {
          note.textContent = 'Draft form — nothing is stored or sent by Globex yet. Submit only checks required fields and shows a preview on this page.';
          note.className = 'form-note';
        }
      });
      f.addEventListener('blur', function () {
        if (!f.hasAttribute('required')) return;
        if (f.type === 'checkbox') {
          if (!f.checked) showFieldError(f, 'Please confirm to continue.');
          return;
        }
        var v = f.value.trim();
        if (!v) showFieldError(f, 'This field is required.');
        else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v))
          showFieldError(f, 'Enter a valid email address.');
      });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (f) {
        clearFieldError(f);
        var bad = false;
        if (f.type === 'checkbox') bad = !f.checked;
        else {
          var v = f.value.trim();
          bad = !v || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v));
        }
        if (bad) {
          ok = false;
          if (!firstBad) firstBad = f;
          if (f.type === 'checkbox') showFieldError(f, 'Please confirm to continue.');
          else
            showFieldError(
              f,
              !f.value.trim() ? 'This field is required.' : 'Enter a valid email address.'
            );
        }
      });
      if (!ok) {
        if (note) {
          note.textContent = 'Please fix the highlighted fields and try again.';
          note.className = 'form-note err';
        }
        if (firstBad) firstBad.focus();
        return;
      }
      // On-page preview only — nothing stored/emailed; no mailto. Mira+SEO stub panels.
      var summary = serializeForm(form);
      form.classList.add('is-hidden');
      if (success) {
        success.classList.add('show');
        if (formId === 'rfqForm') showLocalSummary('rfqSummary', 'rfqCopySummary', summary);
        if (formId === 'joinForm') showLocalSummary('joinSummary', 'joinCopySummary', summary);
        success.focus();
      }
    });
  }

  wireStubForm('rfqForm', 'rfqSuccess');
  wireStubForm('joinForm', 'joinSuccess');
  wireStubForm('contactForm', 'contactSuccess');
})();
