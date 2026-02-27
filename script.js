document.addEventListener("DOMContentLoaded", () => {
    // 1. Custom Cursor
    const cursor = document.getElementById('custom-cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // 2. Animação Topográfica (Canvas)
    const canvas = document.getElementById('topo-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;
        
        // Obter cor de destaque da página atual
        const style = getComputedStyle(document.body);
        const highlightColor = style.getPropertyValue('--highlight-1').trim() || '#0EACE3';

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const clusterSeeds = [
            { x: 0.18, y: 0.28, scale: 1.15, drift: 0.8 },
            { x: 0.52, y: 0.36, scale: 1.0, drift: 1.0 },
            { x: 0.82, y: 0.3, scale: 1.2, drift: 0.9 },
            { x: 0.32, y: 0.76, scale: 1.35, drift: 1.1 },
            { x: 0.72, y: 0.72, scale: 1.05, drift: 1.25 }
        ];

        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', updateCanvasSize);

        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) requestAnimationFrame(drawTopography);
            });
        });
        observer.observe(canvas);

        function drawTopography() {
            if (!isVisible) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = highlightColor;
            ctx.lineWidth = 2.4;

            const time = Date.now() * 0.001;
            const rings = 12;
            const pointsPerRing = 96;
            const baseRadius = Math.min(canvas.width, canvas.height) * 0.11;
            const ringStep = Math.min(canvas.width, canvas.height) * 0.038;

            for (let c = 0; c < clusterSeeds.length; c++) {
                const cluster = clusterSeeds[c];
                const centerX =
                    canvas.width * cluster.x +
                    (mouseX - canvas.width * 0.5) * (0.08 + c * 0.01) +
                    Math.cos(time * (0.35 + c * 0.05)) * 24 * cluster.drift;
                const centerY =
                    canvas.height * cluster.y +
                    (mouseY - canvas.height * 0.5) * (0.08 + c * 0.01) +
                    Math.sin(time * (0.4 + c * 0.05)) * 20 * cluster.drift;

                for (let ring = 0; ring < rings; ring++) {
                    const currentRadius = (baseRadius + ring * ringStep) * cluster.scale;
                    const waveAmp = 14 + ring * 0.9;
                    const alpha = 0.09 + ring * 0.012;

                    ctx.beginPath();

                    for (let point = 0; point <= pointsPerRing; point++) {
                        const t = point / pointsPerRing;
                        const angle = t * Math.PI * 2;
                        const noise =
                            Math.sin(angle * 3 + time * 1.4 + ring * 0.7 + c * 0.9) * waveAmp +
                            Math.cos(angle * 6 - time * 1.2 + ring * 0.35 + c * 0.4) * (waveAmp * 0.38);
                        const radius = currentRadius + noise;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;

                        if (point === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }

                    ctx.globalAlpha = Math.min(alpha, 0.26);
                    ctx.stroke();
                }
            }

            ctx.globalAlpha = 1;
            requestAnimationFrame(drawTopography);
        }
    }

    // 3. Calculadora de Preços Dinâmica
    const priceRange = document.getElementById('priceRange');
    const priceDisplay = document.getElementById('priceDisplay');
    const marketPrice = document.getElementById('marketPrice');
    const productType = document.getElementById('productType');

    if (priceRange) {
        const products = ["Landing Page", "E-commerce Básico", "Sistema de Gestão", "Aplicativo Mobile Complexo"];
        const pricesJunior = [800, 2500, 5000, 8000];
        const pricesMarket = [2500, 8000, 15000, 25000];

        priceRange.addEventListener('input', (e) => {
            const val = e.target.value;
            productType.innerText = products[val];
            priceDisplay.innerText = `Investimento iJunior: R$ ${pricesJunior[val]},00`;
            marketPrice.innerText = `Preço Médio de Mercado: R$ ${pricesMarket[val]},00 (Economia de até ${(100 - (pricesJunior[val]/pricesMarket[val]*100)).toFixed(0)}%)`;
        });
    }

    // 4. Submissão do Formulário de Contato
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Lógica de envio da API iria aqui
            
            // Confirmação
            const goToInsta = confirm("Mensagem enviada com sucesso para nossa equipe! Gostaria de conhecer nosso Instagram enquanto aguarda o retorno?");
            if (goToInsta) {
                window.open("https://www.instagram.com/ijunior_ufmg/", "_blank");
            }
            form.reset();
        });
    }
});

// 5. Carrossel de Soluções (autoplay + interação)
const solutionsTrack = document.querySelector('.solutions-grid');
const solutionsSlides = Array.from(solutionsTrack ? solutionsTrack.children : []);
const solutionsPrevButton = document.querySelector('.solutions-prev-btn');
const solutionsNextButton = document.querySelector('.solutions-next-btn');
const solutionsDotsContainer = document.querySelector('.solutions-carousel-dots');
const solutionsViewport = document.querySelector('.solutions-carousel-viewport');

if (
    solutionsTrack &&
    solutionsSlides.length > 0 &&
    solutionsPrevButton &&
    solutionsNextButton &&
    solutionsDotsContainer &&
    solutionsViewport
) {
    let currentSolutionIndex = 0;
    let solutionsAutoplayId = null;
    let pointerStartX = 0;
    let pointerIsDown = false;
    const swipeThreshold = 50;
    const autoplayIntervalMs = 4500;

    const solutionDots = solutionsSlides.map((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'solutions-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir para solução ${index + 1}`);
        solutionsDotsContainer.appendChild(dot);
        return dot;
    });

    const updateSolutionsCarousel = () => {
        solutionsTrack.style.transform = `translateX(-${currentSolutionIndex * 100}%)`;
        solutionDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSolutionIndex);
        });
    };

    const goToSolution = (index) => {
        currentSolutionIndex = (index + solutionsSlides.length) % solutionsSlides.length;
        updateSolutionsCarousel();
    };

    const nextSolution = () => goToSolution(currentSolutionIndex + 1);
    const prevSolution = () => goToSolution(currentSolutionIndex - 1);

    const stopSolutionsAutoplay = () => {
        if (solutionsAutoplayId) {
            clearInterval(solutionsAutoplayId);
            solutionsAutoplayId = null;
        }
    };

    const startSolutionsAutoplay = () => {
        stopSolutionsAutoplay();
        solutionsAutoplayId = setInterval(nextSolution, autoplayIntervalMs);
    };

    solutionsNextButton.addEventListener('click', () => {
        nextSolution();
        startSolutionsAutoplay();
    });

    solutionsPrevButton.addEventListener('click', () => {
        prevSolution();
        startSolutionsAutoplay();
    });

    solutionDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSolution(index);
            startSolutionsAutoplay();
        });
    });

    solutionsViewport.addEventListener('pointerdown', (event) => {
        pointerStartX = event.clientX;
        pointerIsDown = true;
    });

    solutionsViewport.addEventListener('pointerup', (event) => {
        if (!pointerIsDown) return;
        const deltaX = event.clientX - pointerStartX;
        pointerIsDown = false;

        if (Math.abs(deltaX) >= swipeThreshold) {
            if (deltaX < 0) {
                nextSolution();
            } else {
                prevSolution();
            }
            startSolutionsAutoplay();
        }
    });

    solutionsViewport.addEventListener('pointercancel', () => {
        pointerIsDown = false;
    });

    solutionsViewport.addEventListener('mouseenter', stopSolutionsAutoplay);
    solutionsViewport.addEventListener('mouseleave', startSolutionsAutoplay);
    solutionsViewport.addEventListener('focusin', stopSolutionsAutoplay);
    solutionsViewport.addEventListener('focusout', startSolutionsAutoplay);

    updateSolutionsCarousel();
    startSolutionsAutoplay();
}

// 6. Lógica dos Carrosséis (depoimentos e eventos)
    const carouselWrappers = document.querySelectorAll('.carousel-wrapper');
    carouselWrappers.forEach((wrapper) => {
        const track = wrapper.querySelector('.carousel-track');
        const slides = Array.from(track ? track.children : []);
        const nextButton = wrapper.querySelector('.next-btn');
        const prevButton = wrapper.querySelector('.prev-btn');

        if (!track || slides.length === 0 || !nextButton || !prevButton) return;

        let currentSlideIndex = 0;
        const isEventsCarousel = wrapper.classList.contains('events-carousel');

        const getVisibleSlides = () => {
            if (!isEventsCarousel) return 1;
            return window.innerWidth <= 768 ? 1 : 3;
        };

        const getMaxStartIndex = () => {
            return Math.max(0, slides.length - getVisibleSlides());
        };

        const updateSlidePosition = () => {
            const visibleSlides = getVisibleSlides();
            const stepPercent = 100 / visibleSlides;
            const maxStartIndex = getMaxStartIndex();
            if (currentSlideIndex > maxStartIndex) {
                currentSlideIndex = maxStartIndex;
            }
            track.style.transform = `translateX(-${currentSlideIndex * stepPercent}%)`;
        };

        nextButton.addEventListener('click', () => {
            const maxStartIndex = getMaxStartIndex();
            currentSlideIndex = currentSlideIndex >= maxStartIndex ? 0 : currentSlideIndex + 1;
            updateSlidePosition();
        });

        prevButton.addEventListener('click', () => {
            const maxStartIndex = getMaxStartIndex();
            currentSlideIndex = currentSlideIndex <= 0 ? maxStartIndex : currentSlideIndex - 1;
            updateSlidePosition();
        });

        window.addEventListener('resize', updateSlidePosition);
        updateSlidePosition();
    });

    // 7. Lógica do FAQ (Sanfona)
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');

            // Fecha todas as outras
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
            });

            // Abre a selecionada se não estava ativa
            if (!isActive) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });


