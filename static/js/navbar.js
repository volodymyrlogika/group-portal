const settingsMenu = document.querySelector('.settings-menu');
const settingsContent = document.querySelector('.settings-content');
const closeBtn = document.querySelector('.close-settings');


function openSettings() {
    settingsMenu.classList.add('enabled');
}

function closeSettings() {
    settingsMenu.classList.remove('enabled');
}

closeBtn.addEventListener('click', closeSettings);

settingsMenu.addEventListener('click', (e) => {
    if (!settingsContent.contains(e.target)) {
        closeSettings();
    }
});


// Ініціалізація
document.querySelectorAll('.profile-dropdown').forEach(button => {
  // знайти цільове меню: по data-target або nextElementSibling fallback
  const targetSelector = button.getAttribute('data-target');
  const menu = targetSelector ? document.querySelector(targetSelector) : button.nextElementSibling;

  if (!menu) {
    console.warn('No menu found for button', button);
    return;
  }

  // стан відкриття
  let isOpen = false;
  let animating = false;

  // Глушимо спроби відкривати/закривати під час анімації
  function open() {
    if (animating || isOpen) return;
    menu.classList.remove('hide');
    menu.style.display = 'block';
    // Примусити reflow щоб браузер зафіксував display:block
    void menu.offsetWidth;
    menu.classList.add('show');
    menu.setAttribute('aria-hidden', 'false');
    isOpen = true;
  }

  function close() {
    if (animating || !isOpen) return;
    menu.classList.remove('show');
    menu.classList.add('hide'); // запускає reverse animation
    menu.setAttribute('aria-hidden', 'true');
    // не ставимо display:none тут — дочекаємось animationend
    isOpen = false;
  }

  // Події анімації (один раз підписуємося)
  if (!menu._hasAnimationHandlers) {
    menu.addEventListener('animationstart', () => { animating = true; });
    menu.addEventListener('animationend', () => {
      animating = false;
      // якщо після анімації лишився hide — приховуємо остаточно
      if (menu.classList.contains('hide')) {
        menu.style.display = 'none';
        menu.classList.remove('hide');
      } else {
        // переконуємось, що show лишається; нічого не міняємо
      }
    });
    menu._hasAnimationHandlers = true; // маркер, щоб не додавати повторно
  }

  // Клік по кнопці — переключаємо
  button.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (isOpen) close();
    else {
      // перед відкриттям закриваємо інші меню на сторінці (опціонально)
      closeAllExcept(menu);
      open();
    }
  });
});

// Закриття при кліку поза меню (закриває всі)
document.addEventListener('click', (e) => {
  // закриваємо всі відкриті меню
  document.querySelectorAll('.profile-dropdown-menu.show, .profile-dropdown-menu.hide').forEach(menu => {
    // якщо клік всередині меню — пропускаємо
    if (menu.contains(e.target)) return;
    // тригер reverse, якщо зараз show
    if (menu.classList.contains('show')) {
      menu.classList.remove('show');
      menu.classList.add('hide');
    }
  });
});

// Допоміжна функція: закрити всі, крім переданого меню
function closeAllExcept(exceptMenu) {
  document.querySelectorAll('.profile-dropdown-menu').forEach(menu => {
    if (menu === exceptMenu) return;
    if (menu.classList.contains('show')) {
      menu.classList.remove('show');
      menu.classList.add('hide');
    }
  });
}
