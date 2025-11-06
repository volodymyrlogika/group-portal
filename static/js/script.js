const scroller = document.querySelector('.services-scroller');
const services = document.querySelector('.services');

let scrollPaused = false;
let scrollSpeed = 1;

let savedScrollLeft = 0;
let savedOffsets = [];   // якщо захочеш дебажити позиції кожної картки
let activeHoverCard = null;

// Клонуємо картки, щоб був безкінечний цикл
services.innerHTML += services.innerHTML;

// Автоскрол
function autoScroll() {
    if (!scrollPaused) {
        scroller.scrollLeft += scrollSpeed;

        // якщо проскролили половину — скидаємо
        if (scroller.scrollLeft >= services.scrollWidth / 2) {
            scroller.scrollLeft = 0;
        }
    }
    requestAnimationFrame(autoScroll);
}

// Зупинка автоскролу при наведенні
// scroller.addEventListener('mouseenter', () => scrollPaused = true);
// scroller.addEventListener('mouseleave', () => scrollPaused = false);

// горизонтальний скрол колесом
scroller.addEventListener('wheel', e => {
    if (scrollPaused) {
        e.preventDefault();
        scroller.scrollLeft += e.deltaY;
    }
});

// стилі для контейнера
function setScrollerStyles() {
    scroller.style.overflowX = 'hidden'; // важливо
    scroller.style.whiteSpace = 'nowrap';
    scroller.style.position = 'relative';
    scroller.style.scrollBehavior = 'auto';

    services.style.display = 'inline-flex';
    services.style.position = 'relative';
}
setScrollerStyles();
requestAnimationFrame(autoScroll);



// =================== 3D + градієнтні ефекти ===================
const cards = document.querySelectorAll('.service-card');

cards.forEach((card, idx) => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - centerX;
        const dy = y - centerY;

        const oppositeX = centerX - dx;
        const oppositeY = centerY - dy;

        // фон
        card.style.background = `
            radial-gradient(circle at ${oppositeX}px ${oppositeY}px,
                rgba(255, 255, 255, 0.3),
                rgba(36, 36, 36, 0.5) 80%)
        `;

        // бордер
        card.style.setProperty("--border-gradient", `
            radial-gradient(circle at ${oppositeX}px ${oppositeY}px,
                rgba(255, 255, 255, 0.9),
                rgba(255, 255, 255, 0.1) 80%)
        `);
        card.style.setProperty("--border-active", "1");

        // 3D
        const rotateX = (dy / centerY) * 10;
        const rotateY = -(dx / centerX) * 10;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    card.addEventListener('mouseenter', () => {
        // ——— Зберігаємо стан перед «вилазанням» картки
        if (!activeHoverCard) {
            activeHoverCard = card;

            // 1) фіксуємо скрол
            savedScrollLeft = scroller.scrollLeft;

            // 2) (опційно) фіксуємо офсети кожної картки відносно контейнера
            savedOffsets = Array.from(cards).map(c => c.offsetLeft);

            // 3) робимо картку «над» усім і дозволяємо вилазити за контейнер
            card.style.willChange = 'transform';
            card.style.zIndex = '10';
            scroller.style.overflowX = 'visible';

            // 4) пауза автоскролу, поки користувач взаємодіє з карткою
            scrollPaused = true;
        }
        // прибираємо плавність під час активної взаємодії
        card.style.transition = "none";
    });

    card.addEventListener('mouseleave', () => {
        // повертаємо стиль картки
        card.style.background = `rgba(26, 26, 26, 0.5)`;
        card.style.setProperty("--border-active", "0");
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
        card.style.transition = "transform 0.3s ease, background 0.3s ease";

        // Після завершення анімації повертаємо контейнер у вихідний стан
        const onEnd = (e) => {
            if (e.propertyName !== 'transform') return;

            // 1) блокуємо вилазіння
            scroller.style.overflowX = 'hidden';

            // 2) «телепортуємо» видиму область у збережену позицію
            //    (це й є відновлення відносних позицій усіх карток на екрані)
            scroller.scrollLeft = savedScrollLeft;

            // 3) чистимо стан і повертаємо автоскрол
            card.style.zIndex = '';
            card.style.willChange = '';
            activeHoverCard = null;
            scrollPaused = false;

            card.removeEventListener('transitionend', onEnd);
        };
        // слухаємо одноразово завершення повернення трансформацій
        card.addEventListener('transitionend', onEnd, { once: true });
    });
});