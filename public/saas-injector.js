// saas-injector.js
// Injetado nos arquivos HTML originais para habilitar o modo Multi-tenant (Fontes, Cores, Temas)

function initSaas() {
    const urlParams = new URLSearchParams(window.location.search);
    let tenantSlug = urlParams.get('tenant');

    if (tenantSlug) {
        sessionStorage.setItem('active_tenant', tenantSlug);
    } else {
        tenantSlug = sessionStorage.getItem('active_tenant');
    }

    if (!tenantSlug) return;

    // Busca dados do tenant
    const tenants = JSON.parse(localStorage.getItem('saas_tenants') || '[]');
    const tenant = tenants.find(t => t.slug === tenantSlug);
    if (!tenant) return;

    const isAdmin = window.location.pathname.includes('admin.html');

    // ========================================================
    // BLOCO STOREFRONT (apenas para páginas que não são admin)
    // ========================================================
    if (!isAdmin) {
        // 1. Aplica Cores Dinâmicas
        if (tenant.primaryColor) {
            document.documentElement.style.setProperty('--yellow', tenant.primaryColor);
            document.documentElement.style.setProperty('--cf-yellow', tenant.primaryColor);
        }

        // 2. Aplica Fontes Dinâmicas (Títulos e Corpo separadamente)
        let fontName = tenant.fontFamily || 'Inter';
        let bodyFontName = tenant.bodyFontFamily || 'Inter';

        // Formatação dos nomes para o Google Fonts
        if (fontName.startsWith('--font-')) fontName = fontName.replace('--font-', '').replace('-', ' ');
        if (fontName.toLowerCase() === 'inter') fontName = 'Inter';
        if (fontName.toLowerCase() === 'anton') fontName = 'Anton';
        if (fontName.toLowerCase() === 'permanent marker') fontName = 'Permanent Marker';

        if (bodyFontName.startsWith('--font-')) bodyFontName = bodyFontName.replace('--font-', '').replace('-', ' ');
        if (bodyFontName.toLowerCase() === 'inter') bodyFontName = 'Inter';
        if (bodyFontName.toLowerCase() === 'anton') bodyFontName = 'Anton';
        if (bodyFontName.toLowerCase() === 'permanent marker') bodyFontName = 'Permanent Marker';

        // Carrega do Google Fonts as duas fontes (se forem diferentes)
        const link = document.createElement('link');
        const fontsToLoad = [...new Set([fontName, bodyFontName])].map(f => f.replace(/ /g, '+')).join('&family=');
        link.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Sobrescreve as classes do Tailwind baseadas nas fontes do HTML antigo
        const style = document.createElement('style');
        style.innerHTML = `
            body, p, span, h3, h4, h5, h6, .font-body { font-family: "${bodyFontName}", sans-serif !important; }
            h1, h2, .font-impact { font-family: "${fontName}", sans-serif !important; }
            .font-street { font-family: "${fontName}", cursive !important; }
        `;
        document.head.appendChild(style);

        // 3. Aplica Logo Dinâmica
        if (tenant.logoUrl) {
            document.querySelectorAll('img').forEach(img => {
                if (img.src.includes('Logonova.jpeg') || img.src.includes('logo')) {
                    img.src = tenant.logoUrl;
                    img.classList.remove('mix-blend-screen');
                    img.style.objectFit = 'contain';
                }
            });
        }

        if (tenant.heroImageUrl) {
            const heroImage = document.getElementById('saas-hero-image');
            if (heroImage) heroImage.src = tenant.heroImageUrl;
        }

        // Altera nome da loja no título
        document.title = tenant.name;

        const themeDefaults = {
            'design1': ['Dieta', 'LIMPA', 'Treino', 'PESADO.'],
            'design2': ['Comida.', 'Treino.', 'Foco.', 'Resultados.'],
            'design3': ['NO PAIN', 'No Gain', 'Pra quem treina pesado', ''],
            'design4': ['A Arte da', 'Alta Gastronomia', 'Fitness', ''],
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
            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) {
                const spans = heroTitle.querySelectorAll('span');
                if (spans.length >= 4) {
                    const currentTheme = tenant.theme || 'design1';
                    const defaults = themeDefaults[currentTheme] || themeDefaults['design1'];

                    spans[0].innerText = tenant.heroWord1 || defaults[0];

                    const w2 = tenant.heroWord2 || defaults[1];
                    spans[1].innerText = w2;
                    spans[1].setAttribute('data-text', w2);

                    spans[2].innerText = tenant.heroWord3 || defaults[2];
                    spans[3].innerText = tenant.heroWord4 || defaults[3];

                    // Oculta spans vazios
                    spans.forEach(span => {
                        if (!span.innerText.trim()) {
                            span.style.display = 'none';
                        } else {
                            span.style.display = 'block';
                        }
                    });
                }
            }
        }

        // 5. Aplica os 9 Designs Dinâmicos
        const themeStyle = document.createElement('style');
        let cssRules = '';

        switch (tenant.theme) {
            case 'design2':
                cssRules = `
                    * { clip-path: none !important; border-radius: 0 !important; }
                    #products-container > div, .bg-cf-darkgray, button {
                        border: 2px solid #fff !important;
                        box-shadow: 6px 6px 0 var(--yellow) !important;
                        transition: transform 0.1s, box-shadow 0.1s !important;
                    }
                    button:active {
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
                    button { box-shadow: none !important; border-radius: 4px !important; }
                `;
                break;
            case 'design8':
                cssRules = `
                    h3.font-bold.text-xl { font-size: 1.8rem !important; line-height: 1.2 !important; }
                    .text-cf-yellow.font-bold { font-size: 2rem !important; }
                    button { font-size: 1.2rem !important; padding: 1rem 2rem !important; }
                `;
                break;
            case 'design9':
                cssRules = `
                    * { border-radius: 12px !important; clip-path: none !important; }
                    button { border-radius: 20px !important; }
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
            'design4': ['A Arte da', 'Alta Gastronomia', 'Fitness', ''],
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
                                <label class="block text-xs uppercase font-bold text-gray-400 mb-2">URL do Logo da Franquia</label>
                                <input type="text" id="saas-logo" value="${tenant.logoUrl || ''}" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none transition-colors" placeholder="https://site.com/logo.png">
                            </div>

                            <div class="bg-cf-black p-4 border border-cf-gray rounded space-y-3 mt-4">
                                <h4 class="font-bold text-sm text-cf-yellow uppercase mb-2">Textos da Página Inicial (Hero)</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 1</label>
                                        <input type="text" id="saas-hero-1" value="${(tenant.heroWord1 !== undefined && tenant.heroWord1 !== '') ? tenant.heroWord1 : (themeDefaults[tenant.theme || 'design1'] || themeDefaults['design1'])[0]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 2</label>
                                        <input type="text" id="saas-hero-2" value="${(tenant.heroWord2 !== undefined && tenant.heroWord2 !== '') ? tenant.heroWord2 : (themeDefaults[tenant.theme || 'design1'] || themeDefaults['design1'])[1]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 3</label>
                                        <input type="text" id="saas-hero-3" value="${(tenant.heroWord3 !== undefined && tenant.heroWord3 !== '') ? tenant.heroWord3 : (themeDefaults[tenant.theme || 'design1'] || themeDefaults['design1'])[2]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-400 mb-1">Palavra 4</label>
                                        <input type="text" id="saas-hero-4" value="${(tenant.heroWord4 !== undefined && tenant.heroWord4 !== '') ? tenant.heroWord4 : (themeDefaults[tenant.theme || 'design1'] || themeDefaults['design1'])[3]}" class="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none">
                                    </div>
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

                            <div class="flex gap-4 mt-4">
                                <div class="flex-1">
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
                                <div class="flex-1">
                                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tipografia (Corpo/Cardápio)</label>
                                    <select id="saas-body-font" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                        <option value="Inter" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Inter' ? 'selected' : ''}>1. Inter (Moderna / Neutra)</option>
                                        <option value="Roboto" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Roboto' ? 'selected' : ''}>2. Roboto (Clássica do Google)</option>
                                        <option value="Montserrat" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Montserrat' ? 'selected' : ''}>3. Montserrat (Geométrica / Elegante)</option>
                                        <option value="Poppins" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Poppins' ? 'selected' : ''}>4. Poppins (Arredondada / Amigável)</option>
                                        <option value="Lato" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Lato' ? 'selected' : ''}>5. Lato (Leve e Harmônica)</option>
                                        <option value="Oswald" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Oswald' ? 'selected' : ''}>6. Oswald (Alta e Fina)</option>
                                        <option value="Arial" ${(tenant.bodyFontFamily || tenant.fontFamily) === 'Arial' ? 'selected' : ''}>7. Arial (Clássica)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs uppercase font-bold text-gray-400 mb-2">Tema / Design Base (9 Opções)</label>
                                <select id="saas-theme" class="w-full bg-cf-black text-white border border-cf-gray rounded px-3 py-2 font-bold focus:border-cf-yellow outline-none">
                                    <option value="design1" ${tenant.theme === 'design1' ? 'selected' : ''}>1. Design Padrão (Efeito Rasgado)</option>
                                    <option value="design2" ${tenant.theme === 'design2' ? 'selected' : ''}>2. Retrô Block (HQ)</option>
                                    <option value="design3" ${tenant.theme === 'design3' ? 'selected' : ''}>3. Minimalista (Clean)</option>
                                    <option value="design4" ${tenant.theme === 'design4' ? 'selected' : ''}>4. Lista Compacta</option>
                                    <option value="design5" ${tenant.theme === 'design5' ? 'selected' : ''}>5. Sombra Elevada (Flutuante)</option>
                                    <option value="design6" ${tenant.theme === 'design6' ? 'selected' : ''}>6. Neon Cyberpunk</option>
                                    <option value="design7" ${tenant.theme === 'design7' ? 'selected' : ''}>7. Flat Moderno</option>
                                    <option value="design8" ${tenant.theme === 'design8' ? 'selected' : ''}>8. Tipografia Maximizada</option>
                                    <option value="design9" ${tenant.theme === 'design9' ? 'selected' : ''}>9. Suave e Arredondado</option>
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

                // Preenche palavras padrão quando mudar o tema
                document.getElementById('saas-theme').addEventListener('change', (e) => {
                    const selectedTheme = e.target.value;
                    const defaults = themeDefaults[selectedTheme] || themeDefaults['design1'];
                    document.getElementById('saas-hero-1').value = defaults[0];
                    document.getElementById('saas-hero-2').value = defaults[1];
                    document.getElementById('saas-hero-3').value = defaults[2];
                    document.getElementById('saas-hero-4').value = defaults[3];
                });

                // Sobrescreve o botão Salvar para também salvar dados SaaS
                const originalSaveConfig = window.saveConfig;
                window.saveConfig = async () => {
                    if (originalSaveConfig) await originalSaveConfig();

                    const tenantsList = JSON.parse(localStorage.getItem('saas_tenants') || '[]');
                    const tenantIdx = tenantsList.findIndex(t => t.slug === tenantSlug);
                    if (tenantIdx >= 0) {
                        tenantsList[tenantIdx] = {
                            ...tenantsList[tenantIdx],
                            logoUrl: document.getElementById('saas-logo').value,
                            primaryColor: document.getElementById('saas-color').value,
                            mercadoPagoKey: document.getElementById('saas-mp-key').value,
                            fontFamily: document.getElementById('saas-font').value,
                            bodyFontFamily: document.getElementById('saas-body-font').value,
                            theme: document.getElementById('saas-theme').value,
                            heroWord1: document.getElementById('saas-hero-1').value,
                            heroWord2: document.getElementById('saas-hero-2').value,
                            heroWord3: document.getElementById('saas-hero-3').value,
                            heroWord4: document.getElementById('saas-hero-4').value
                        };
                        localStorage.setItem('saas_tenants', JSON.stringify(tenantsList));

                        // Recarrega a página pai (Next.js) para aplicar os temas
                        window.parent.location.reload();
                    }
                };
            }
        }, 100);

        // Timeout de segurança: cancela o intervalo após 10 segundos para não ficar rodando infinitamente
        setTimeout(() => clearInterval(checkExist), 10000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSaas);
} else {
    initSaas();
}
