// saas-injector.js
// Injetado nos arquivos HTML originais para habilitar o modo Multi-tenant (Fontes, Cores, Temas)

const DEFAULT_FOOTER_COPYRIGHT = '© 2026 Cleanfoods SP. Todos os direitos reservados. Sem glúten, sem lactose.';
const DEFAULT_FOOTER_CNPJ = '66.719.007/0001-76';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function optimizeStorefrontImage(file, maxWidth, maxHeight) {
    const maxDataUrlLength = 800000;

    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith('image/')) {
            reject(new Error('Selecione um arquivo de imagem válido.'));
            return;
        }

        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
            try {
                let scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
                let width = Math.max(1, Math.round(image.naturalWidth * scale));
                let height = Math.max(1, Math.round(image.naturalHeight * scale));
                let result = '';

                for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext('2d');
                    if (!context) throw new Error('Não foi possível processar a imagem.');
                    context.drawImage(image, 0, 0, width, height);

                    for (let quality = 0.9; quality >= 0.5; quality -= 0.1) {
                        result = canvas.toDataURL('image/webp', quality);
                        if (result.length <= maxDataUrlLength) break;
                    }
                    if (result.length <= maxDataUrlLength) break;

                    width = Math.max(1, Math.round(width * 0.8));
                    height = Math.max(1, Math.round(height * 0.8));
                }

                if (!result || result.length > maxDataUrlLength) {
                    throw new Error('A imagem é muito grande. Escolha outra imagem.');
                }
                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível abrir essa imagem.'));
        };
        image.src = objectUrl;
    });
}

function restoreStorefrontFooter(tenant) {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const visibilityFix = document.createElement('style');
    visibilityFix.id = 'saas-footer-visibility-fix';
    visibilityFix.textContent = `
        footer .reveal-up, footer .reveal-right {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
        }
    `;
    document.head.appendChild(visibilityFix);

    const legalBlock = [...footer.querySelectorAll('div')].find((element) =>
        /todos os direitos reservados/i.test(element.textContent || '')
        && [...element.children].some((child) => child.tagName === 'DIV')
    );
    if (!legalBlock) return;

    const attribution = [...legalBlock.children].find((child) => child.tagName === 'DIV');
    const copyright = document.createElement('span');
    copyright.id = 'saas-footer-copyright';
    copyright.textContent = tenant.footerCopyright ?? DEFAULT_FOOTER_COPYRIGHT;
    const cnpj = document.createElement('span');
    cnpj.id = 'saas-footer-cnpj';
    cnpj.textContent = `CNPJ: ${tenant.footerCnpj ?? DEFAULT_FOOTER_CNPJ}`;

    legalBlock.replaceChildren(copyright, document.createElement('br'), cnpj);
    if (attribution) legalBlock.appendChild(attribution);
}

function restoreOrderSteps() {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('saas-order-steps')) return;

    const section = document.createElement('section');
    section.id = 'saas-order-steps';
    section.innerHTML = `
        <div class="saas-steps-inner">
            <p class="saas-steps-kicker">É simples pedir</p>
            <h2>Seu pedido em 3 etapas</h2>
            <div class="saas-steps-grid">
                <article><strong>1</strong><h3>Escolha seus pratos</h3><p>Veja o cardápio e adicione suas refeições favoritas.</p></article>
                <article><strong>2</strong><h3>Finalize o pedido</h3><p>Informe seus dados, escolha a entrega e confirme o pagamento.</p></article>
                <article><strong>3</strong><h3>Receba e aproveite</h3><p>Agora é só aguardar suas refeições prontas para a semana.</p></article>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.id = 'saas-order-steps-style';
    style.textContent = `
        #saas-order-steps { padding: 72px 20px; background: #151515; border-top: 1px solid #333; color: #fff; }
        .saas-steps-inner { width: min(1120px, 100%); margin: 0 auto; text-align: center; }
        .saas-steps-kicker { margin: 0 0 8px; color: var(--cf-yellow, #F6C500); font-weight: 800; text-transform: uppercase; letter-spacing: .16em; }
        #saas-order-steps h2 { margin: 0 0 36px; font-size: clamp(2rem, 5vw, 4rem); line-height: 1; text-transform: uppercase; }
        .saas-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .saas-steps-grid article { padding: 28px 22px; background: #0e0e0e; border: 1px solid #333; border-bottom: 4px solid var(--cf-yellow, #F6C500); }
        .saas-steps-grid strong { display: inline-grid; place-items: center; width: 54px; height: 54px; margin-bottom: 18px; border-radius: 50%; background: var(--cf-yellow, #F6C500); color: #0e0e0e; font-size: 1.65rem; }
        .saas-steps-grid h3 { margin: 0 0 10px; color: #fff; font-size: 1.2rem; text-transform: uppercase; }
        .saas-steps-grid p { margin: 0; color: #aaa; line-height: 1.55; }
        @media (max-width: 760px) { .saas-steps-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
    footer.before(section);
}

async function initSaas() {
    const urlParams = new URLSearchParams(window.location.search);
    let tenantSlug = urlParams.get('tenant');
    const requestedTheme = urlParams.get('theme');

    if (tenantSlug) {
        tenantSlug = tenantSlug.trim().toLowerCase();
        sessionStorage.setItem('active_tenant', tenantSlug);
    } else {
        tenantSlug = sessionStorage.getItem('active_tenant');
    }

    if (!tenantSlug) {
        if(document.body) { document.body.style.opacity = '1'; document.body.style.visibility = 'visible'; }
        return;
    }

    // Busca dados do tenant
    const tenants = JSON.parse(localStorage.getItem('saas_tenants') || '[]');
    const localTenant = tenants.find(t => (t.slug || '').toLowerCase() === tenantSlug);
    let remoteTenant = null;

    try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantSlug)}`, {
            cache: 'no-store'
        });
        if (response.ok) remoteTenant = await response.json();
    } catch (error) {
        console.warn('Não foi possível atualizar os dados públicos da loja.', error);
    }

    // O Supabase é a fonte principal. Localmente ficam apenas credenciais legadas.
    const tenant = remoteTenant
        ? {
            ...remoteTenant,
            adminUser: localTenant?.adminUser,
            adminPassword: localTenant?.adminPassword,
            mercadoPagoKey: localTenant?.mercadoPagoKey
        }
        : localTenant;
    if (!tenant) {
        if(document.body) { document.body.style.opacity = '1'; document.body.style.visibility = 'visible'; }
        return;
    }

    if (remoteTenant) {
        const tenantIdx = tenants.findIndex(t => (t.slug || '').toLowerCase() === tenantSlug);
        if (tenantIdx >= 0) tenants[tenantIdx] = tenant;
        else tenants.push(tenant);
        localStorage.setItem('saas_tenants', JSON.stringify(tenants));
    }

    // O primeiro tema foi descontinuado; lojas antigas passam a usar o Tema 2.
    if (!tenant.theme || tenant.theme === 'design1') tenant.theme = 'design2';
    if (/^design[2-9]$/.test(requestedTheme || '')) tenant.theme = requestedTheme;

    const isAdmin = window.location.pathname.includes('admin.html');

    // ========================================================
    // BILLING BLOCKING LOGIC
    // ========================================================
    if (isAdmin) {
        const masterConfig = JSON.parse(localStorage.getItem('saas_master_config') || '{"pixKey": "", "pixName": ""}');
        const currentDay = new Date().getDate();
        const paymentDay = parseInt(tenant.paymentDay || '0', 10);
        const isDue = tenant.paymentStatus === 'pendente' && paymentDay > 0 && currentDay >= paymentDay;

        if (isDue) {
            // Se estiver bloqueado, limpa a tela e mostra a mensagem de cobrança
            document.body.innerHTML = `
                <div style="min-height: 100vh; background-color: #0E0E0E; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif;">
                    <div style="background-color: #1A1A1A; border: 2px solid #ef4444; padding: 40px; max-width: 500px; width: 100%; position: relative; text-align: center;">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background-color: #ef4444;"></div>
                        <h2 style="font-size: 32px; color: #ef4444; margin-bottom: 10px; font-weight: bold; text-transform: uppercase;">Acesso Bloqueado</h2>
                        <p style="color: #d1d5db; margin-bottom: 30px;">Mensalidade Pendente</p>
                        
                        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
                            O pagamento referente ao dia <strong>${tenant.paymentDay}</strong> consta como pendente em nosso sistema.
                        </p>

                        <div style="background-color: #000; border: 1px solid #333; padding: 20px; margin-bottom: 20px;">
                            <p style="color: #F6C500; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Chave PIX para Pagamento</p>
                            <p style="color: #fff; font-family: monospace; font-size: 18px; user-select: all;">${masterConfig.pixKey || 'Não configurada'}</p>
                            ${masterConfig.pixName ? `<p style="color: #6b7280; font-size: 12px; margin-top: 10px; font-weight: bold; text-transform: uppercase;">Favorecido: <span style="color: #d1d5db;">${masterConfig.pixName}</span></p>` : ''}
                        </div>
                        
                        <p style="color: #6b7280; font-size: 12px;">Realize o pagamento e envie o comprovante para o administrador liberar seu acesso.</p>
                    </div>
                </div>
            `;
            document.body.style.opacity = '1';
            document.body.style.visibility = 'visible';
            return; // Impede que o resto do script rode
        }
    }

    // ========================================================
    // BLOCO STOREFRONT (apenas para páginas que não são admin)
    // ========================================================
    if (!isAdmin) {
        // 1. Aplica Cores Dinâmicas
        if (tenant.primaryColor) {
            document.documentElement.style.setProperty('--yellow', tenant.primaryColor);
            document.documentElement.style.setProperty('--cf-yellow', tenant.primaryColor);
        }

        // 2. Aplica Fontes Dinâmicas (Títulos, Corpo e Hero separadamente)
        let fontName = tenant.fontFamily || 'Inter';
        let bodyFontName = tenant.bodyFontFamily || 'Inter';
        let heroFontName = tenant.heroFontFamily || fontName;

        // Formatação dos nomes para o Google Fonts
        if (fontName.startsWith('--font-')) fontName = fontName.replace('--font-', '').replace('-', ' ');
        if (fontName.toLowerCase() === 'inter') fontName = 'Inter';
        if (fontName.toLowerCase() === 'anton') fontName = 'Anton';
        if (fontName.toLowerCase() === 'permanent marker') fontName = 'Permanent Marker';

        if (bodyFontName.startsWith('--font-')) bodyFontName = bodyFontName.replace('--font-', '').replace('-', ' ');
        if (bodyFontName.toLowerCase() === 'inter') bodyFontName = 'Inter';
        if (bodyFontName.toLowerCase() === 'anton') bodyFontName = 'Anton';
        if (bodyFontName.toLowerCase() === 'permanent marker') bodyFontName = 'Permanent Marker';

        if (heroFontName.startsWith('--font-')) heroFontName = heroFontName.replace('--font-', '').replace('-', ' ');
        if (heroFontName.toLowerCase() === 'inter') heroFontName = 'Inter';
        if (heroFontName.toLowerCase() === 'anton') heroFontName = 'Anton';
        if (heroFontName.toLowerCase() === 'permanent marker') heroFontName = 'Permanent Marker';

        let subFontName = tenant.heroSubtitleFont || bodyFontName;
        if (subFontName.startsWith('--font-')) subFontName = subFontName.replace('--font-', '').replace('-', ' ');
        if (subFontName.toLowerCase() === 'inter') subFontName = 'Inter';
        if (subFontName.toLowerCase() === 'anton') subFontName = 'Anton';
        if (subFontName.toLowerCase() === 'permanent marker') subFontName = 'Permanent Marker';

        // Carrega do Google Fonts as fontes
        const link = document.createElement('link');
        const fontsToLoad = [...new Set([fontName, bodyFontName, heroFontName, subFontName])].map(f => f.replace(/ /g, '+')).join('&family=');
        link.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Sobrescreve as classes do Tailwind baseadas nas fontes do HTML antigo
        const style = document.createElement('style');
        style.innerHTML = `
            body, p, h3, h4, h5, h6, .font-body { font-family: "${bodyFontName}", sans-serif !important; }
            h1, h2, .font-impact { font-family: "${fontName}", sans-serif !important; }
            #hero-title, #hero-title span { font-family: "${heroFontName}", sans-serif !important; }
            #hero-subtitle { font-family: "${subFontName}", sans-serif !important; }
            .font-street { font-family: "${fontName}", cursive !important; }
        `;
        document.head.appendChild(style);

        // 3. Aplica Logo Dinâmica
        if (tenant.logoUrl || tenant.logoSize) {
            document.querySelectorAll('.saas-logo, img[src*="Logonova.jpeg"], img[src*="logo"]').forEach(img => {
                if (tenant.logoUrl) img.src = tenant.logoUrl;
                img.classList.remove('mix-blend-screen');
                img.style.objectFit = 'contain';
                if (tenant.logoSize) {
                    img.style.transform = `scale(${parseInt(tenant.logoSize) / 100})`;
                    img.style.transformOrigin = 'center';
                }
            });
        }

        if (tenant.heroImageUrl || tenant.heroImageSize) {
            const heroImage = document.querySelector('img[src*="hero-image"], #saas-hero-image');
            if (heroImage) {
                if (tenant.heroImageUrl) heroImage.src = tenant.heroImageUrl;
                if (tenant.heroImageSize) {
                    heroImage.style.transform = `scale(${parseInt(tenant.heroImageSize) / 100})`;
                    heroImage.style.transformOrigin = 'center';
                }
            }
        }

        // Altera nome da loja no título
        document.title = tenant.name;

        const themeDefaults = {
            'design1': ['Dieta', 'LIMPA', 'Treino', 'PESADO.'],
            'design2': ['Comida.', 'Treino.', 'Foco.', 'Resultados.'],
            'design3': ['NO PAIN', 'No Gain', 'Pra quem treina pesado', ''],
            'design4': ['A Arte da', 'Alta', 'Gastronomia', 'Fitness'],
            'design5': ['Future', 'FUEL', '', ''],
            'design6': ['O Combustível', 'do seu Corpo.', '', ''],
            'design7': ['MÁXIMA', 'PERFORMANCE', 'GARANTIDA.', ''],
            'design8': ['ALIMENTAÇÃO', 'REAL.', 'RESULTADO', 'REAL.'],
            'design9': ['O FUTURO', 'DA SUA', 'DIETA.', '']
        };

        // 4. Aplica Textos do Hero Section
        const pathName = window.location.pathname;
        const isIndexPage = pathName.includes('index') || pathName === '/' || pathName === '' || pathName.endsWith('/');
        if (isIndexPage) {
            restoreOrderSteps();
            restoreStorefrontFooter(tenant);

            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) {
                const spans = heroTitle.querySelectorAll('span');
                if (spans.length >= 4) {
                    const currentTheme = tenant.theme || 'design2';
                    const defaults = themeDefaults[currentTheme] || themeDefaults['design2'];
                    const usesLegacyDesign4Copy = currentTheme === 'design4'
                        && tenant.heroWord2 === 'Alta Gastronomia'
                        && tenant.heroWord3 === 'Fitness'
                        && tenant.heroWord4 === undefined;
                    const heroWords = usesLegacyDesign4Copy
                        ? defaults
                        : [
                            tenant.heroWord1 ?? defaults[0],
                            tenant.heroWord2 ?? defaults[1],
                            tenant.heroWord3 ?? defaults[2],
                            tenant.heroWord4 ?? defaults[3]
                        ];

                    spans[0].innerText = heroWords[0];

                    const w2 = heroWords[1];
                    spans[1].innerText = w2;
                    spans[1].setAttribute('data-text', w2);

                    spans[2].innerText = heroWords[2];
                    spans[3].innerText = heroWords[3];

                    // Aplica cor e tamanho customizados
                    if (tenant.heroFontColor && tenant.heroFontColor !== '#ffffff') {
                        spans.forEach(span => {
                            if (!span.classList.contains('text-cf-yellow')) {
                                span.style.color = tenant.heroFontColor;
                            }
                        });
                    }
                    if (tenant.heroFontSize && tenant.heroFontSize !== '100') {
                        const scale = parseInt(tenant.heroFontSize) / 100;
                        heroTitle.style.zoom = scale;
                        
                        // Fallback constraint just in case it still tries to overflow
                        heroTitle.style.maxWidth = "100%";
                        heroTitle.style.overflowWrap = "break-word";
                        heroTitle.style.wordBreak = "break-word";
                        
                        // Force spans to break if they contain long strings
                        spans.forEach(span => {
                            span.style.whiteSpace = "normal";
                        });
                    }

                    // Oculta spans vazios
                    spans.forEach(span => {
                        if (!span.textContent.trim()) {
                            span.style.display = 'none';
                        } else {
                            span.style.display = 'block';
                        }
                    });
                }
            }

            let subtitleEl = document.getElementById('hero-subtitle');
            
            // Se o tema não tiver o subtítulo nativamente, injetamos ele
            if (!subtitleEl && heroTitle) {
                subtitleEl = document.createElement('p');
                subtitleEl.id = 'hero-subtitle';
                subtitleEl.className = 'font-body text-gray-300 text-sm sm:text-base lg:text-lg max-w-md mt-4 font-semibold';
                heroTitle.insertAdjacentElement('afterend', subtitleEl);
            }

            const legacySubtitle = 'Marmitas fitness reais para quem treina de verdade. Sem glúten, sem lactose.';
            const design4Subtitle = 'Alta gastronomia, nutrição inteligente e sabor de verdade — preparados para acompanhar o ritmo da sua rotina.';
            const resolvedSubtitle = tenant.theme === 'design4' && tenant.heroSubtitle === legacySubtitle
                ? design4Subtitle
                : tenant.heroSubtitle;

            if (subtitleEl && resolvedSubtitle !== undefined) {
                subtitleEl.innerText = resolvedSubtitle;
                if (!resolvedSubtitle.trim()) {
                    subtitleEl.style.display = 'none';
                } else {
                    subtitleEl.style.display = 'block';
                }
                if (tenant.heroSubtitleSize && tenant.heroSubtitleSize !== '100') {
                    subtitleEl.style.zoom = parseInt(tenant.heroSubtitleSize) / 100;
                }
            }

            if (tenant.heroImageUrl || tenant.heroImageSize) {
                const heroImg = document.querySelector('img[src*="hero-image"], #saas-hero-image');
                if (heroImg) {
                    if (tenant.heroImageUrl) heroImg.src = tenant.heroImageUrl;
                    if (tenant.heroImageSize) {
                        heroImg.style.transform = `scale(${parseInt(tenant.heroImageSize) / 100})`;
                        heroImg.style.transformOrigin = 'center';
                    }
                }
            }
        }

        // 5. Aplica os 9 Designs Dinâmicos
        const themeStyle = document.createElement('style');
        let cssRules = '';

        switch (tenant.theme) {
            case 'design2':
                cssRules = `
                    *:not(.rounded-full) { clip-path: none !important; border-radius: 0 !important; }
                    #products-container > div, .bg-cf-darkgray, button:not(#floating-cart) {
                        border: 2px solid #fff !important;
                        box-shadow: 6px 6px 0 var(--yellow) !important;
                        transition: transform 0.1s, box-shadow 0.1s !important;
                    }
                    #saas-hero-image {
                        border: 12px solid var(--yellow) !important;
                        box-shadow: 0 0 0 3px #111, 24px 24px 0 #fff, 24px 24px 0 3px #111 !important;
                        border-radius: 0 !important;
                    }
                    button:not(#floating-cart):active {
                        transform: translate(4px, 4px) !important;
                        box-shadow: 2px 2px 0 var(--yellow) !important;
                    }
                `;
                break;
            case 'design3':
                cssRules = `
                    .bg-pattern, .noise-bg { display: none !important; }
                    * { clip-path: none !important; }
                    .border-2 { border-width: 1px !important; border-color: #333 !important; }
                    .text-sm.text-gray-400 { display: none !important; }
                `;
                break;
            case 'design4':
                cssRules = `
                    #products-container > div {
                        display: grid !important;
                        grid-template-columns: 120px 1fr !important;
                        gap: 1rem !important;
                        height: auto !important;
                        align-items: center !important;
                    }
                    #products-container img { height: 100px !important; width: 100% !important; object-fit: cover !important; }
                    #products-container .bg-cf-black { height: auto !important; margin-bottom: 0 !important; }
                    #products-container .flex.justify-between { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; margin-top: 0 !important; }
                    .torn-edge { clip-path: none !important; }
                `;
                break;
            case 'design5':
                cssRules = `
                    .border-2, .border { border: none !important; }
                    .torn-edge { clip-path: none !important; }
                    #products-container > div, .bg-cf-darkgray {
                        box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
                        border-radius: 8px !important;
                    }
                `;
                break;
            case 'design6':
                cssRules = `
                    .border-2 { border-color: var(--yellow) !important; box-shadow: 0 0 10px var(--yellow), inset 0 0 10px var(--yellow) !important; }
                    button { box-shadow: 0 0 15px var(--yellow) !important; text-shadow: 0 0 5px #000; }
                    h1, h2 { text-shadow: 0 0 10px var(--yellow) !important; }
                `;
                break;
            case 'design7':
                cssRules = `
                    .border-2, .border { border: none !important; }
                    .torn-edge { clip-path: none !important; }
                    .bg-cf-darkgray { background-color: #1a1a1a !important; }
                    button:not(#floating-cart) { box-shadow: none !important; border-radius: 4px !important; }
                `;
                break;
            case 'design8':
                cssRules = `
                    h3.font-bold.text-xl { font-size: 1.8rem !important; line-height: 1.2 !important; }
                    .text-cf-yellow.font-bold { font-size: 2rem !important; }
                    button:not(#floating-cart) { font-size: 1.2rem !important; padding: 1rem 2rem !important; }
                `;
                break;
            case 'design9':
                cssRules = `
                    *:not(.rounded-full) { border-radius: 12px !important; clip-path: none !important; }
                    button:not(#floating-cart) { border-radius: 20px !important; }
                    .torn-edge { clip-path: none !important; border-radius: 12px !important; }
                `;
                break;
            case 'design1':
            default:
                break;
        }

        if (cssRules) {
            themeStyle.innerHTML = cssRules;
            document.head.appendChild(themeStyle);
        }
    }

    // ========================================================
    // BLOCO ADMIN — injeta seção SaaS na aba Ajustes
    // ========================================================
    if (isAdmin) {
        const themeDefaults = {
            'design1': ['Dieta', 'LIMPA', 'Treino', 'PESADO.'],
            'design2': ['Comida.', 'Treino.', 'Foco.', 'Resultados.'],
            'design3': ['NO PAIN', 'No Gain', 'Pra quem treina pesado', ''],
            'design4': ['A Arte da', 'Alta', 'Gastronomia', 'Fitness'],
            'design5': ['Future', 'FUEL', '', ''],
            'design6': ['O Combustível', 'do seu Corpo.', '', ''],
            'design7': ['MÁXIMA', 'PERFORMANCE', 'GARANTIDA.', ''],
            'design8': ['ALIMENTAÇÃO', 'REAL.', 'RESULTADO', 'REAL.'],
            'design9': ['O FUTURO', 'DA SUA', 'DIETA.', '']
        };

        let injected = false;

        const checkExist = setInterval(function () {
            if (injected) { clearInterval(checkExist); return; }

            const configTab = document.querySelector('#tab-config .space-y-6');
            const saveBtn = configTab ? configTab.querySelector('button[onclick="saveConfig()"]') : null;

            if (configTab && saveBtn) {
                clearInterval(checkExist);
                injected = true;

                // Remove botão legado se existir
                const oldSidebarBtn = document.getElementById('btn-saas-config');
                if (oldSidebarBtn) oldSidebarBtn.remove();

                // Remove injeção anterior duplicada
                const existingSaas = configTab.querySelector('.saas-fields-block');
                if (existingSaas) existingSaas.remove();

                const saasFieldsHtml = `
                    <div class="saas-fields-block mt-8 border-t border-cf-gray pt-6">
                        <h3 class="font-impact text-xl text-cf-yellow uppercase mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Personalização SaaS
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Logo da Franquia (Upload)</label>
                                <input type="file" accept="image/*" id="saas-logo-file" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none transition-colors cursor-pointer">
                                <div id="saas-logo-preview-container" class="${tenant.logoUrl ? 'mt-4 p-2 bg-black border border-cf-gray rounded inline-block' : 'hidden'}">
                                    <p class="text-xs text-gray-400 mb-2">Preview da Logo:</p>
                                    <img id="saas-logo-preview" src="${tenant.logoUrl || ''}" class="h-16 object-contain bg-white/10 p-2 rounded">
                                </div>
                                <div class="mt-4">
                                    <label class="block text-xs text-gray-400 mb-1">Tamanho da Logo: <span id="saas-logo-size-label">${tenant.logoSize || '100'}</span>%</label>
                                    <input type="range" min="50" max="250" step="5" value="${tenant.logoSize || '100'}" id="saas-logo-size" class="w-full max-w-sm accent-cf-yellow cursor-pointer" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Imagem da Página Inicial (Hero Image)</label>
                                <input type="file" accept="image/*" id="saas-hero-file" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none transition-colors cursor-pointer">
                                <div id="saas-hero-preview-container" class="${tenant.heroImageUrl ? 'mt-4 p-2 bg-black border border-cf-gray rounded inline-block' : 'hidden'}">
                                    <p class="text-xs text-gray-400 mb-2">Preview da Imagem:</p>
                                    <img id="saas-hero-preview" src="${tenant.heroImageUrl || ''}" class="h-24 object-contain">
                                </div>
                                <div class="mt-4">
                                    <label class="block text-xs text-gray-400 mb-1">Tamanho da Imagem: <span id="saas-hero-image-size-label">${tenant.heroImageSize || '100'}</span>%</label>
                                    <input type="range" min="50" max="150" step="5" value="${tenant.heroImageSize || '100'}" id="saas-hero-image-size" class="w-full max-w-sm accent-cf-yellow cursor-pointer" />
                                </div>
                            </div>

                            <div class="bg-cf-black p-4 border border-cf-gray rounded space-y-3 mt-4">
                                <h4 class="font-bold text-sm text-cf-yellow uppercase mb-2">Textos da Página Inicial (Hero)</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 1</label>
                                        <input type="text" id="saas-hero-1" value="${tenant.heroWord1 ?? (themeDefaults[tenant.theme || 'design2'] || themeDefaults['design2'])[0]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 2</label>
                                        <input type="text" id="saas-hero-2" value="${tenant.heroWord2 ?? (themeDefaults[tenant.theme || 'design2'] || themeDefaults['design2'])[1]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 3</label>
                                        <input type="text" id="saas-hero-3" value="${tenant.heroWord3 ?? (themeDefaults[tenant.theme || 'design2'] || themeDefaults['design2'])[2]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 4</label>
                                        <input type="text" id="saas-hero-4" value="${tenant.heroWord4 ?? (themeDefaults[tenant.theme || 'design2'] || themeDefaults['design2'])[3]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                </div>
                                <div class="mt-4">
                                    <label class="block text-xs text-gray-400 mb-1">Subtítulo (Abaixo das palavras)</label>
                                    <textarea id="saas-hero-subtitle" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-2 text-sm outline-none resize-none" rows="2" placeholder="Marmitas fitness reais...">${tenant.heroSubtitle !== undefined ? tenant.heroSubtitle : 'Marmitas fitness reais para quem treina de verdade. Sem glúten, sem lactose.'}</textarea>
                                    <div class="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label class="block text-xs text-gray-400 mb-1">Tipografia do Subtítulo</label>
                                            <select id="saas-hero-subtitle-font" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                                <option value="Inter" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Inter' ? 'selected' : ''}>Inter (Moderna)</option>
                                                <option value="Anton" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Anton' ? 'selected' : ''}>Anton (Ousada)</option>
                                                <option value="Permanent Marker" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Permanent Marker' ? 'selected' : ''}>Permanent Marker</option>
                                                <option value="Roboto" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Roboto' ? 'selected' : ''}>Roboto</option>
                                                <option value="Montserrat" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
                                                <option value="Poppins" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Poppins' ? 'selected' : ''}>Poppins</option>
                                                <option value="Lato" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Lato' ? 'selected' : ''}>Lato</option>
                                                <option value="Oswald" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Oswald' ? 'selected' : ''}>Oswald</option>
                                                <option value="Playfair Display" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Playfair Display' ? 'selected' : ''}>Playfair</option>
                                                <option value="Fredoka One" ${(tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily) === 'Fredoka One' ? 'selected' : ''}>Fredoka One</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-400 mb-1">Tamanho: <span id="saas-hero-subtitle-size-label">${tenant.heroSubtitleSize || '100'}</span>%</label>
                                            <input type="range" id="saas-hero-subtitle-size" min="50" max="250" step="5" value="${tenant.heroSubtitleSize || '100'}" class="w-full accent-cf-yellow cursor-pointer">
                                        </div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 pt-2 border-t border-cf-gray mt-3">
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Cor do Texto Principal</label>
                                        <div class="flex items-center gap-2">
                                            <input type="color" id="saas-hero-color" value="${tenant.heroFontColor || '#ffffff'}" class="h-8 w-12 cursor-pointer bg-cf-darkgray border border-cf-gray">
                                            <span class="text-xs font-mono text-gray-400" id="saas-hero-color-hex">${tenant.heroFontColor || '#ffffff'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Tamanho da Fonte: <span id="saas-hero-size-label">${tenant.heroFontSize || '100'}</span>%</label>
                                        <input type="range" id="saas-hero-size" min="50" max="150" step="5" value="${tenant.heroFontSize || '100'}" class="w-full accent-cf-yellow cursor-pointer">
                                    </div>
                                </div>
                            </div>

                            <div class="bg-cf-black p-4 border border-cf-gray rounded space-y-3 mt-4">
                                <h4 class="font-bold text-sm text-cf-yellow uppercase mb-2">Textos do Rodapé</h4>
                                <div>
                                    <label class="block text-xs text-gray-400 mb-1">Direitos reservados</label>
                                    <textarea id="saas-footer-copyright-input" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-2 text-sm outline-none resize-none" rows="2">${escapeHtml(tenant.footerCopyright ?? DEFAULT_FOOTER_COPYRIGHT)}</textarea>
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-400 mb-1">CNPJ</label>
                                    <input type="text" id="saas-footer-cnpj-input" value="${escapeHtml(tenant.footerCnpj ?? DEFAULT_FOOTER_CNPJ)}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-2 text-sm outline-none" placeholder="00.000.000/0000-00">
                                </div>
                            </div>

                            <div class="flex gap-4 mt-4">
                                <div class="flex-1">
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Cor Primária (Destaque)</label>
                                    <div class="flex items-center gap-2">
                                        <input type="color" id="saas-color" value="${tenant.primaryColor || '#F6C500'}" class="h-10 w-16 bg-cf-black border border-cf-gray rounded cursor-pointer">
                                        <span class="text-xs text-gray-500 font-mono" id="saas-color-hex">${tenant.primaryColor || '#F6C500'}</span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Chave Mercado Pago</label>
                                    <input type="text" id="saas-mp-key" value="${tenant.mercadoPagoKey || ''}" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-blue-400 outline-none transition-colors" placeholder="APP_USR-...">
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tipografia (Títulos)</label>
                                    <select id="saas-font" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                        <option value="Inter" ${tenant.fontFamily === 'Inter' ? 'selected' : ''}>1. Inter (Moderna / Neutra)</option>
                                        <option value="Anton" ${tenant.fontFamily === 'Anton' ? 'selected' : ''}>2. Anton (Ousada / Impacto)</option>
                                        <option value="Permanent Marker" ${tenant.fontFamily === 'Permanent Marker' ? 'selected' : ''}>3. Permanent Marker (Urbana / Street)</option>
                                        <option value="Roboto" ${tenant.fontFamily === 'Roboto' ? 'selected' : ''}>4. Roboto (Clássica do Google)</option>
                                        <option value="Montserrat" ${tenant.fontFamily === 'Montserrat' ? 'selected' : ''}>5. Montserrat (Geométrica / Elegante)</option>
                                        <option value="Poppins" ${tenant.fontFamily === 'Poppins' ? 'selected' : ''}>6. Poppins (Arredondada / Amigável)</option>
                                        <option value="Lato" ${tenant.fontFamily === 'Lato' ? 'selected' : ''}>7. Lato (Leve e Harmônica)</option>
                                        <option value="Oswald" ${tenant.fontFamily === 'Oswald' ? 'selected' : ''}>8. Oswald (Alta e Fina / Revista)</option>
                                        <option value="Playfair Display" ${tenant.fontFamily === 'Playfair Display' ? 'selected' : ''}>9. Playfair Display (Serifada Clássica)</option>
                                        <option value="Fredoka One" ${tenant.fontFamily === 'Fredoka One' ? 'selected' : ''}>10. Fredoka (Descontraída / Fun)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tipografia (Corpo/Cardápio)</label>
                                    <select id="saas-body-font" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                        <option value="Inter" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Inter' ? 'selected' : ''}>1. Inter (Moderna / Neutra)</option>
                                        <option value="Anton" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Anton' ? 'selected' : ''}>2. Anton (Ousada / Impacto)</option>
                                        <option value="Permanent Marker" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Permanent Marker' ? 'selected' : ''}>3. Permanent Marker (Urbana / Street)</option>
                                        <option value="Roboto" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Roboto' ? 'selected' : ''}>4. Roboto (Clássica do Google)</option>
                                        <option value="Montserrat" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Montserrat' ? 'selected' : ''}>5. Montserrat (Geométrica / Elegante)</option>
                                        <option value="Poppins" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Poppins' ? 'selected' : ''}>6. Poppins (Arredondada / Amigável)</option>
                                        <option value="Lato" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Lato' ? 'selected' : ''}>7. Lato (Leve e Harmônica)</option>
                                        <option value="Oswald" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Oswald' ? 'selected' : ''}>8. Oswald (Alta e Fina / Revista)</option>
                                        <option value="Playfair Display" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Playfair Display' ? 'selected' : ''}>9. Playfair Display (Serifada Clássica)</option>
                                        <option value="Fredoka One" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Fredoka One' ? 'selected' : ''}>10. Fredoka (Descontraída / Fun)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tipografia (Frase Hero)</label>
                                    <select id="saas-hero-font" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                        <option value="Inter" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Inter' ? 'selected' : ''}>1. Inter (Moderna / Neutra)</option>
                                        <option value="Anton" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Anton' ? 'selected' : ''}>2. Anton (Ousada / Impacto)</option>
                                        <option value="Permanent Marker" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Permanent Marker' ? 'selected' : ''}>3. Permanent Marker (Urbana / Street)</option>
                                        <option value="Roboto" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Roboto' ? 'selected' : ''}>4. Roboto (Clássica do Google)</option>
                                        <option value="Montserrat" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Montserrat' ? 'selected' : ''}>5. Montserrat (Geométrica / Elegante)</option>
                                        <option value="Poppins" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Poppins' ? 'selected' : ''}>6. Poppins (Arredondada / Amigável)</option>
                                        <option value="Lato" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Lato' ? 'selected' : ''}>7. Lato (Leve e Harmônica)</option>
                                        <option value="Oswald" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Oswald' ? 'selected' : ''}>8. Oswald (Alta e Fina / Revista)</option>
                                        <option value="Playfair Display" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Playfair Display' ? 'selected' : ''}>9. Playfair Display (Serifada Clássica)</option>
                                        <option value="Fredoka One" ${(tenant.heroFontFamily || tenant.fontFamily) === 'Fredoka One' ? 'selected' : ''}>10. Fredoka (Descontraída / Fun)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tema / Design Base (8 Opções)</label>
                                <select id="saas-theme" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                    <option value="design2" ${tenant.theme === 'design2' ? 'selected' : ''}>1. Retrô Block (HQ)</option>
                                    <option value="design3" ${tenant.theme === 'design3' ? 'selected' : ''}>2. Minimalista (Clean)</option>
                                    <option value="design4" ${tenant.theme === 'design4' ? 'selected' : ''}>3. Lista Compacta</option>
                                    <option value="design5" ${tenant.theme === 'design5' ? 'selected' : ''}>4. Sombra Elevada (Flutuante)</option>
                                    <option value="design6" ${tenant.theme === 'design6' ? 'selected' : ''}>5. Neon Cyberpunk</option>
                                    <option value="design7" ${tenant.theme === 'design7' ? 'selected' : ''}>6. Flat Moderno</option>
                                    <option value="design8" ${tenant.theme === 'design8' ? 'selected' : ''}>7. Tipografia Maximizada</option>
                                    <option value="design9" ${tenant.theme === 'design9' ? 'selected' : ''}>8. Suave e Arredondado</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;

                const wrapper = document.createElement('div');
                wrapper.innerHTML = saasFieldsHtml;
                configTab.insertBefore(wrapper.firstElementChild, saveBtn);

                // Atualiza o hex quando mudar a cor
                document.getElementById('saas-color').addEventListener('input', (e) => {
                    document.getElementById('saas-color-hex').innerText = e.target.value;
                });
                document.getElementById('saas-hero-color').addEventListener('input', (e) => {
                    document.getElementById('saas-hero-color-hex').innerText = e.target.value;
                });
                document.getElementById('saas-hero-size').addEventListener('input', (e) => {
                    document.getElementById('saas-hero-size-label').innerText = e.target.value;
                });
                document.getElementById('saas-logo-size').addEventListener('input', (e) => {
                    document.getElementById('saas-logo-size-label').innerText = e.target.value;
                });
                document.getElementById('saas-hero-image-size').addEventListener('input', (e) => {
                    document.getElementById('saas-hero-image-size-label').innerText = e.target.value;
                });
                document.getElementById('saas-hero-subtitle-size').addEventListener('input', (e) => {
                    document.getElementById('saas-hero-subtitle-size-label').innerText = e.target.value;
                });

                // File Upload Base64 Logic
                let currentLogoBase64 = tenant.logoUrl || '';
                let currentHeroBase64 = tenant.heroImageUrl || '';

                document.getElementById('saas-logo-file').addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            currentLogoBase64 = await optimizeStorefrontImage(file, 1000, 1000);
                            document.getElementById('saas-logo-preview').src = currentLogoBase64;
                            document.getElementById('saas-logo-preview-container').classList.remove('hidden');
                        } catch (error) {
                            window.alert(error instanceof Error ? error.message : 'Não foi possível processar a logo.');
                            e.target.value = '';
                        }
                    }
                });

                document.getElementById('saas-hero-file').addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            currentHeroBase64 = await optimizeStorefrontImage(file, 1920, 1440);
                            document.getElementById('saas-hero-preview').src = currentHeroBase64;
                            document.getElementById('saas-hero-preview-container').classList.remove('hidden');
                        } catch (error) {
                            window.alert(error instanceof Error ? error.message : 'Não foi possível processar a imagem.');
                            e.target.value = '';
                        }
                    }
                });

                // Preenche palavras padrão quando mudar o tema
                document.getElementById('saas-theme').addEventListener('change', (e) => {
                    const selectedTheme = e.target.value;
                    const defaults = themeDefaults[selectedTheme] || themeDefaults['design2'];
                    document.getElementById('saas-hero-1').value = defaults[0];
                    document.getElementById('saas-hero-2').value = defaults[1];
                    document.getElementById('saas-hero-3').value = defaults[2];
                    document.getElementById('saas-hero-4').value = defaults[3];
                });

                // Sobrescreve o botão Salvar para também salvar dados SaaS
                const originalSaveConfig = window.saveConfig;
                window.saveConfig = async () => {
                    const tenantsList = JSON.parse(localStorage.getItem('saas_tenants') || '[]');
                    const tenantIdx = tenantsList.findIndex(t => t.slug === tenantSlug);
                    const storefrontConfig = {
                        logoUrl: currentLogoBase64,
                        logoSize: document.getElementById('saas-logo-size').value,
                        heroImageUrl: currentHeroBase64,
                        primaryColor: document.getElementById('saas-color').value,
                        fontFamily: document.getElementById('saas-font').value,
                        bodyFontFamily: document.getElementById('saas-body-font').value,
                        heroFontFamily: document.getElementById('saas-hero-font').value,
                        theme: document.getElementById('saas-theme').value,
                        heroWord1: document.getElementById('saas-hero-1').value,
                        heroWord2: document.getElementById('saas-hero-2').value,
                        heroWord3: document.getElementById('saas-hero-3').value,
                        heroWord4: document.getElementById('saas-hero-4').value,
                        heroSubtitle: document.getElementById('saas-hero-subtitle').value,
                        heroSubtitleFont: document.getElementById('saas-hero-subtitle-font').value,
                        heroSubtitleSize: document.getElementById('saas-hero-subtitle-size').value,
                        heroFontColor: document.getElementById('saas-hero-color').value,
                        heroFontSize: document.getElementById('saas-hero-size').value,
                        heroImageSize: document.getElementById('saas-hero-image-size').value,
                        footerCopyright: document.getElementById('saas-footer-copyright-input').value,
                        footerCnpj: document.getElementById('saas-footer-cnpj-input').value
                    };

                    try {
                        const authClient = window.cleanFoodsSupabaseClient;
                        const { data: { session }, error: sessionError } = authClient
                            ? await authClient.auth.getSession()
                            : { data: { session: null }, error: null };
                        if (sessionError) throw sessionError;

                        const headers = { 'Content-Type': 'application/json' };
                        if (session?.access_token) {
                            headers.Authorization = `Bearer ${session.access_token}`;
                        }

                        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantSlug)}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify(storefrontConfig)
                        });
                        const result = await response.json().catch(() => null);
                        if (!response.ok || !result?.ok) {
                            throw new Error(result?.error || `Falha ao salvar no banco (${response.status}).`);
                        }

                        if (originalSaveConfig) await originalSaveConfig();
                        if (tenantIdx >= 0) {
                            tenantsList[tenantIdx] = {
                                ...tenantsList[tenantIdx],
                                ...storefrontConfig,
                                mercadoPagoKey: document.getElementById('saas-mp-key').value
                            };
                            localStorage.setItem('saas_tenants', JSON.stringify(tenantsList));
                        }
                        if (typeof window.showToast === 'function') {
                            window.showToast('CONFIGURAÇÕES SINCRONIZADAS COM SUCESSO!');
                        }

                        // Abre imediatamente o arquivo estrutural do tema confirmado no banco.
                        window.parent.location.href = `/${encodeURIComponent(tenantSlug)}?theme=${encodeURIComponent(storefrontConfig.theme)}`;
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Não foi possível salvar as configurações.';
                        console.error('Falha ao sincronizar a configuração com o Supabase.', error);
                        window.alert(`NÃO FOI POSSÍVEL SALVAR\n\n${message}`);
                    }
                };
            }
        }, 100);

        // Timeout de segurança: cancela o intervalo após 10 segundos para não ficar rodando infinitamente
        setTimeout(() => clearInterval(checkExist), 10000);
    }

    // Após processar tudo, mostra a página
    setTimeout(() => {
        if(document.body) {
            document.body.style.opacity = '1';
            document.body.style.visibility = 'visible';
        }
    }, 50);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSaas);
} else {
    initSaas();
}
