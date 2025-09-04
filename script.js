document.addEventListener('DOMContentLoaded', function() {
    // Cache de seletores frequentemente utilizados
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    // Inicializar componentes UI
    initNavigation();
    initScrollEffects();
    initAnimations();
    initUserMenu();
    initFormHandlers();
    initDashboardComponents();
    checkUserAuthentication();
    
    // Funções de inicialização para diferentes componentes
    function initNavigation() {
        if (hamburger) {
            hamburger.addEventListener('click', function() {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }
        
        // Rolagem suave para links ancora
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        if (anchorLinks.length) {
            anchorLinks.forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const href = this.getAttribute('href');
                    if (href && href !== '#') {
                        const target = document.querySelector(href);
                        if (target) {
                            window.scrollTo({
                                top: target.offsetTop - 80,
                                behavior: 'smooth'
                            });
                        }
                    }
                    // Fechar menu mobile se estiver aberto
                    if (navLinks && navLinks.classList.contains('active')) {
                        hamburger.classList.remove('active');
                        navLinks.classList.remove('active');
                    }
                });
            });
        }
    }
    
    function initScrollEffects() {
        // Mudar estilo da navbar ao rolar
        if (navbar) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }
    
    function initAnimations() {
        // Observar elementos para animação ao entrar na viewport
        const sections = document.querySelectorAll('section');
        if (sections.length) {
            const options = {
                threshold: 0.2,
                rootMargin: '0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        observer.unobserve(entry.target);
                    }
                });
            }, options);
            
            sections.forEach(section => {
                section.classList.add('fade-in');
                observer.observe(section);
            });
        }
    }
    
    function initUserMenu() {
        // Toggle do menu do usuário
        const userMenuTrigger = document.getElementById('userMenuTrigger');
        const userMenuContent = document.getElementById('userMenuContent');
        if (userMenuTrigger && userMenuContent) {
            userMenuTrigger.addEventListener('click', function(e) {
                e.preventDefault();
                userMenuContent.classList.toggle('show');
            });
            // Fechar o menu quando clicar fora dele
            document.addEventListener('click', function(e) {
                if (!userMenuTrigger.contains(e.target) && !userMenuContent.contains(e.target)) {
                    userMenuContent.classList.remove('show');
                }
            });
        }
        // Atualizar nome do usuário nos elementos apropriados
        if (typeof updateUserDisplay === 'function') {
            updateUserDisplay();
        }
    }
    
    function initFormHandlers() {
        // Formulário de contato
        const contactForm = document.querySelector('.cta-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = contactForm.querySelector('input[type="email"]').value;
                
                if (validateEmail(email)) {
                    // Simular envio do formulário
                    const button = contactForm.querySelector('button');
                    const originalText = button.textContent;
                    button.textContent = 'Enviando...';
                    button.disabled = true;
                    
                    // Simular resposta do servidor após 1.5 segundos
                    setTimeout(() => {
                        showSuccessMessage('Obrigado pelo interesse! Em breve enviaremos um e-mail com acesso à demonstração.');
                        contactForm.reset();
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1500);
                } else {
                    showErrorMessage('Por favor, insira um e-mail válido.');
                }
            });
        }
        // Botão de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        
        // Alternar entre formulários de login e cadastro
        const toggleForms = document.querySelectorAll('.toggle-form');
        if (toggleForms.length) {
            toggleForms.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.getElementById('loginCard').classList.toggle('hidden');
                    document.getElementById('registerCard').classList.toggle('hidden');
                });
            });
        }
    }
    
    function checkUserAuthentication() {
        // Lista de páginas que requerem autenticação
        const protectedPages = [
            'dashboard.html',
            'market-tracker.html',
            'stock-ranking.html',
            'community.html',
            'analysis.html',
            'profile.html',
            'configuracoes.html'
        ];

        // Verificar se a página atual requer autenticação
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
            const isLoggedIn = localStorage.getItem('finova_userLoggedIn') === 'true';
            if (!isLoggedIn) {
                window.location.href = 'login.html';
                return;
            }
        }
        
        // Verificar se há um token de autenticação permanente
        const token = getCookie('finovaAuthToken');
        if (token) {
            const userData = getStoredUsers().find(user => user.authToken === token);
            if (userData) {
                // Login automático
                setLoggedInState(userData.email, userData.name, true);
                
                // Se estamos na página de login, redirecionar para dashboard
                if (window.location.href.includes('login.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        }
    }
    
    function updateUserDisplay() {
        // Atualizar nome do usuário em diferentes locais
        const userDisplayElements = [
            document.getElementById('userEmailDisplay'),
            document.getElementById('sidebarUserName')
        ];
        
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        let displayText = '';
        
        if (userName) {
            displayText = userName.split(' ')[0]; // Primeiro nome
        } else if (userEmail) {
            displayText = userEmail.split('@')[0]; // Parte antes do @
        }
        
        userDisplayElements.forEach(element => {
            if (element && displayText) {
                element.textContent = displayText;
            }
        });
    }
    
    // Funções para autenticação e gerenciamento de usuários
    function authenticateUser(email, password, rememberMe) {
        const users = getStoredUsers();
        const user = users.find(u => u.email === email && u.password === hashPassword(password));
        
        if (user) {
            // Gerar token de autenticação se "lembrar-me" estiver marcado
            if (rememberMe) {
                const authToken = generateAuthToken();
                // Atualizar o token do usuário no armazenamento
                updateUserAuthToken(email, authToken);
                // Salvar o token em um cookie de longa duração (30 dias)
                setCookie('finovaAuthToken', authToken, 30);
            }
            
            setLoggedInState(email, user.name, true);
            showSuccessMessage('Login realizado com sucesso!');
            
            // Redirecionar para a dashboard após um curto delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showErrorMessage('Email ou senha incorretos.');
        }
    }
    
    function registerUser(name, email, password) {
        const users = getStoredUsers();
        
        // Verificar se o usuário já existe
        if (users.some(u => u.email === email)) {
            showErrorMessage('Este email já está registrado.');
            return;
        }
        
        // Adicionar novo usuário
        users.push({
            name: name,
            email: email,
            password: hashPassword(password),
            authToken: null,
            createdAt: new Date().toISOString()
        });
        
        // Salvar a lista atualizada
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        showSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
        
        // Alternar para o formulário de login
        setTimeout(() => {
            document.getElementById('loginCard').classList.remove('hidden');
            document.getElementById('registerCard').classList.add('hidden');
            
            // Preencher email no formulário de login
            if (document.getElementById('loginEmail')) {
                document.getElementById('loginEmail').value = email;
            }
        }, 1500);
    }
    
    function logoutUser() {
        // Remover cookie de autenticação
        deleteCookie('finovaAuthToken');
        
        // Limpar dados de sessão
        localStorage.removeItem('finova_userLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        
        // Redirecionar para a página de login
        window.location.href = 'login.html';
    }
    
    function setLoggedInState(email, name, status) {
        localStorage.setItem('finova_userLoggedIn', status);
        localStorage.setItem('userEmail', email);
        if (name) localStorage.setItem('userName', name);
    }
    
    function getStoredUsers() {
        const storedUsers = localStorage.getItem('registeredUsers');
        return storedUsers ? JSON.parse(storedUsers) : [];
    }
    
    function updateUserAuthToken(email, token) {
        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex !== -1) {
            users[userIndex].authToken = token;
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
    }
    
    function hashPassword(password) {
        // Nota: Em um ambiente real, você usaria uma biblioteca de hash segura
        // Para fins de demonstração, usamos uma função simplificada
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    
    function generateAuthToken() {
        // Gerar um token aleatório
        const randomPart = Math.random().toString(36).substring(2, 15);
        const timePart = new Date().getTime().toString(36);
        return `${randomPart}${timePart}`;
    }
    
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
    
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    function deleteCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Função para inicializar o menu mobile das páginas internas
    function initDashboardMobile() {
        const toggleSidebar = document.querySelector('.toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        if (toggleSidebar && sidebar) {
            // Toggle do sidebar
            toggleSidebar.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.classList.toggle('sidebar-open');
            });

            // Fechar sidebar ao clicar no overlay
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            });

            // Fechar sidebar ao redimensionar para desktop
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        }
    }

    // Inicializar componentes específicos das páginas internas
    function initDashboardComponents() {
        // Verificar se estamos em uma página interna
        const isDashboardPage = document.querySelector('.sidebar') !== null;
        
        if (isDashboardPage) {
            initDashboardMobile();
            
            // Ajustar altura do conteúdo principal
            function adjustContentHeight() {
                const contentWrapper = document.querySelector('.content-wrapper');
                const navbar = document.querySelector('.navbar');
                if (contentWrapper && navbar) {
                    const navbarHeight = navbar.offsetHeight;
                    contentWrapper.style.minHeight = `calc(100vh - ${navbarHeight}px)`;
                }
            }

            // Ajustar altura inicial e ao redimensionar
            adjustContentHeight();
            window.addEventListener('resize', adjustContentHeight);
        }
    }

    initUserMenu();
});

// Utilitários
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Ocultar e limpar a mensagem de login específica no início
    const loginMessageElement = document.getElementById('loginMessage');
    if (loginMessageElement) {
        loginMessageElement.style.display = 'none'; // Ocultar a mensagem
        loginMessageElement.textContent = ''; // Limpar o texto
        // Opcional: remover classes de estilo para garantir
        loginMessageElement.classList.remove('success', 'error');
    }

    // Remover mensagens genéricas se existirem
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Animar entrada
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);
    
    // Remover após alguns segundos
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}

function initUserSystem() {
    // Inicializar sistema de usuários se necessário
    if (typeof loadUserData === 'function') {
        loadUserData();
    }
    if (typeof updateUserInterface === 'function') {
        updateUserInterface();
    }
}

// Função simples para o menu hamburger
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Hamburger clicked!'); // Debug
            
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Adicionar delay para animação dos itens do menu
            const menuItems = navLinks.querySelectorAll('li');
            menuItems.forEach((item, index) => {
                if (navLinks.classList.contains('active')) {
                    item.style.transitionDelay = `${index * 0.1}s`;
                } else {
                    item.style.transitionDelay = '0s';
                }
            });
        });

        // Fechar menu ao clicar em um link
        const menuLinks = navLinks.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Fechar menu ao clicar fora dele
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
});

// Melhorias Mobile - Animações e Interações
document.addEventListener('DOMContentLoaded', function() {
    
    // Detectar se é dispositivo mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Adicionar classe de loading aos elementos
        const animatedElements = document.querySelectorAll('.tool-card, .testimonial-card, .stat-item, .section-header');
        animatedElements.forEach((el, index) => {
            el.classList.add('loading');
            setTimeout(() => {
                el.classList.add('loaded');
            }, index * 100);
        });

        // Efeito de parallax sutil para o hero
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        });

        // Animar elementos quando entram na viewport
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        const elementsToObserve = document.querySelectorAll('.tool-card, .testimonial-card, .stat-item, .section-header');
        elementsToObserve.forEach(el => {
            observer.observe(el);
        });

        // Efeito de hover melhorado para cards
        const cards = document.querySelectorAll('.tool-card, .testimonial-card');
        cards.forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('touchend', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Melhorar feedback tátil para botões
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });

        // Adicionar efeito de ripple para botões
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Melhorar navegação mobile
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', function() {
                this.classList.toggle('active');
                navLinks.classList.toggle('active');
                
                // Adicionar delay para animação dos itens do menu
                const menuItems = navLinks.querySelectorAll('li');
                menuItems.forEach((item, index) => {
                    if (navLinks.classList.contains('active')) {
                        item.style.transitionDelay = `${index * 0.1}s`;
                    } else {
                        item.style.transitionDelay = '0s';
                    }
                });
            });

            // Fechar menu ao clicar em um link
            const menuLinks = navLinks.querySelectorAll('a');
            menuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }

        // Adicionar efeito de scroll suave para links internos
        const internalLinks = document.querySelectorAll('a[href^="#"]');
        internalLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80; // Ajustar para o header fixo
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Efeito de contador animado para estatísticas
        const statNumbers = document.querySelectorAll('.stat-item h3');
        const statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = target.textContent;
                    const isPercentage = finalValue.includes('%');
                    const isPlus = finalValue.includes('+');
                    const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
                    
                    let currentValue = 0;
                    const increment = numericValue / 50;
                    
                    const counter = setInterval(() => {
                        currentValue += increment;
                        if (currentValue >= numericValue) {
                            currentValue = numericValue;
                            clearInterval(counter);
                        }
                        
                        let displayValue = Math.floor(currentValue);
                        if (isPercentage) displayValue += '%';
                        if (isPlus) displayValue += '+';
                        
                        target.textContent = displayValue;
                    }, 30);
                    
                    statsObserver.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => {
            statsObserver.observe(stat);
        });

        // Melhorar performance de scroll
        let ticking = false;
        function updateOnScroll() {
            // Atualizar elementos baseados no scroll
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateOnScroll);
                ticking = true;
            }
        });

        // Adicionar classe para dispositivos touch
        document.body.classList.add('touch-device');
    }

    // Funcionalidades gerais (desktop e mobile)
    
    // Navegação fixa com scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Animação de fade-in para elementos
    const fadeElements = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        fadeObserver.observe(el);
    });

    // Melhorar acessibilidade
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeMenu = document.querySelector('.nav-links.active');
            if (activeMenu) {
                activeMenu.classList.remove('active');
                document.querySelector('.hamburger').classList.remove('active');
            }
        }
    });

    // Adicionar suporte para preferência de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
});

// Estilos CSS para efeitos adicionais
const additionalStyles = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .touch-device .btn:active {
        transform: scale(0.95);
    }

    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Funcionalidade da nova seção de ferramentas
document.addEventListener('DOMContentLoaded', function() {
    initToolsShowcase();
});

function initToolsShowcase() {
    const toolNavItems = document.querySelectorAll('.tool-nav-item');
    const toolContents = document.querySelectorAll('.tool-content');
    const toolShowcaseContent = document.querySelector('.tool-showcase-content');
    const toolsNavigation = document.querySelector('.tools-navigation');
    
    if (toolNavItems.length === 0 || toolContents.length === 0) {
        return; // Não estamos na página com a showcase de ferramentas
    }
    
    // Criar elementos para efeitos especiais
    createTechEffectElements();
    
    // Função para trocar de ferramenta com animações tecnológicas
    function switchTool(targetTool) {
        const currentActiveContent = document.querySelector('.tool-content.active');
        const targetContent = document.getElementById(targetTool);
        const activeNavItem = document.querySelector(`[data-tool="${targetTool}"]`);
        
        if (!targetContent || targetContent.classList.contains('active')) {
            return; // Já está ativo ou não existe
        }
        
        // Iniciar sequência de animações tecnológicas aprimorada
        startTechTransitionEnhanced(currentActiveContent, targetContent, activeNavItem, targetTool);
    }
    
    // Função principal para iniciar transição tecnológica
    function startTechTransition(currentContent, targetContent, navItem, targetTool) {
        // 1. Ativar modo tecnológico na navegação
        toolsNavigation.classList.add('tech-mode', 'scanning');
        
        // 2. Efeito de digitalização no item de navegação
        if (navItem) {
            navItem.classList.add('digitalizing');
        }
        
        // 3. Iniciar efeito holográfico
        triggerHolographicScan();
        
        // 4. Efeito removido (matriz digital)
        
        // 5. Efeito de glitch no conteúdo atual
        if (currentContent) {
            currentContent.classList.add('glitch-effect', 'glitching');
            setTimeout(() => {
                currentContent.classList.add('morphing-out');
            }, 150);
        }
        
        // 6. Pulso de energia
        setTimeout(() => {
            triggerEnergyPulse();
        }, 300);
        
        // 7. Trocar conteúdo após efeitos
        setTimeout(() => {
            switchContent(currentContent, targetContent, navItem);
        }, 500);
        
        // 8. Animar entrada do novo conteúdo
        setTimeout(() => {
            targetContent.classList.add('morphing-in');
            triggerFloatingParticles();
        }, 600);
        
        // 9. Finalizar transição
        setTimeout(() => {
            finalizeTechTransition(targetContent, navItem, targetTool);
        }, 1200);
    }
    
    // Função para trocar o conteúdo
    function switchContent(currentContent, targetContent, navItem) {
        // Remover classes ativas de todos os itens
        toolNavItems.forEach(item => item.classList.remove('active'));
        toolContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Ativar novo conteúdo
        if (navItem) {
            navItem.classList.add('active');
        }
        
        if (targetContent) {
            targetContent.style.display = 'flex';
            setTimeout(() => {
                targetContent.classList.add('active');
            }, 50);
        }
    }
    
    // Função para finalizar transição
    function finalizeTechTransition(targetContent, navItem, targetTool) {
        // Limpar classes de efeito
        toolsNavigation.classList.remove('scanning');
        
        if (navItem) {
            navItem.classList.remove('digitalizing');
        }
        
        if (targetContent) {
            targetContent.classList.remove('morphing-in', 'glitch-effect', 'glitching');
        }
        
        // Remover efeitos antigos
        const oldContent = document.querySelector('.tool-content.morphing-out');
        if (oldContent) {
            oldContent.classList.remove('morphing-out', 'glitch-effect', 'glitching');
        }
        
        // Animar conteúdo específico da ferramenta
        animateToolSpecificContent(targetTool);
        
        // Desativar modo tech após delay
            setTimeout(() => {
            toolsNavigation.classList.remove('tech-mode');
        }, 1000);
    }
    
    // Criar elementos para efeitos tecnológicos
    function createTechEffectElements() {
        if (!toolShowcaseContent) return;
        
        // Overlay de transição
        const techOverlay = document.createElement('div');
        techOverlay.className = 'tech-transition-overlay';
        toolShowcaseContent.appendChild(techOverlay);
        
        // Efeito holográfico
        const holographicEffect = document.createElement('div');
        holographicEffect.className = 'holographic-effect';
        toolShowcaseContent.appendChild(holographicEffect);
        
        // Efeito de matriz removido
        
        // Pulso de energia
        const energyPulse = document.createElement('div');
        energyPulse.className = 'energy-pulse';
        toolShowcaseContent.appendChild(energyPulse);
        
        // Container de partículas
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'floating-particles';
        toolShowcaseContent.appendChild(particlesContainer);
    }
    
    // Efeitos específicos
    function triggerHolographicScan() {
        const holographicEffect = toolShowcaseContent?.querySelector('.holographic-effect');
        if (holographicEffect) {
            holographicEffect.classList.add('scanning');
            setTimeout(() => {
                holographicEffect.classList.remove('scanning');
            }, 1500);
        }
    }
    
    // Função de matriz removida
    
    function triggerEnergyPulse() {
        const energyPulse = toolShowcaseContent?.querySelector('.energy-pulse');
        if (energyPulse) {
            energyPulse.classList.add('pulsing');
            setTimeout(() => {
                energyPulse.classList.remove('pulsing');
            }, 1000);
        }
    }
    
    function triggerFloatingParticles() {
        const particlesContainer = toolShowcaseContent?.querySelector('.floating-particles');
        if (!particlesContainer) return;
        
        // Limpar partículas existentes
        particlesContainer.innerHTML = '';
        
        // Criar novas partículas
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 2}s`;
            particle.style.animationDuration = `${4 + Math.random() * 2}s`;
            particlesContainer.appendChild(particle);
        }
        
        // Remover partículas após animação
        setTimeout(() => {
            particlesContainer.innerHTML = '';
        }, 6000);
    }
    
    // Animações específicas de cada ferramenta
    function animateToolSpecificContent(targetTool) {
        setTimeout(() => {
            switch(targetTool) {
                case 'market-tracker':
                    animateChartBars();
                    break;
                case 'stock-ranking':
                    animateRanking();
                    break;
                case 'community':
                    animateCommunityMessages();
                    break;
                case 'analysis':
                animateAnalysisItems();
                    break;
            }
            }, 300);
        }
    
    // Sistema de sons tecnológicos (opcional)
    function playTechSound(type) {
        // Verificar se o usuário permite áudio
        if (!window.audioEnabled) return;
        
        try {
            // Criar contexto de áudio se não existir
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = window.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Configurar sons diferentes para cada tipo
            switch(type) {
                case 'scan':
                    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.15);
                    break;
                    
                case 'switch':
                    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.1);
                    break;
                    
                case 'energy':
                    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.25);
                    break;
            }
        } catch (error) {
            // Silenciosamente ignorar erros de áudio
            console.debug('Audio not available');
        }
    }
    
    // Feedback háptico (vibração em dispositivos móveis)
    function triggerHapticFeedback(type = 'light') {
        if (navigator.vibrate) {
            switch(type) {
                case 'light':
                    navigator.vibrate(50);
                    break;
                case 'medium':
                    navigator.vibrate([50, 30, 50]);
                    break;
                case 'strong':
                    navigator.vibrate([100, 50, 100]);
                    break;
            }
        }
    }
    
    // Aprimorar função de transição com sons e haptic
    function startTechTransitionEnhanced(currentContent, targetContent, navItem, targetTool) {
        // Sons tecnológicos
        playTechSound('scan');
        triggerHapticFeedback('light');
        
        // Iniciar transição normal
        startTechTransition(currentContent, targetContent, navItem, targetTool);
        
        // Sons adicionais durante a transição
        setTimeout(() => playTechSound('switch'), 300);
        setTimeout(() => playTechSound('energy'), 600);
        setTimeout(() => triggerHapticFeedback('medium'), 800);
    }
    
    // Adicionar event listeners aos itens de navegação
    toolNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTool = this.getAttribute('data-tool');
            switchTool(targetTool);
        });
        
        // Adicionar suporte para navegação por teclado
        item.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetTool = this.getAttribute('data-tool');
                switchTool(targetTool);
            }
        });
        
        // Tornar focável para acessibilidade
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
    });
    
    // Navegação por setas do teclado
    document.addEventListener('keydown', function(e) {
        const activeNavItem = document.querySelector('.tool-nav-item.active');
        if (!activeNavItem) return;
        
        let targetItem = null;
        
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            targetItem = activeNavItem.nextElementSibling;
            if (!targetItem) {
                targetItem = document.querySelector('.tool-nav-item:first-child');
            }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            targetItem = activeNavItem.previousElementSibling;
            if (!targetItem) {
                targetItem = document.querySelector('.tool-nav-item:last-child');
            }
        }
        
        if (targetItem) {
            const targetTool = targetItem.getAttribute('data-tool');
            switchTool(targetTool);
            targetItem.focus();
        }
    });
    
    // Auto-switch das ferramentas (opcional - pode ser ativado posteriormente)
    let autoSwitchInterval = null;
    
    function startAutoSwitch() {
        if (autoSwitchInterval) return;
        
        autoSwitchInterval = setInterval(() => {
            const currentActive = document.querySelector('.tool-nav-item.active');
            const nextItem = currentActive.nextElementSibling || document.querySelector('.tool-nav-item:first-child');
            const targetTool = nextItem.getAttribute('data-tool');
            switchTool(targetTool);
        }, 8000); // Trocar a cada 8 segundos
    }
    
    function stopAutoSwitch() {
        if (autoSwitchInterval) {
            clearInterval(autoSwitchInterval);
            autoSwitchInterval = null;
        }
    }
    
    // Parar auto-switch quando o usuário interagir
    toolNavItems.forEach(item => {
        item.addEventListener('click', stopAutoSwitch);
        item.addEventListener('mouseenter', stopAutoSwitch);
    });
    
    // Função para animar as barras do gráfico
    function animateChartBars() {
        const chartBars = document.querySelectorAll('.chart-bar');
        chartBars.forEach((bar, index) => {
            bar.style.height = '0%';
            setTimeout(() => {
                const originalHeight = bar.getAttribute('style').match(/height:\s*(\d+%)/);
                if (originalHeight) {
                    bar.style.height = originalHeight[1];
                }
            }, index * 100);
        });
    }
    
    // Função para animar o ranking
    function animateRanking() {
        const rankingItems = document.querySelectorAll('.ranking-item');
        rankingItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 150);
        });
    }
    
    // Função para animar mensagens da comunidade
    function animateCommunityMessages() {
        const messages = document.querySelectorAll('.message-item');
        messages.forEach((message, index) => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(10px)';
            setTimeout(() => {
                message.style.opacity = '1';
                message.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }
    
    // Função para animar itens de análise
    function animateAnalysisItems() {
        const analysisItems = document.querySelectorAll('.analysis-item');
        analysisItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(15px)';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    // Inicializar animação para a ferramenta ativa inicial
    setTimeout(() => {
        const initialActive = document.querySelector('.tool-content.active');
        if (initialActive) {
            const toolId = initialActive.id;
            if (toolId === 'market-tracker') {
                animateChartBars();
            }
        }
    }, 500);
    
    // Adicionar efeitos de hover melhorados para navegação
    toolNavItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(5px)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(0)';
            }
        });
    });
    
    // Observador para animar elementos quando entram na viewport
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };
    
    const showcaseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const showcase = entry.target;
                showcase.classList.add('animate-in');
                
                // Animar itens de navegação sequencialmente
                const navItems = showcase.querySelectorAll('.tool-nav-item');
                navItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateX(0)';
                    }, index * 100);
                });
                
                showcaseObserver.unobserve(showcase);
            }
        });
    }, observerOptions);
    
    // Observar a showcase
    const toolsShowcase = document.querySelector('.tools-showcase');
    if (toolsShowcase) {
        // Inicializar estado dos elementos para animação
        const navItems = toolsShowcase.querySelectorAll('.tool-nav-item');
        navItems.forEach(item => {
            if (!item.classList.contains('active')) {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                item.style.transition = 'all 0.3s ease';
            }
        });
        
        showcaseObserver.observe(toolsShowcase);
    }
}