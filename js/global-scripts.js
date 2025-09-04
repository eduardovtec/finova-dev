// Importações do Firebase
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBO4CP72fLukRb7uoJYvBZcPwkWX2SDStI",
    authDomain: "finova-79ba8.firebaseapp.com",
    databaseURL: "https://finova-79ba8-default-rtdb.firebaseio.com",
    projectId: "finova-79ba8",
    storageBucket: "finova-79ba8.firebasestorage.app",
    messagingSenderId: "548738701228",
    appId: "1:548738701228:web:208157d42335aab9070c09",
    measurementId: "G-2M58GXVBHC"
};

// Inicialização do Firebase
let app;
try {
    app = getApp();
} catch (e) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Elementos do DOM
let userMenuTrigger;
let userMenuContent;
let navProfilePhoto;
let userEmailDisplay;
let logoutButton;
let toggleSidebar;
let sidebar;

// Função para atualizar a UI do usuário
function updateUserUI(user, profileData = null) {
    if (!user) {
        // Usuário não está logado
        if (navProfilePhoto) navProfilePhoto.src = "https://i.imgur.com/8RKXAQS.png";
        if (userEmailDisplay) userEmailDisplay.textContent = "Usuário";
        // Limpa saudação do dashboard se existir
        const dashboardGreeting = document.getElementById('dashboardUserGreeting');
        if (dashboardGreeting) dashboardGreeting.textContent = '';
        return;
    }

    // Atualizar foto de perfil
    const photoUrl = profileData?.photoUrl || user.photoURL || "https://i.imgur.com/8RKXAQS.png";
    if (navProfilePhoto) navProfilePhoto.src = photoUrl;

    // Abreviar nome: Primeiro Nome + Primeira letra do segundo nome
    let displayName = profileData?.name || user.displayName || user.email.split('@')[0];
    let primeiroNome = displayName;
    if (displayName && displayName.includes(' ')) {
        const partes = displayName.trim().split(' ');
        displayName = partes[0] + (partes[1] ? ' ' + partes[1][0] + '.' : '');
        primeiroNome = partes[0];
    }
    if (userEmailDisplay) userEmailDisplay.textContent = displayName;

    // Saudação no dashboard
    const dashboardGreeting = document.getElementById('dashboardUserGreeting');
    if (dashboardGreeting) {
        dashboardGreeting.textContent = `Olá, ${primeiroNome}!`;
    }
}

// Função para configurar o menu do usuário
function setupUserMenu() {
    userMenuTrigger = document.getElementById('userMenuTrigger');
    userMenuContent = document.getElementById('userMenuContent');
    navProfilePhoto = document.getElementById('navProfilePhoto');
    userEmailDisplay = document.getElementById('userEmailDisplay');
    logoutButton = document.getElementById('logoutButton');
    toggleSidebar = document.getElementById('toggleSidebar');
    sidebar = document.getElementById('sidebar');

    if (userMenuTrigger && userMenuContent) {
        // Toggle do menu ao clicar no trigger
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuContent.classList.toggle('show');
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenuTrigger.contains(e.target) && !userMenuContent.contains(e.target)) {
                userMenuContent.classList.remove('show');
            }
        });
    }

    // Configurar botão de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }

    // Configurar toggle da sidebar
    if (toggleSidebar && sidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

// Listener para mudanças no estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Se não estiver na página de login, redirecionar
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Se estiver na página de login e o usuário estiver autenticado, redirecionar para o dashboard
    if (window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Configurar menu do usuário
    setupUserMenu();

    // Atualizar UI inicial com dados do usuário
    updateUserUI(user);

    // Observar mudanças no perfil do usuário
    const userProfileRef = doc(db, 'userProfiles', user.uid);
    onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
            updateUserUI(user, doc.data());
        }
    }, (error) => {
        showFirestoreError(error);
    });
});

function showFirestoreError(error) {
    console.error('Erro ao acessar o Firestore:', error);
    if (typeof showStyledMessage === 'function') {
        showStyledMessage('Erro ao acessar dados do servidor. Tente novamente mais tarde.', 'error');
    }
}

// Exportar funções necessárias
export { updateUserUI, setupUserMenu };

// --- LÓGICA PARA STOCK-RANKING ---
if (window.location.pathname.includes('stock-ranking.html')) {
    // Adiciona PapaParse dinamicamente se não existir
    if (typeof Papa === 'undefined') {
        const papaScript = document.createElement('script');
        papaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
        papaScript.onload = initStockRanking;
        document.head.appendChild(papaScript);
    } else {
        initStockRanking();
    }

    function initStockRanking() {
        const csvPath = 'data/ranking.csv';
        Papa.parse(csvPath, {
            download: true,
            header: true,
            complete: function(results) {
                const data = results.data.filter(row => row.Ticker && row.Ticker.trim() !== '');
                window._originalRankingData = data; // Salva para uso global
                renderRankingTable(data);
                setupOrdering(data);
                setupTableHeaderOrdering();
            },
            error: function(err) {
                alert('Erro ao carregar ranking.csv: ' + err);
            }
        });
    }

    // Estado global de ordenação
    let currentSort = { column: 'score', direction: 'desc' };

    function renderRankingTable(data) {
        const tbody = document.querySelector('.ranking-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Mapeamento de informações das empresas
        const infoEmpresas = {
            'LEVE3': {
                setor: 'Indústria',
                segmento: 'Automóveis e Motocicletas',
                resumo: 'É uma empresa que se dedica à fabricação e comercialização de componentes de motores de combustão interna e filtros automotivos. A empresa atende diretamente as montadoras de automóveis e também o mercado de peças de reposição.'
            },
            'KEPL3': {
                setor: 'Bens industriais',
                segmento: 'Maq. e Equip. Industriais',
                resumo: 'A empresa está focada na área de armazenagem e pós-colheita agrícola, com destaque para a liderança na América Latina em sistemas de armazenamento.'
            },
            'FRAS3': {
                setor: 'Bens Industriais',
                segmento: 'Material Rodoviário',
                resumo: 'A Fras-le é uma empresa global especializada na fabricação de materiais de fricção, como pastilhas e lonas de freio, atendendo aos setores automotivo, ferroviário e aeronáutico. Com presença em mais de 125 países, a empresa investe continuamente em tecnologia para garantir a máxima segurança a seus clientes.'
            },
            'CPFE3': {
                setor: 'Utilidade Pública',
                segmento: 'Energia Elétrica',
                resumo: 'A CPFL Energia é uma das maiores empresas do setor elétrico brasileiro, atuando na geração, transmissão, distribuição e comercialização de energia elétrica. Com presença significativa no mercado, a empresa atende a milhões de consumidores em diversos estados do Brasil.'
            },
            'CMIG4': {
                setor: 'Utilidade Pública',
                segmento: 'Energia Elétrica',
                resumo: 'A Cemig é uma das principais companhias do setor elétrico brasileiro, atuando na geração, transmissão, distribuição e comercialização de energia elétrica. Sendo a responsável pela distribuição de energia do estado de Minas Gerais.'
            },
            'UGPA3': {
                setor: 'Petróleo, Gás e Biocombustíveis',
                segmento: 'Exploração, Refino e Distribuição',
                resumo: 'A Ultrapar é um conglomerado brasileiro que atua nos setores de distribuição de combustíveis, produção de químicos e varejo farmacêutico. Controla empresas como Ipiranga, Ultragaz e Extrafarma, com presença significativa no mercado nacional.'
            },
            'ITUB3': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'O Itaú Unibanco é o maior banco privado do Brasil, oferecendo uma ampla gama de serviços financeiros, incluindo contas correntes, cartões de crédito, investimentos e financiamentos. Com uma sólida presença nacional e internacional, atende a diversos segmentos de clientes.'
            },
            'VIVA3': {
                setor: 'Consumo cíclico',
                segmento: 'Acessórios',
                resumo: 'A Vivara é uma renomada joalheria brasileira com modelo de negócios verticalizado, atuando desde a criação e design até a produção e comercialização de joias. A empresa fabrica cerca de 80% dos produtos vendidos em suas lojas, garantindo qualidade e exclusividade.'
            },
            'MULT3': {
                setor: 'Financeiro',
                segmento: 'Exploração de Imovéis',
                resumo: 'A Multiplan é uma das principais empresas de shopping centers do Brasil, atuando no desenvolvimento, administração e comercialização de empreendimentos comerciais. Possui um portfólio diversificado de shoppings em várias regiões do país.'
            },
            'WEGE3': {
                setor: 'Bens Industriais',
                segmento: 'Motores, Compressores e Outros',
                resumo: 'A WEG é uma multinacional brasileira que atua na fabricação e comercialização de motores elétricos, transformadores, geradores e tintas. A empresa oferece soluções para automação industrial e energia renovável, como turbinas eólicas e painéis solares.'
            },
            'TAEE11': {
                setor: 'Utilidade Pública',
                segmento: 'Energia Elétrica',
                resumo: 'A Taesa é uma das maiores empresas de transmissão de energia elétrica do Brasil, operando diversas concessões em todo o país. Focada em eficiência operacional, a empresa desempenha papel crucial na infraestrutura energética nacional.'
            },
            'JSLG3': {
                setor: 'Bens Industriais',
                segmento: 'Transporte Rodoviário',
                resumo: 'A JSL é uma empresa brasileira de logística que oferece soluções integradas, incluindo transporte rodoviário, gestão de frotas e serviços logísticos. Atende a diversos setores da economia, buscando eficiência e inovação em seus serviços.'
            },
            'JBSS3': {
                setor: 'Consumo não Cíclico',
                segmento: 'Carnes e Derivados',
                resumo: 'A JBS é uma das maiores empresas de alimentos do mundo, com foco na produção e comercialização de carnes bovina, suína e de frango. A empresa também atua em alimentos processados e possui presença global, exportando para diversos países.'
            },
            'ABEV3': {
                setor: 'Consumo não Cíclico',
                segmento: 'Cervejas e Refrigerantes',
                resumo: 'A Ambev é uma das maiores cervejarias do mundo, produzindo e comercializando bebidas alcoólicas e não alcoólicas. Com marcas reconhecidas, a empresa possui ampla presença no mercado brasileiro e internacional.'
            },
            'VULC3': {
                setor: 'Consumo Cíclico',
                segmento: 'Calçados',
                resumo: 'A Vulcabras é uma das maiores fabricantes de calçados esportivos do Brasil, detentora de marcas como Olympikus e Under Armour. A empresa foca em inovação e tecnologia para oferecer produtos de alta performance.'
            },
            'CURY3': {
                setor: 'Consumo Cíclico',
                segmento: 'Incorporações',
                resumo: 'A Cury Construtora é uma empresa do setor imobiliário brasileiro, especializada no desenvolvimento de empreendimentos residenciais populares e de médio padrão. Atua principalmente nas regiões metropolitanas de São Paulo e Rio de Janeiro.'
            },
            'SBSP3': {
                setor: 'Utilidade Pública',
                segmento: 'Saneamento Básico',
                resumo: 'A Sabesp é uma das maiores empresas de saneamento do mundo, responsável pela prestação de serviços de abastecimento de água e tratamento de esgoto em São Paulo. A empresa busca constantemente soluções inovadoras e sustentáveis para melhorar a qualidade de vida da população.'
            },
            'EGIE3': {
                setor: 'Utilidade Pública',
                segmento: 'Energia Elétrica',
                resumo: 'A Engie Brasil é uma das maiores geradoras privadas de energia elétrica do país, com foco em fontes renováveis como hidrelétricas, eólicas e solares. A empresa busca contribuir para a transição energética e desenvolvimento sustentável.'
            },
            'VLID3': {
                setor: 'Bens Industriais',
                segmento: 'Serviços Diversos',
                resumo: 'A Valid é uma empresa brasileira que oferece soluções em identificação, meios de pagamento e certificação digital. Atua em diversos países, fornecendo produtos e serviços que garantem segurança e confiabilidade em transações e documentos.'
            },
            'TGMA3': {
                setor: 'Bens Industriais',
                segmento: 'Transporte Rodoviário',
                resumo: 'A Tegma é uma das principais empresas de logística integrada do Brasil, especializada no transporte de veículos e gestão de cadeias logísticas complexas. Atua em diversos segmentos, oferecendo soluções eficientes e seguras.'
            },
            'POMO4': {
                setor: 'Bens Industriais',
                segmento: 'Material Rodoviário',
                resumo: 'A Marcopolo é uma das maiores fabricantes de carrocerias de ônibus do mundo, com presença em diversos países. A empresa busca constantemente inovação e qualidade em seus produtos, atendendo ao mercado nacional e internacional.'
            },
            'PLPL3': {
                setor: 'Consumo Cíclico',
                segmento: 'Construção Civil',
                resumo: 'A Plano & Plano atua no desenvolvimento de empreendimentos imobiliários populares, com foco na cidade de São Paulo e no programa Minha Casa Minha Vida. A empresa é conhecida pela verticalização da produção, desde a incorporação até a entrega do imóvel.'
            },
            'BBSE3': {
                setor: 'Financeiro',
                segmento: 'Seguradoras',
                resumo: 'Holding que centraliza os negócios de seguros, previdência e capitalização do Banco do Brasil. Atua por meio de parcerias como a Brasilseg (seguros) e a Brasilprev (previdência), sendo uma das líderes do setor no país.'
            },
            'TTEN3': {
                setor: 'Agropecuária',
                segmento: 'Produção agrícola e distribuição de insumos',
                resumo: 'Empresa verticalizada do agronegócio, com atuação desde a venda de insumos até a industrialização de grãos e produção de biodiesel. Tem forte presença no Sul do Brasil, especialmente no Rio Grande do Sul.'
            },
            'ABCB4': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'Banco focado em crédito corporativo para empresas de médio e grande porte. Também atua em câmbio, serviços de tesouraria e banco de investimento, com perfil mais conservador e carteira de clientes corporativos.'
            },
            'ITUB4': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'Maior banco privado do Brasil, com ampla atuação em serviços bancários, seguros e gestão de recursos. Tem forte presença nacional e internacional, sendo referência em inovação e eficiência no setor financeiro.'
            },
            'SANB11': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'Braço brasileiro do grupo espanhol Santander, oferece serviços financeiros completos a pessoas físicas e jurídicas. É um dos principais bancos do país, com forte atuação em crédito e meios de pagamento.'
            },
            'ASAI3': {
                setor: 'Consumo não cíclico',
                segmento: 'Comércio (Alimentos)',
                resumo: 'Rede de atacarejo voltada a pequenos comerciantes e consumidores finais. Após se desmembrar do Grupo Pão de Açúcar, expandiu fortemente sua atuação nacional, focando em preços baixos e alto volume de vendas.'
            },
            'BBAS3': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'Banco estatal com forte presença em todo o território nacional, oferecendo crédito, seguros, investimentos e produtos bancários. Atua tanto no varejo quanto no atacado, com posição sólida no mercado agrícola.'
            },
            'B3SA3': {
                setor: 'Financeiro',
                segmento: 'Serviços Financeiros Diversos',
                resumo: 'Responsável pela operação da bolsa de valores brasileira, a B3 atua em negociação de ações, derivativos, renda fixa e serviços de infraestrutura para o mercado financeiro. É um monopólio natural no setor.'
            },
            'BPAC11': {
                setor: 'Financeiro',
                segmento: 'Bancos',
                resumo: 'Maior banco de investimentos da América Latina, com foco em gestão de ativos, wealth management, corporate banking e digital banking. Tem expandido sua atuação no varejo com a plataforma BTG Pactual digital.'
            },
        };

        data.forEach((row, idx) => {
            // Extrai o código do ticker do final do nome, ex: (BVMF:WEGE3)
            let tickerCode = '';
            const match = row.Ticker.match(/\((?:BVMF:)?([A-Z0-9]+)\)/);
            if (match) tickerCode = match[1];
            // Nome da empresa é o texto antes do parêntese
            const nomeEmpresa = row.Ticker.split(' (')[0];
            // Imagem: pega as letras e números até encontrar um número seguido de letra (ex: B3SA3 -> B3SA)
            const tickerImg = tickerCode ? (tickerCode.match(/^[A-Za-z0-9]+/) ? tickerCode.match(/^[A-Za-z0-9]+/)[0].replace(/\d+$/, '') : tickerCode) : '';
            // Preço
            let preco = row['Preco Acao'] ? row['Preco Acao'].replace(',', '.').replace(/[^0-9.]/g, '') : '';
            preco = preco ? parseFloat(preco) : NaN;
            // Score
            let score = row['Score G.V'] ? row['Score G.V'].replace('%', '').replace(',', '.').trim() : '';
            score = score ? parseFloat(score) : '';
            // Setor, Segmento e Resumo
            let setor = row['Setor'] || 'Não informado';
            let segmento = row['Segmento'] || '';
            let resumo = '';
            if (infoEmpresas[tickerCode]) {
                setor = infoEmpresas[tickerCode].setor;
                segmento = infoEmpresas[tickerCode].segmento;
                resumo = infoEmpresas[tickerCode].resumo;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>
                    <div class="stock-tooltip">
                        <div class="stock-name">
                            <img src="Images/${tickerImg}.png" alt="${tickerCode}" class="stock-logo" onerror="this.onerror=null; this.src='Images/default.png'; this.alt='Logo não encontrada'">
                            <div>
                                <div><strong>${tickerCode}</strong></div>
                                <small>${nomeEmpresa}</small>
                            </div>
                        </div>
                        <div class="tooltip-content">
                            <div class="tooltip-header">
                                <img src="Images/${tickerImg}.png" alt="${tickerCode}" onerror="this.onerror=null; this.src='Images/default.png';">
                                <div class="tooltip-header-info">
                                    <h3>${nomeEmpresa}</h3>
                                    <p>${tickerCode} | B3</p>
                                </div>
                            </div>
                            <div class="tooltip-details" style="margin-top: 22px;">
                                <p><strong>Setor:</strong> ${setor}</p>
                                ${segmento ? `<p><strong>Segmento:</strong> ${segmento}</p>` : ''}
                                ${resumo ? `<div style='margin-top: 16px;'><strong>Resumo:</strong> <span style='color:#444;'>${resumo}</span></div>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>R$ ${isNaN(preco) ? '-' : preco.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${score !== '' ? score : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        updateSortIcons();
    }

    function sortData(data, column, direction) {
        let sorted = [...data];
        if (column === 'score') {
            sorted.sort((a, b) => {
                let sa = parseFloat((a['Score G.V']||'').replace('%','').replace(',','.')) || 0;
                let sb = parseFloat((b['Score G.V']||'').replace('%','').replace(',','.')) || 0;
                return direction === 'asc' ? sa - sb : sb - sa;
            });
        } else if (column === 'ticker') {
            sorted.sort((a, b) => {
                let ta = (a.Ticker||'').toUpperCase();
                let tb = (b.Ticker||'').toUpperCase();
                return direction === 'asc' ? ta.localeCompare(tb) : tb.localeCompare(ta);
            });
        } else if (column === 'preco') {
            sorted.sort((a, b) => {
                let pa = parseFloat((a['Preco Acao']||'').replace(',','.').replace(/[^0-9.]/g, '')) || 0;
                let pb = parseFloat((b['Preco Acao']||'').replace(',','.').replace(/[^0-9.]/g, '')) || 0;
                return direction === 'asc' ? pa - pb : pb - pa;
            });
        }
        return sorted;
    }

    function setupOrdering(originalData) {
        const select = document.querySelector('.filters .form-select');
        if (!select) return;
        select.addEventListener('change', function() {
            let value = select.value;
            let column = 'score', direction = 'desc';
            if (value.startsWith('score')) {
                column = 'score';
                direction = value.endsWith('asc') ? 'asc' : 'desc';
            } else if (value.startsWith('name')) {
                column = 'ticker';
                direction = value.endsWith('asc') ? 'asc' : 'desc';
            } else if (value.startsWith('price')) {
                column = 'preco';
                direction = value.endsWith('asc') ? 'asc' : 'desc';
            }
            currentSort = { column, direction };
            const sorted = sortData(originalData, column, direction);
            renderRankingTable(sorted);
        });
    }

    function setupTableHeaderOrdering() {
        const thTicker = document.getElementById('th-ticker');
        const thPreco = document.getElementById('th-preco');
        const thScore = document.getElementById('th-score');
        const data = window._originalRankingData || [];
        if (thTicker) {
            thTicker.addEventListener('click', function() {
                let dir = (currentSort.column === 'ticker' && currentSort.direction === 'asc') ? 'desc' : 'asc';
                currentSort = { column: 'ticker', direction: dir };
                const sorted = sortData(data, 'ticker', dir);
                renderRankingTable(sorted);
            });
        }
        if (thPreco) {
            thPreco.addEventListener('click', function() {
                let dir = (currentSort.column === 'preco' && currentSort.direction === 'asc') ? 'desc' : 'asc';
                currentSort = { column: 'preco', direction: dir };
                const sorted = sortData(data, 'preco', dir);
                renderRankingTable(sorted);
            });
        }
        if (thScore) {
            thScore.addEventListener('click', function() {
                let dir = (currentSort.column === 'score' && currentSort.direction === 'asc') ? 'desc' : 'asc';
                currentSort = { column: 'score', direction: dir };
                const sorted = sortData(data, 'score', dir);
                renderRankingTable(sorted);
            });
        }
    }

    function updateSortIcons() {
        const ths = [
            { el: document.getElementById('th-ticker'), col: 'ticker' },
            { el: document.getElementById('th-preco'), col: 'preco' },
            { el: document.getElementById('th-score'), col: 'score' }
        ];
        ths.forEach(({el, col}) => {
            if (!el) return;
            const icon = el.querySelector('i');
            if (!icon) return;
            icon.className = 'fa';
            if (currentSort.column === col) {
                icon.classList.add(currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
            } else {
                icon.classList.add('fa-sort');
            }
        });
    }
}

// Variável global para armazenar os dados do Momento de Mercado
let marketMomentoData = null;

// Função utilitária para normalizar datas para yyyy-mm-dd
function normalizaDataParaISO(dateStr) {
    if (!dateStr) return '';
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // M/D/YYYY (formato dos arquivos CSV)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
}

// Função utilitária para extrair mês/ano de uma data (retorna MM/YYYY)
function extraiMesAno(dateStr) {
    if (!dateStr) return '';
    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [yyyy, mm] = dateStr.split('-');
        return `${mm}/${yyyy}`;
    }
    // M/D/YYYY ou MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [mm, , yyyy] = dateStr.split('/');
        return `${mm.padStart(2, '0')}/${yyyy}`;
    }
    // dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [, mm, yyyy] = dateStr.split('/');
        return `${mm}/${yyyy}`;
    }
    return dateStr;
}

// Modificar fetchAndParseCSV para também armazenar os dados do Momento de Mercado
function fetchAndParseCSV(marketType, callback) {
    if (marketType !== 'ibov') {
        console.log('Tentativa de carregar mercado diferente de Ibovespa ignorada.');
        return;
    }
    const filePath = 'data/market-tracker.csv';
    Papa.parse(filePath, {
        download: true,
        header: true,
        complete: function(results) {
            csvData = results.data;
            marketMomentoData = results.data; // Salva para uso global
            callback();
            updateFromPeriod();
            drawSelectedPeriodChart();
            updateMobileMomento();
            fetchAndParseIndexCSV('ibov', () => {
                updateLastUpdateLabel();
            });
        },
        error: function(err) {
            alert(`Erro ao carregar o CSV do Mercado Brasileiro: ${err}`);
        }
    });
}

// Modificar fetchAndParseIndexCSV para passar os dados do Momento de Mercado para drawIndexChart
function fetchAndParseIndexCSV(indexType, callback) {
    if (indexType !== 'ibov') {
        console.log('Tentativa de carregar índice diferente de Ibovespa ignorada.');
        if (indexChartInstance) {
            indexChartInstance.destroy();
            indexChartInstance = null;
        }
        if (callback) callback();
        return;
    }
    const filePath = 'data/ibov.csv';
    Papa.parse(filePath, {
        download: true,
        header: true,
        complete: function(results) {
            const indexData = results.data;
            drawIndexChart(indexData, indexType, marketMomentoData); // Passa os dados do Momento de Mercado
            if (callback) callback();
        },
        error: function(err) {
            alert(`Erro ao carregar o CSV do Ibovespa: ${err}`);
        }
    });
}

// Adicione variáveis globais para controle do preview e botão do Ibovespa
window._chartIbovMobileData = null;

// Função para criar o preview do gráfico de evolução do Ibovespa no mobile
function createIbovPreviewMobile(xLabels, yValues) {
    const canvas = document.getElementById('chartIbovPreviewMobile');
    const btn = document.getElementById('btnShowFullIbovChart');
    if (!canvas) return;
    if (window.chartIbovPreviewMobileInstance) {
        window.chartIbovPreviewMobileInstance.destroy();
        window.chartIbovPreviewMobileInstance = null;
    }
    if (!xLabels || !yValues || yValues.length === 0) {
        canvas.style.display = 'none';
        if (btn) btn.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    if (btn) btn.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 320;
    canvas.height = 120;
    const gradientLine = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');
    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            z: 10
        }]
    };
    const options = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: 9 }, maxTicksLimit: 3 }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 8 },
                    autoSkip: true,
                    maxTicksLimit: 4,
                    callback: function() { return ''; }
                }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };
    window.chartIbovPreviewMobileInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Função para criar o gráfico completo do Ibovespa no modal mobile
function createIbovFullMobile(xLabels, yValues) {
    const canvas = document.getElementById('chartIbovFullMobile');
    if (!canvas) return;
    if (window.chartIbovFullMobileInstance) {
        window.chartIbovFullMobileInstance.destroy();
        window.chartIbovFullMobileInstance = null;
    }
    canvas.width = window.innerHeight * 0.92;
    canvas.height = window.innerWidth * 0.60;
    if (window.innerWidth > window.innerHeight) {
        canvas.width = window.innerWidth * 0.98;
        canvas.height = window.innerHeight * 0.60;
    }
    const ctx = canvas.getContext('2d');
    const gradientLine = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');
    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.35,
            z: 10
        }]
    };
    const options = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: 12 }, maxTicksLimit: 5 }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 10 },
                    autoSkip: true,
                    maxTicksLimit: 8
                }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
    };
    window.chartIbovFullMobileInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Função para abrir o modal do Ibovespa
function openFullIbovChartModal(xLabels, yValues) {
    const modal = document.getElementById('modalFullIbovChart');
    if (!modal) return;
    modal.style.display = 'flex';
    createIbovFullMobile(xLabels, yValues);
}

// Função para fechar o modal do Ibovespa
function closeFullIbovChartModal() {
    const modal = document.getElementById('modalFullIbovChart');
    if (!modal) return;
    modal.style.display = 'none';
    if (window.chartIbovFullMobileInstance) {
        window.chartIbovFullMobileInstance.destroy();
        window.chartIbovFullMobileInstance = null;
    }
}

// Evento dos botões do Ibovespa
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('btnShowFullIbovChart');
        const btnClose = document.getElementById('btnCloseFullIbovChart');
        if (btn) {
            btn.addEventListener('click', function() {
                if (window._chartIbovMobileData) {
                    openFullIbovChartModal(window._chartIbovMobileData.xLabels, window._chartIbovMobileData.yValues);
                }
            });
        }
        if (btnClose) {
            btnClose.addEventListener('click', function() {
                closeFullIbovChartModal();
            });
        }
    });
}

// Modificar drawIndexChart para mostrar preview no mobile
function drawIndexChart(indexData, indexType, momentoData) {
    const ctx = document.getElementById('chartIndex').getContext('2d');
    if (indexChartInstance) {
        indexChartInstance.destroy();
        indexChartInstance = null;
    }

    // Responsividade mobile
    const isMobile = window.innerWidth <= 768;
    const canvas = ctx.canvas;
    const parent = canvas.parentElement;
    
    // Ajustar altura do canvas mantendo proporção
    if (isMobile) {
        // Em mobile, usar altura fixa mas manter proporção
        canvas.style.height = '300px';
        canvas.style.width = '100%';
        // Garantir que o container pai tenha altura adequada
        parent.style.height = '300px';
        parent.style.width = '100%';
    } else {
        // Em desktop, usar altura máxima definida
        canvas.style.height = '';
        canvas.style.width = '';
        parent.style.height = '';
        parent.style.width = '';
    }

    const xLabels = [];
    const yValues = [];
    const pontosVerdes = [];

    // --- Calcular médias ponderadas do Momento de Mercado por data normalizada ---
    let momentoMap = {};
    if (momentoData) {
        const periodos = [
            { col: '21', peso: 1 },
            { col: '62', peso: 2 },
            { col: '125', peso: 3 },
            { col: '252', peso: 4 }
        ];
        momentoData.forEach(row => {
            const date = row['date'] || row['Date'] || row['DATA'] || row['data'];
            if (!date) return;
            const dateISO = normalizaDataParaISO(date);
            let somaPonderada = 0, somaPesos = 0;
            periodos.forEach(({ col, peso }) => {
                const v = row[col] || row[col.toUpperCase()] || row[col.toLowerCase()];
                if (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) {
                    somaPonderada += parseFloat(v) * peso;
                    somaPesos += peso;
                }
            });
            let media = somaPesos > 0 ? somaPonderada / somaPesos : null;
            if (media !== null && media <= 20) {
                momentoMap[dateISO] = true; // Marca apenas as datas que atendem ao critério
            }
        });
    }

    indexData.forEach((row, idx) => {
        const date = row['date'] || row['Date'] || row['DATA'] || row['data'];
        const value = row['valor'] || row['Valor'] || row['VALUE'] || row['value'];
        if (date && value && !isNaN(parseFloat(value))) {
            // Só mostra o ano se for janeiro
            let mesAno = extraiMesAno(date);
            if (mesAno && (mesAno.startsWith('01/') || mesAno.startsWith('1/'))) {
                const partes = mesAno.split('/');
                if (partes.length === 2) {
                    xLabels.push(partes[1]);
                } else {
                    xLabels.push('');
                }
            } else {
                xLabels.push('');
            }
            yValues.push(parseFloat(value));
            // --- Marca o ponto verde se a data está no mapa de datas válidas ---
            const dateISO = normalizaDataParaISO(date);
            if (momentoMap[dateISO]) {
                pontosVerdes.push({ x: mesAno, y: parseFloat(value) });
            }
        }
    });

    // Montar pontosVerdesArray do mesmo tamanho de yValues, preenchido com null
    const pontosVerdesArray = yValues.map(() => null);
    xLabels.forEach((label, idx) => {
        // label está no formato dd/mm/yyyy
        // Converter para yyyy-mm-dd para comparar com momentoMap
        const [dd, mm, yyyy] = label.split('/');
        const dateISO = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        if (momentoMap[dateISO]) {
            pontosVerdesArray[idx] = yValues[idx];
        }
    });
    // Log para depuração
    console.log('Pontos verdes (índices com valor):', pontosVerdesArray.map((v, i) => v !== null ? xLabels[i] : null).filter(v => v));

    const gradientLine = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');

    const chartData = {
        labels: xLabels,
        datasets: [
            {
                label: indexType === 'ibov' ? 'Ibovespa' : 'S&P 500',
                data: yValues,
                fill: false,
                borderColor: gradientLine,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.35
            },
            {
                label: 'Média Ponderada <= 20 (Momento de Mercado)',
                data: pontosVerdesArray,
                type: 'line',
                showLine: false,
                pointRadius: 8,
                pointBackgroundColor: 'rgba(0, 200, 83, 0.95)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                order: 2,
                z: 100,
                hoverBackgroundColor: 'rgba(0, 200, 83, 1)',
                hoverBorderColor: '#333',
                hoverBorderWidth: 2
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: 'easeOutQuart'
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: isMobile ? 10 : 12 } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: isMobile ? 9 : 11 },
                    autoSkip: true,
                    maxTicksLimit: isMobile ? 6 : 8,
                    callback: function(value, index, values) {
                        // Pega o label original
                        let label = this.getLabelForValue(value);
                        // Se for formato MM/YYYY ou M/YYYY
                        if (label && (label.startsWith('01/') || label.startsWith('1/'))) {
                            let partes = label.split('/');
                            if (partes.length === 2) {
                                return partes[1];
                            }
                        }
                        // Se for formato DD/MM/YYYY, mostra só o ano se for janeiro
                        if (label && label.length === 10) {
                            let partes = label.split('/');
                            if (partes.length === 3 && (partes[1] === '01' || partes[1] === '1')) {
                                return partes[2];
                            }
                        }
                        return '';
                    }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(33, 150, 243, 0.8)',
                borderWidth: 1,
                titleColor: '#333',
                bodyColor: '#666',
                bodyFont: { family: 'Poppins', size: isMobile ? 11 : 13 },
                padding: isMobile ? 8 : 10,
                cornerRadius: 6,
                displayColors: false
            },
            id: 'backgroundLogoIndex',
            beforeDraw: function(chart) {
                if (!chart.chartArea) return;
                const { ctx, chartArea } = chart;
                const { left, right, top, bottom } = chartArea;

                ctx.save();
                ctx.globalAlpha = 0.13;
                const logoRatio = logoImage.width / logoImage.height;
                let logoWidth = right - left - (isMobile ? 20 : 30);
                let logoHeight = logoWidth / logoRatio;
                if (logoHeight > (bottom - top - (isMobile ? 5 : 10))) {
                    logoHeight = bottom - top - (isMobile ? 5 : 10);
                    logoWidth = logoHeight * logoRatio;
                }
                const logoX = left + ((right - left) - logoWidth) / 2;
                const logoY = top + ((bottom - top) - logoHeight) / 2;
                ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
                ctx.globalAlpha = 1.0;
                ctx.restore();
            }
        }
    };

    // Log para depuração dos datasets
    console.log('Dataset do Ibovespa:', chartData.datasets);

    indexChartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });

    document.getElementById('indexTitle').textContent = indexType === 'ibov' ? ' Ibovespa' : ' S&P 500';

    if (window.innerWidth > 768) {
        // ... código original ...
    } else {
        // Mostrar apenas os últimos 20 pontos no preview
        const previewCount = 20;
        const previewY = yValues.slice(-previewCount);
        const previewX = xLabels.slice(-previewCount);
        createIbovPreviewMobile(previewX, previewY);
        window._chartIbovMobileData = { xLabels, yValues };
        // Garante que o botão e o canvas aparecem
        const btn = document.getElementById('btnShowFullIbovChart');
        const canvas = document.getElementById('chartIbovPreviewMobile');
        if (btn) btn.style.display = 'block';
        if (canvas) canvas.style.display = 'block';
        return; // Não desenha o gráfico completo no mobile direto
    }
}

function createOrUpdateChart(canvasId, seriesName, xLabels, yValues) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    // Destruir gráfico existente se houver
    if (canvasId === 'chartPeriod' && chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    } else if (canvasId === 'chartIndex' && indexChartInstance) {
        indexChartInstance.destroy();
        indexChartInstance = null;
    }

    // Responsividade mobile
    const isMobile = window.innerWidth <= 768;
    const canvas = ctx.canvas;
    const parent = canvas.parentElement;
    
    // Ajustar altura do canvas mantendo proporção
    if (isMobile) {
        // Em mobile, usar altura fixa mas manter proporção
        canvas.style.height = '300px';
        canvas.style.width = '100%';
        // Garantir que o container pai tenha altura adequada
        parent.style.height = '300px';
        parent.style.width = '100%';
    } else {
        // Em desktop, usar altura máxima definida
        canvas.style.height = '';
        canvas.style.width = '';
        parent.style.height = '';
        parent.style.width = '';
    }

    // Gradiente para a linha
    const gradientLine = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');

    // Calcular os índices do primeiro ponto de cada ano
    const primeirosAnos = {};
    xLabels.forEach((label, i) => {
        if (typeof label === 'string' && label.includes('/')) {
            const [,, year] = label.split('/');
            if (!(year in primeirosAnos)) {
                primeirosAnos[year] = i;
            }
        }
    });

    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.35,
            z: 10
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: 'easeOutQuart'
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: isMobile ? 10 : 12 } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: isMobile ? 9 : 11 },
                    autoSkip: true,
                    maxTicksLimit: isMobile ? 6 : 8,
                    callback: function(value, index, values) {
                        try {
                            const label = this.getLabelForValue(value);
                            if (typeof label === 'string' && label.includes('/')) {
                                const [,, year] = label.split('/');
                                if (primeirosAnos[year] === index) {
                                    return year;
                                }
                            }
                            return '';
                        } catch (error) {
                            console.error('Erro ao processar tick:', error);
                            return '';
                        }
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(33, 150, 243, 0.8)',
                borderWidth: 1,
                titleColor: '#333',
                bodyColor: '#666',
                bodyFont: { family: 'Poppins', size: isMobile ? 11 : 13 },
                padding: isMobile ? 8 : 10,
                cornerRadius: 6,
                displayColors: false
            }
        }
    };

    // Criar o gráfico
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options,
        plugins: [{
            id: 'backgroundZones',
            beforeDraw: function(chart) {
                if (!chart.chartArea) {
                    return;
                }
                const { ctx, chartArea, scales } = chart;
                const { top, bottom, left, right } = chartArea;
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.fillRect(left, top, right - left, bottom - top);
                ctx.globalAlpha = 0.2;
                const logoRatio = logoImage.width / logoImage.height;
                let logoWidth = right - left - 30;
                let logoHeight = logoWidth / logoRatio;
                if (logoHeight > (bottom - top - 10)) {
                    logoHeight = bottom - top - 10;
                    logoWidth = logoHeight * logoRatio;
                }
                const logoX = left + ((right - left) - logoWidth) / 2;
                const logoY = top + ((bottom - top) - logoHeight) / 2;
                ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
                ctx.restore();
            }
        }]
    });
    return chartInstance;
}

// Função para criar gráfico mobile
function createOrUpdateChartMobile(canvasId, seriesName, xLabels, yValues) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    // Destruir gráfico existente se houver
    if (window.chartInstanceMobile) {
        window.chartInstanceMobile.destroy();
        window.chartInstanceMobile = null;
    }
    // Configurações otimizadas para mobile
    const gradientLine = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');
    const primeirosAnos = {};
    xLabels.forEach((label, i) => {
        if (typeof label === 'string' && label.includes('/')) {
            const [,, year] = label.split('/');
            if (!(year in primeirosAnos)) {
                primeirosAnos[year] = i;
            }
        }
    });
    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.35,
            z: 10
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1200,
            easing: 'easeOutQuart'
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: 10 }, maxTicksLimit: 5 }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 9 },
                    autoSkip: true,
                    maxTicksLimit: 6,
                    callback: function(value, index, values) {
                        try {
                            const label = this.getLabelForValue(value);
                            if (typeof label === 'string' && label.includes('/')) {
                                const [,, year] = label.split('/');
                                if (primeirosAnos[year] === index) {
                                    return year;
                                }
                            }
                            return '';
                        } catch (error) {
                            return '';
                        }
                    }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(33, 150, 243, 0.8)',
                borderWidth: 1,
                titleColor: '#333',
                bodyColor: '#666',
                bodyFont: { family: 'Poppins', size: 11 },
                padding: 8,
                cornerRadius: 6,
                displayColors: false
            }
        }
    };
    window.chartInstanceMobile = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Função para criar o preview do gráfico de evolução no mobile (corrigida para mostrar/ocultar botão)
function createChartPeriodPreviewMobile(xLabels, yValues) {
    const canvas = document.getElementById('chartPeriodPreviewMobile');
    const btn = document.getElementById('btnShowFullChart');
    if (!canvas) return;
    if (window.chartPeriodPreviewMobileInstance) {
        window.chartPeriodPreviewMobileInstance.destroy();
        window.chartPeriodPreviewMobileInstance = null;
    }
    if (!xLabels || !yValues || yValues.length === 0) {
        canvas.style.display = 'none';
        if (btn) btn.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    if (btn) btn.style.display = 'block';
    const ctx = canvas.getContext('2d');
    // Ajustar tamanho do canvas
    canvas.width = canvas.offsetWidth || 320;
    canvas.height = 120;
    // Gradiente para a linha
    const gradientLine = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');
    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            z: 10
        }]
    };
    const options = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: 9 }, maxTicksLimit: 3 }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 8 },
                    autoSkip: true,
                    maxTicksLimit: 4,
                    callback: function() { return ''; }
                }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };
    window.chartPeriodPreviewMobileInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Função para criar o gráfico completo no modal mobile
function createChartPeriodFullMobile(xLabels, yValues) {
    const canvas = document.getElementById('chartPeriodFullMobile');
    if (!canvas) return;
    if (window.chartPeriodFullMobileInstance) {
        window.chartPeriodFullMobileInstance.destroy();
        window.chartPeriodFullMobileInstance = null;
    }
    // Tamanho para tela cheia (horizontal)
    canvas.width = window.innerHeight * 0.92;
    canvas.height = window.innerWidth * 0.60;
    if (window.innerWidth > window.innerHeight) {
        canvas.width = window.innerWidth * 0.98;
        canvas.height = window.innerHeight * 0.60;
    }
    const ctx = canvas.getContext('2d');
    const gradientLine = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');
    const chartData = {
        labels: xLabels,
        datasets: [{
            label: '',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.35,
            z: 10
        }]
    };
    const options = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: {
                beginAtZero: false,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#666', font: { family: 'Poppins', size: 12 }, maxTicksLimit: 5 }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 10 },
                    autoSkip: true,
                    maxTicksLimit: 8
                }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
    };
    window.chartPeriodFullMobileInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Função para abrir o modal
function openFullChartModal(xLabels, yValues) {
    const modal = document.getElementById('modalFullChart');
    if (!modal) return;
    modal.style.display = 'flex'; // Garante que o modal aparece
    createChartPeriodFullMobile(xLabels, yValues);
}

// Função para fechar o modal
function closeFullChartModal() {
    const modal = document.getElementById('modalFullChart');
    if (!modal) return;
    modal.style.display = 'none'; // Garante que o modal some
    if (window.chartPeriodFullMobileInstance) {
        window.chartPeriodFullMobileInstance.destroy();
        window.chartPeriodFullMobileInstance = null;
    }
}

// Eventos do botão
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.getElementById('btnShowFullChart');
        const btnClose = document.getElementById('btnCloseFullChart');
        if (btn) {
            btn.addEventListener('click', function() {
                if (window._chartPeriodMobileData) {
                    openFullChartModal(window._chartPeriodMobileData.xLabels, window._chartPeriodMobileData.yValues);
                }
            });
        }
        if (btnClose) {
            btnClose.addEventListener('click', function() {
                closeFullChartModal();
            });
        }
    });
}

// Modificar drawSelectedPeriodChart para garantir preview e botão
function drawSelectedPeriodChart() {
    if (!csvData) return;
    const periodColName = document.getElementById('periodSelect').value;
    const yValues = [];
    const xLabels = [];
    csvData.forEach((row) => {
        const yVal = row[periodColName];
        const dateVal = row['Date'] || row['date'] || row['DATA'] || row['data'];
        if (yVal !== undefined && yVal !== null && yVal !== "" && !isNaN(parseFloat(yVal))) {
            yValues.push(parseFloat(yVal));
            // Converter para formato brasileiro se necessário
            let formattedDate = dateVal;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                const [yyyy, mm, dd] = dateVal.split('-');
                formattedDate = `${dd}/${mm}/${yyyy}`;
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateVal)) {
                const [mm, dd, yyyy] = dateVal.split('/');
                formattedDate = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
            }
            xLabels.push(formattedDate ? formattedDate : '');
        }
    });
    if (yValues.length === 0) {
        createChartPeriodPreviewMobile([], []);
        return;
    }
    if (window.innerWidth > 768) {
        createOrUpdateChart('chartPeriod', '', xLabels, yValues);
    } else {
        // Mostrar apenas os últimos 20 pontos no preview
        const previewCount = 20;
        const previewY = yValues.slice(-previewCount);
        const previewX = xLabels.slice(-previewCount);
        createOrUpdateChart('chartPeriodPreviewMobile', '', previewX, previewY);
        window._chartPeriodMobileData = { xLabels, yValues };
        // Garante que o botão e o canvas aparecem
        const btn = document.getElementById('btnShowFullChart');
        const canvas = document.getElementById('chartPeriodPreviewMobile');
        if (btn) btn.style.display = 'block';
        if (canvas) canvas.style.display = 'block';
    }
}

// Função para exibir apenas o número do Momento de Mercado no mobile
function renderMobileMomentoChart(valor, mediaPonderada, periodoSelecionado) {
    const container = document.getElementById('mobile-momento-chart');
    if (!container) return;
    container.innerHTML = '';

    // Cria o número principal
    const valorDiv = document.createElement('div');
    valorDiv.style.fontSize = '3.2rem';
    valorDiv.style.fontWeight = '700';
    valorDiv.style.color = '#FFC107';
    valorDiv.style.fontFamily = 'Poppins, Arial, sans-serif';
    valorDiv.style.textAlign = 'center';
    valorDiv.style.letterSpacing = '-2px';
    valorDiv.style.marginBottom = '0.2em';
    valorDiv.textContent = Math.round(valor);
    container.appendChild(valorDiv);

    // Cria a média das médias
    if (typeof mediaPonderada === 'number') {
        const mediaDiv = document.createElement('div');
        mediaDiv.style.fontSize = '1.15rem';
        mediaDiv.style.fontWeight = '500';
        mediaDiv.style.color = '#888';
        mediaDiv.style.fontFamily = 'Poppins, Arial, sans-serif';
        mediaDiv.style.textAlign = 'center';
        mediaDiv.style.marginTop = '0.1em';
        mediaDiv.textContent = `Média dos períodos: ${Math.round(mediaPonderada)}`;
        container.appendChild(mediaDiv);
    }

    // Atualizar label e data normalmente
    let faixaLabel = '';
    let color = '#FFC107';
    if (valor < 10) { faixaLabel = 'Sobrevenda Extrema'; color = '#E53935'; }
    else if (valor < 20) { faixaLabel = 'Sobrevenda'; color = '#FF9800'; }
    else if (valor < 80) { faixaLabel = 'Neutro'; color = '#FFC107'; }
    else if (valor < 90) { faixaLabel = 'Sobrecompra'; color = '#4CAF50'; }
    else { faixaLabel = 'Sobrecompra Extrema'; color = '#8BC34A'; }
    valorDiv.style.color = color;

    const labelDiv = document.getElementById('mobile-momento-label');
    if (labelDiv) {
        labelDiv.textContent = `Momento: ${faixaLabel}`;
        labelDiv.style.color = color;
        labelDiv.style.fontWeight = '600';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.marginTop = '0.5em';
    }
    const updateDiv = document.getElementById('mobile-momento-update');
    if (updateDiv) {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        const dia = String(now.getDate()).padStart(2, '0');
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const ano = now.getFullYear();
        updateDiv.textContent = `Atualizado pela última vez em: ${dia}/${mes}/${ano}`;
        updateDiv.style.color = '#999';
        updateDiv.style.textAlign = 'center';
    }
}

// Detectar mobile e renderizar o gráfico circular ao atualizar o Momento de Mercado
function updateMobileMomento() {
    if (window.innerWidth > 768) return;
    if (!csvData || csvData.length === 0) return;
    let periodColName = '21';
    const selectMobile = document.getElementById('periodSelectMobile');
    const selectDesktop = document.getElementById('periodSelect');
    if (selectMobile) {
        periodColName = selectMobile.value;
        if (selectDesktop && selectDesktop.value !== periodColName) selectDesktop.value = periodColName;
    } else if (selectDesktop) {
        periodColName = selectDesktop.value;
    }
    const periodData = [];
    csvData.forEach((row) => {
        const yVal = row[periodColName];
        if (yVal !== undefined && yVal !== null && yVal !== "" && !isNaN(parseFloat(yVal))) {
            periodData.push(parseFloat(yVal));
        }
    });
    if (periodData.length === 0) return;
    const valor = periodData[periodData.length-1];
    // Calcular média ponderada dos últimos valores dos quatro períodos
    const periodos = [
        { periodo: "21", peso: 1 },
        { periodo: "62", peso: 2 },
        { periodo: "125", peso: 3 },
        { periodo: "252", peso: 4 }
    ];
    let somaPonderada = 0, somaPesos = 0;
    periodos.forEach(({ periodo, peso }) => {
        const data = [];
        csvData.forEach(row => {
            const yVal = row[periodo];
            if (yVal !== undefined && yVal !== null && yVal !== "" && !isNaN(parseFloat(yVal))) {
                data.push(parseFloat(yVal));
            }
        });
        if (data.length > 0) {
            const ultimoValor = data[data.length - 1];
            somaPonderada += ultimoValor * peso;
            somaPesos += peso;
        }
    });
    const mediaPonderada = somaPesos > 0 ? somaPonderada / somaPesos : null;
    renderMobileMomentoChart(valor, mediaPonderada, periodColName);
}

// Eventos para o seletor mobile
if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobileMomento);
    document.addEventListener('DOMContentLoaded', updateMobileMomento);
}
const selectMobile = document.getElementById('periodSelectMobile');
if (selectMobile) {
    selectMobile.addEventListener('change', function() {
        updateMobileMomento();
    });
}
// Sincronizar mudança do desktop para o mobile também
const selectDesktop = document.getElementById('periodSelect');
if (selectDesktop) {
    selectDesktop.addEventListener('change', function() {
        const selectMobile = document.getElementById('periodSelectMobile');
        if (selectMobile && selectMobile.value !== selectDesktop.value) {
            selectMobile.value = selectDesktop.value;
            updateMobileMomento();
        }
    });
}

// Redesenhar preview ao redimensionar tela ou trocar período
if (typeof window !== 'undefined') {
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768 && window._chartPeriodMobileData) {
            createChartPeriodPreviewMobile(window._chartPeriodMobileData.xLabels, window._chartPeriodMobileData.yValues);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const drawer = document.getElementById('drawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    // Suporte para diferentes seletores de botões
    const openBtns = [
        document.querySelector('.menu-toggle'),
        document.getElementById('menuToggle'),
        document.querySelector('.toggle-drawer'),
        document.getElementById('toggleDrawer')
    ].filter(Boolean);
    const closeBtns = [
        document.querySelector('.drawer-close'),
        document.getElementById('drawerClose'),
        document.querySelector('.close-drawer'),
        document.getElementById('closeDrawer')
    ].filter(Boolean);

    function openDrawer() {
        if (drawer) drawer.classList.add('open');
        if (drawerBackdrop) drawerBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        if (drawer) drawer.classList.remove('open');
        if (drawerBackdrop) drawerBackdrop.classList.remove('open');
        document.body.style.overflow = '';
    }
    function toggleDrawer() {
        if (drawer && drawer.classList.contains('open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }
    openBtns.forEach(btn => btn.addEventListener('click', toggleDrawer));
    closeBtns.forEach(btn => btn.addEventListener('click', closeDrawer));
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeDrawer();
    });
}); 
