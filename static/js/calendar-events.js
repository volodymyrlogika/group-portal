// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
    initOrbConnectors();
});

window.addEventListener('resize', throttle(updateOrbConnectors, 100));

function initOrbConnectors() {
    const container = document.querySelector('.grid3');
    if (!container) return;
    container.addEventListener('scroll', throttle(updateOrbConnectors, 50));
    updateOrbConnectors();
    const mo = new MutationObserver(throttle(updateOrbConnectors, 120));
    mo.observe(container, { childList: true, subtree: true });
}

function updateOrbConnectors() {
    const container = document.querySelector('.grid3');
    const calendar = container?.querySelector('.calendar-main-container') || container;
    if (!container || !calendar) return;

    // видалити старі коннектори
    container.querySelectorAll('.orb-connector').forEach(n => n.remove());

    // очистити всі .frame-reverse — керуємо класом зі скрипта
    calendar.querySelectorAll('.event-frame').forEach(el => el.classList.remove('frame-reverse'));

    // зібрати всі event-frame та їх орби
    const frames = Array.from(calendar.querySelectorAll('.event-frame')).map(f => {
        const orb = f.querySelector('.orb');
        return { el: f, orb };
    }).filter(x => x.orb && x.el);

    if (frames.length === 0) return;

    // --- 1) визначити, кому треба додати .frame-reverse (використовуємо початкові позиції) ---
    const initialPositions = frames.map(f => {
        const orbRect = f.orb.getBoundingClientRect();
        return {
            el: f.el,
            orb: f.orb,
            x: orbRect.left + orbRect.width / 2,
            y: orbRect.top + orbRect.height / 2,
            rawId: f.el.id || null,
            idNumMatch: (f.el.id || '').match(/(\d+)$/),
            idNum: (f.el.id || '').match(/(\d+)$/) ? (f.el.id.match(/(\d+)$/)[1]) : null,
            kind: (f.el.id || '').startsWith('start-') ? 'start' : (f.el.id || '').startsWith('end-') ? 'end' : null
        };
    });

    // правило frame-reverse для послідовних елементів у тій самій "колонці"
    const byColInit = groupBy(initialPositions, c => Math.round(c.x / 5));
    Object.values(byColInit).forEach(col => {
        col.sort((a, b) => a.y - b.y);
        for (let i = 0; i < col.length - 1; i++) {
            const upper = col[i], lower = col[i + 1];
            const dy = lower.y - upper.y;
            // поріг для "послідовності" — підганяй за потреби
            // Не ставимо реверс для end-блоків тут (щоб "End: Therapy" лишався нормальним),
            // реверс для end буде синхронізовано з start нижче, якщо потрібно.
            if (dy > 60 && dy < 120 && upper.idNum !== lower.idNum && lower.kind !== 'end') {
                lower.el.classList.add('frame-reverse');
            }
        }
    });

    // --- 2) ПОВТОРНО зчитати позиції орбів після можливих змін layout (frame-reverse впливає на позицію) ---
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    const centers = frames.map(f => {
        const orbRect = f.orb.getBoundingClientRect();
        // позиції відносно контейнера з урахуванням скролу
        const cx = orbRect.left - containerRect.left + orbRect.width / 2 + scrollLeft;
        const cy = orbRect.top - containerRect.top + orbRect.height / 2 + scrollTop;
        const topY = orbRect.top - containerRect.top + scrollTop;
        const bottomY = orbRect.bottom - containerRect.top + scrollTop;
        const rawId = f.el.id || null;
        const idNumMatch = rawId ? rawId.match(/(\d+)$/) : null;
        const idNum = idNumMatch ? idNumMatch[1] : null;
        const kind = rawId?.startsWith('start-') ? 'start' : rawId?.startsWith('end-') ? 'end' : null;
        return { el: f.el, orb: f.orb, x: cx, y: cy, topY, bottomY, rawId, idNum, kind, orbRect };
    });

    // 3) створити коннектори між парними start-<n> та end-<n>
    const byNum = groupBy(centers.filter(c => c.idNum), c => c.idNum);
    Object.values(byNum).forEach(group => {
        // відокремити старти і енд-и
        const starts = group.filter(g => g.kind === 'start').sort((a, b) => a.y - b.y);
        const ends = group.filter(g => g.kind === 'end').sort((a, b) => a.y - b.y);

        // для кожного end знайдемо найближчий start зверху (якщо є)
        ends.forEach(end => {
            let start = starts.slice().reverse().find(s => s.y < end.y) || starts[0];
            if (!start) return;

            // синхронізувати .frame-reverse: якщо старт реверсний — енд також, і навпаки
            if (start.el.classList.contains('frame-reverse')) end.el.classList.add('frame-reverse');
            else end.el.classList.remove('frame-reverse');

            // РЕАЛЬНІ координати для початку/кінця конектора:
            // якщо елемент має .frame-reverse, orbRect.left/right зміститься в DOM,
            // тому беремо фактичні orbRect для обчислення "сторони".
            const startAnchor = getOrbAnchorCoords(start, 'bottom', containerRect, scrollTop, scrollLeft);
            const endAnchor = getOrbAnchorCoords(end, 'top', containerRect, scrollTop, scrollLeft);

            createConnectorCoords(container, startAnchor.x, startAnchor.y, endAnchor.x, endAnchor.y, getOrbColor(start.orb));
        });

        // Додатково: якщо є кілька частин одного id (start->start або end->end), з'єднаємо центри
        group.sort((a, b) => a.y - b.y);
        for (let i = 0; i < group.length - 1; i++) {
            const a = group[i], b = group[i + 1];
            const isStartEndPair = a.kind === 'start' && b.kind === 'end';
            if (!isStartEndPair) {
                // використовуємо центри (вже перезчитані)
                createConnectorCoords(container, a.x, a.y, b.x, b.y, getOrbColor(a.orb));
                if (a.el.classList.contains('frame-reverse')) b.el.classList.add('frame-reverse');
            }
        }
    });
}

// дає координати "якоря" на орбі залежно від позиції ('top' або 'bottom')
// повертає об'єкт {x, y} у координатах контейнера (враховано скрол)
function getOrbAnchorCoords(item, verticalPos, containerRect, scrollTop, scrollLeft) {
    const r = item.orb.getBoundingClientRect();
    // x: беремо або ліву/праву сторону орби залежно від layout (frame-reverse змінює DOM позицію)
    // але щоб лінія виходила "збоку" орба, беремо край орби ближчий до центру контейнера:
    // логіка: якщо .frame-reverse є — орба зазвичай на правому боці фрейму, але точну позицію визначає bounding rect
    const centerX = r.left - containerRect.left + r.width / 2 + scrollLeft;
    const leftX = r.left - containerRect.left + 0 + scrollLeft;
    const rightX = r.right - containerRect.left + scrollLeft;
    // для більш передбачуваної лінії візьмемо центральний x; якщо потрібно врахувати "боці" — можна переключити
    // Але щоб лінія візуально виходила з правильного боку, використовуємо центр X — DOM вже відобразив frame-reverse.
    const x = centerX;
    const y = verticalPos === 'top'
        ? (r.top - containerRect.top + scrollTop)
        : (r.bottom - containerRect.top + scrollTop);
    return { x, y };
}

// створює коннектор за координатами (початок x1,y1 -> кінець x2,y2)
function createConnectorCoords(container, x1, y1, x2, y2, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const line = document.createElement('div');
    line.className = 'orb-connector';
    line.style.position = 'absolute';
    line.style.left = `${x1}px`;
    line.style.top = `${y1 - 1}px`; // центруємо лінію по висоті (висота 2px)
    line.style.width = `${dist}px`;
    line.style.height = `2px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = 'left center';
    line.style.backgroundColor = color || 'currentColor';
    line.style.pointerEvents = 'none';
    line.style.zIndex = 25;
    container.appendChild(line);
}

function getOrbColor(orbEl) {
    try {
        const cs = getComputedStyle(orbEl);
        return cs.borderColor || cs.backgroundColor;
    } catch (e) {
        return null;
    }
}

function groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] ||= []).push(item);
        return acc;
    }, {});
}

function throttle(fn, wait) {
    let t = 0;
    let scheduled = null;
    return function (...args) {
        const now = Date.now();
        if (now - t > wait) {
            t = now;
            fn.apply(this, args);
        } else {
            clearTimeout(scheduled);
            scheduled = setTimeout(() => {
                t = Date.now();
                fn.apply(this, args);
            }, wait - (now - t));
        }
    };
}



addEvents = document.querySelector('.add-event-overlay')

function openAddEvents() {
    addEvents.classList.add('enabled-overlay');
}

function closeAddEvents() {
    addEvents.classList.remove('enabled-overlay');
}


document.addEventListener('DOMContentLoaded', () => {
    initOrbConnectors();
    initDropdowns(); // <-- додано ініціалізацію дропдаунів
});

// глобальний лічильник для підняття відкритого дропдауна над іншими
let dropdownZCounter = 200000;

function initDropdowns() {
    const container = document.querySelector('.grid3');
    const frames = Array.from(document.querySelectorAll('.event-frame'));

    frames.forEach(frame => {
        const dropdown = frame.querySelector('.dropdown-info');
        if (!dropdown) return;

        // початковий стан
        dropdown.style.display = dropdown.classList.contains('show') ? 'block' : 'none';
        dropdown.setAttribute('aria-hidden', dropdown.classList.contains('show') ? 'false' : 'true');
        dropdown.style.zIndex = dropdownZCounter; // базовий z

        // клік по фрейму — перемикати дропдаун
        frame.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(frame);
        });

        // не закривати при кліку всередині самого дропдауну
        dropdown.addEventListener('click', e => e.stopPropagation());

        // після завершення анімації приховуємо display для економії місця
        dropdown.addEventListener('animationend', () => {
            if (dropdown.classList.contains('hide')) {
                dropdown.style.display = 'none';
                dropdown.setAttribute('aria-hidden', 'true');
            } else if (dropdown.classList.contains('show')) {
                dropdown.style.display = 'block';
                dropdown.setAttribute('aria-hidden', 'false');
            }
        });
    });

    // закривати при кліку поза івентами
    document.addEventListener('click', closeAllDropdowns);
}

function toggleDropdown(frame) {
    const dropdown = frame.querySelector('.dropdown-info');
    if (!dropdown) return;

    // закриваємо інші дропдауни, крім поточного
    closeAllDropdowns(dropdown);

    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdown.classList.add('hide');
    } else {
        // зробимо видимим перед запуском анімації і піднімемо в стек
        dropdown.style.display = 'block';
        dropdown.style.zIndex = ++dropdownZCounter; // підняти над усіма попередніми
        dropdown.classList.remove('hide');
        dropdown.classList.add('show');
    }
}

function closeAllDropdowns(skip = null) {
    document.querySelectorAll('.dropdown-info.show, .dropdown-info.hide').forEach(d => {
        if (d === skip) return;
        d.classList.remove('show');
        if (!d.classList.contains('hide')) d.classList.add('hide');
    });
}

const listEvents = document.querySelectorAll('.list-event');

listEvents.forEach(listEvent => {
    listEvent.addEventListener('click', () => {
        listEvent.classList.toggle('expand')
    })
})


// ...existing code...
const sideTags = document.querySelectorAll('.side-tag')
const daysNav = document.querySelector('.days-navigation')
const grid3 = document.querySelector('.grid3')
const filteredList = document.querySelector('.filtered-list')

function updateFilteredState() {
    // зібрати вибрані теги (в нижньому регістрі для порівняння)
    const selectedTags = Array.from(document.querySelectorAll('.side-tag.selected'))
        .map(t => t.textContent.trim().toLowerCase());

    const anySelected = selectedTags.length > 0;

    // показ/приховування основних областей
    if (grid3) grid3.classList.toggle('filtered', anySelected);
    if (daysNav) daysNav.classList.toggle('filtered', anySelected);
    if (filteredList) filteredList.classList.toggle('filtered', anySelected);

    // якщо немає filtered-list або немає вибраних тегів — показуємо всі події у списку (або приховуємо список)
    if (!filteredList) return;

    const listItems = Array.from(filteredList.querySelectorAll('.list-event'));

    // Функція отримує теги події (з .tag-block) в нижньому регістрі
    const getEventTags = (item) => Array.from(item.querySelectorAll('.tag-block'))
        .map(x => x.textContent.trim().toLowerCase());

    listItems.forEach(item => {
        const eventTags = getEventTags(item);

        let shouldShow = true;
        if (selectedTags.length === 0) {
            shouldShow = true;
        } else if (selectedTags.length === 1) {
            // при одному вибраному тегі — показуємо якщо eventTags містить цей тег
            shouldShow = eventTags.includes(selectedTags[0]);
        } else {
            // при кількох — подія повинна містити всі вибрані теги (AND)
            shouldShow = selectedTags.every(t => eventTags.includes(t));
        }

        item.style.display = shouldShow ? '' : 'none';
    });
}

sideTags.forEach(sideTag => {
    sideTag.addEventListener('click', () => {
        sideTag.classList.toggle('selected');
        updateFilteredState();
    })
})

// ініціалізація стану при завантаженні сторінки
updateFilteredState();
// ...existing code...


// --- "Більше / Менше" у сайдбарі ---
document.addEventListener('DOMContentLoaded', () => {
  const LIMIT = 3;

  function applyState(container, expanded) {
    const events = Array.from(container.querySelectorAll('.event-popup'));
    events.forEach((el, i) => {
      el.classList.toggle('hidden', !expanded && i >= LIMIT);
    });

    const btn = container.querySelector('.see-more-popups');
    if (btn) {
      btn.textContent = expanded ? 'Менше' : 'Більше';
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    container.dataset.expanded = expanded ? '1' : '0';
  }

  // Ініціалізація всіх блоків у сайдбарі
  document.querySelectorAll('.events-side-container').forEach(container => {
    applyState(container, false); // початково згорнуто
    const btn = container.querySelector('.see-more-popups');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const expanded = container.dataset.expanded === '1';
      applyState(container, !expanded);
    });
  });
});
