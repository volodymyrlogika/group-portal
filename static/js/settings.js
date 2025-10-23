const themeChanger = document.getElementById("themeChanger");
const themeInputs = document.querySelectorAll("input[name='theme']");
const fontSelect = document.getElementById('font-select');
const root = document.documentElement;

// Зміна теми
themeInputs.forEach(input => {
    input.addEventListener("change", (e) => {
        if (e.target.checked) {
            if (e.target.value === "light") {
                themeChanger.setAttribute("href", "./src/css/beige-theme.css");
            } else if (e.target.value === "dark") {
                themeChanger.setAttribute("href", "./src/css/dark-theme.css");
            }
        }
    });
});


// Зміна шрифту
fontSelect.addEventListener('change', (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === 'default') {
        root.style.setProperty('--main-font', 'e-Ukraine, sans-serif');
        root.style.setProperty('--header-font', 'e-Ukraine Head, sans-serif');
    } else {
        root.style.setProperty('--main-font', 'Lexend, sans-serif');
        root.style.setProperty('--header-font', 'Lexend, sans-serif');
    }
});


// Змінення розміру шрифта

const fontSizeSelector = document.getElementById("FontSizeSelector");
const fontSizeInput = document.getElementById("fontSizeInput");

const btnUp = fontSizeSelector.querySelector(".numberInputButtonUp");
const btnDown = fontSizeSelector.querySelector(".numberInputButtonDown");

let currentFontSize = parseInt(fontSizeInput.textContent);


const allElements = document.querySelectorAll("*");
allElements.forEach(el => {
    const style = window.getComputedStyle(el);
    el.dataset.baseFontSize = parseInt(style.fontSize);
});

function changeFontSize(action) {
    if (action === '-') {
        if (currentFontSize > 0) {
            currentFontSize -= 1;
            fontSizeInput.textContent = currentFontSize;
            updateAllFontSizes();
        }
    } else if (action === '+') {
        if (currentFontSize < 19) {
            currentFontSize += 1;
            fontSizeInput.textContent = currentFontSize;
            updateAllFontSizes();
        }
    }
}

function updateAllFontSizes() {
    allElements.forEach(el => {
        const baseSize = parseInt(el.dataset.baseFontSize);
        el.style.fontSize = (baseSize + (currentFontSize - 16)) + "px";
    });
}

btnUp.addEventListener("click", () => changeFontSize('-'));
btnDown.addEventListener("click", () => changeFontSize('+'));

// Кнопки в лівій стороні меню

const btnGeneral = document.getElementById('menubarBtnGeneral')
const btnAbility = document.getElementById('menubarBtnAbility')
const btnProfile = document.getElementById('menubarBtnProfile')
const btnSecurity = document.getElementById('menubarBtnSecurity')

const menuGeneral = document.getElementById('menubarGeneral')
const menuAbility = document.getElementById('menubarAbility')

btnAbility.addEventListener('click', () => {
    btnAbility.classList.add('current-menubtn')
    btnGeneral.classList.remove('current-menubtn')

    menuGeneral.classList.remove('settings-option-current')
    menuAbility.classList.add('settings-option-current')
})

btnGeneral.addEventListener('click', () => {
    btnAbility.classList.remove('current-menubtn')
    btnGeneral.classList.add('current-menubtn')

    menuGeneral.classList.add('settings-option-current')
    menuAbility.classList.remove('settings-option-current')
})


/* ====== Налаштування ====== */
const shaderSelect = document.getElementById('shader-select');
const colorProps = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color"
];

/* ====== Збирання даних про елементи (оригінали) ====== */
const elementsData = []; // { el, props: { "color": {computed: "...", inline: "..."}, ... } }

document.querySelectorAll('*').forEach(el => {
  // пропустимо непотрібні теги
  if (!(el instanceof Element)) return;
  const skipTags = ['SCRIPT', 'STYLE', 'LINK', 'META'];
  if (skipTags.includes(el.tagName)) return;

  const styles = window.getComputedStyle(el);
  const props = {};

  colorProps.forEach(prop => {
    const inlineVal = el.style.getPropertyValue(prop); // inline only
    const computedVal = styles.getPropertyValue(prop);  // computed value

    if (computedVal && !isTransparent(computedVal)) {
      props[prop] = {
        inline: inlineVal || '',     // збережемо inline (може бути '')
        computed: computedVal.trim() // computed колір (rgb(...) або hex)
      };
    }
  });

  if (Object.keys(props).length > 0) {
    elementsData.push({ el, props });
  }
});

/* ====== Подвійна перевірка: чи є бібліотека color-blind ====== */
if (!window.colorBlind) {
  console.warn('color-blind library not found on window.colorBlind. Переконайся, що bundle.js експортує window.colorBlind = require("color-blind")');
}

/* ====== Функція для застосування шейдера ====== */
let currentShader = 'normal';

shaderSelect.addEventListener('change', (e) => {
  const shader = e.target.value;
  if (shader === currentShader) return;
  applyShader(shader);
  currentShader = shader;
});

function applyShader(shader) {
  const fn = resolveColorBlindFunction(shader);

  elementsData.forEach(item => {
    const { el, props } = item;

    for (const prop in props) {
      const { inline, computed } = props[prop];

      if (shader === 'normal') {
        // Відновлюємо те, що було inline — якщо inline пустий, видаляємо властивість
        if (inline && inline.trim() !== '') {
          el.style.setProperty(prop, inline);
        } else {
          el.style.removeProperty(prop);
        }
      } else {
        if (!fn) continue; // немає функції — пропускаємо
        // Базуємось на ОРИГІНАЛЬНОМУ computed (не на поточному inline)
        const baseHex = toHex(computed);
    if (!computed) continue; // або будь-яка перевірка на null
    let transformed = transformColorWithShader(computed, fn);
    if (!transformed) continue;
    el.style.setProperty(prop, transformed);

      }
    }
  });
}

function parseColorWithAlpha(colorStr) {
  colorStr = colorStr.trim();
  let r=0, g=0, b=0, a=1;

  // rgb / rgba
  if (colorStr.startsWith('rgb')) {
    const nums = colorStr.match(/[\d\.]+/g);
    if (!nums || nums.length < 3) return null;
    r = Number(nums[0]);
    g = Number(nums[1]);
    b = Number(nums[2]);
    if (nums.length === 4) a = parseFloat(nums[3]);
    return {r,g,b,a};
  }

  // hex
  if (colorStr[0] === '#') {
    let hex = colorStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
    r = parseInt(hex.slice(0,2),16);
    g = parseInt(hex.slice(2,4),16);
    b = parseInt(hex.slice(4,6),16);
    return {r,g,b,a:1};
  }

  // CSS color keyword
  try {
    const temp = document.createElement('span');
    temp.style.color = colorStr;
    document.body.appendChild(temp);
    const comp = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    return parseColorWithAlpha(comp);
  } catch(e) {
    return null;
  }
}

// перетворюємо r,g,b,a назад у CSS рядок
function toCssRGBA({r,g,b,a}) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// застосування шейдера з урахуванням alpha
function transformColorWithShader(colorStr, shaderFn) {
  const parsed = parseColorWithAlpha(colorStr);
  if (!parsed) return colorStr;

  const hex = rgbToHex({r:parsed.r,g:parsed.g,b:parsed.b});
  const transformedHex = shaderFn ? shaderFn(hex) : hex;
  const transformedRGB = parseColorWithAlpha(transformedHex) || parsed;

  return toCssRGBA({r: transformedRGB.r, g: transformedRGB.g, b: transformedRGB.b, a: parsed.a});
}

// rgbToHex адаптована для об'єкта {r,g,b}
function rgbToHex({r,g,b}) {
  return "#" + [r,g,b].map(n => n.toString(16).padStart(2,'0')).join('');
}


/* ====== Розумний резолвер функції color-blind ====== */
function resolveColorBlindFunction(name) {
  if (name === 'normal') return null;
  const cb = window.colorBlind;
  if (!cb) return null;

  // можливі варіанти і синоніми (враховуємо різні назви у select)
  const synonyms = {
    protanomaly: ['protanomaly', 'protanopia'],
    deuteranomaly: ['deuteranomaly', 'deuteranopia'],
    tritanomaly: ['tritanomaly', 'tritanopia'],
    achromatomaly: ['achromatomaly', 'achromatopsia', 'achromatomaly'],
  };

  // спроба прямого доступу
  if (typeof cb[name] === 'function') return cb[name];

  // синоніми
  if (synonyms[name]) {
    for (const s of synonyms[name]) {
      if (typeof cb[s] === 'function') return cb[s];
    }
  }

  // пошук по імені всередині keys
  for (const key in cb) {
    if (typeof cb[key] === 'function' && key.toLowerCase().includes(name.replace(/[^a-z]/gi, '').toLowerCase())) {
      return cb[key];
    }
  }

  console.warn('Не вдалося знайти відповідну функцію шейдера для:', name);
  return null;
}

/* ====== Допоміжні функції для роботи з кольорами ====== */
function isTransparent(value) {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return v === 'transparent' || v === 'rgba(0, 0, 0, 0)' || v === 'rgba(0,0,0,0)';
}

function normalizeHex(h) {
  // #fff -> #ffffff, #abc123 -> #abc123
  if (!h) return null;
  h = h.trim();
  if (h.charAt(0) !== '#') return h;
  if (h.length === 4) {
    return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return h.length === 7 ? h : h;
}

function toHex(colorStr) {
  if (!colorStr) return null;
  colorStr = colorStr.trim();

  // already hex
  if (colorStr[0] === '#') return normalizeHex(colorStr);

  // rgb(...) or rgba(...)
  if (colorStr.startsWith('rgb')) {
    const nums = colorStr.match(/[\d\.]+/g);
    if (!nums || nums.length < 3) return null;
    const r = Math.round(Number(nums[0]));
    const g = Math.round(Number(nums[1]));
    const b = Math.round(Number(nums[2]));
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  }

  // keyword color (like "red") – виміряємо через тимчасовий елемент
  try {
    const temp = document.createElement('span');
    temp.style.color = colorStr;
    document.body.appendChild(temp);
    const comp = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    return toHex(comp);
  } catch (e) {
    return null;
  }
}