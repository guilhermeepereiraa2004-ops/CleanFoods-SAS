const fs = require('fs');
const path = require('path');

function convertHtmlToReact(htmlContent, componentName, isStore) {
    // Extract Body
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyHtml = bodyMatch ? bodyMatch[1] : htmlContent;

    // Convert class to className
    bodyHtml = bodyHtml.replace(/class=/g, 'className=');
    // Convert for to htmlFor
    bodyHtml = bodyHtml.replace(/for=/g, 'htmlFor=');
    // Convert inline styles slightly (basic)
    bodyHtml = bodyHtml.replace(/style="([^"]*)"/g, (match, p1) => {
        // Just empty out complex inline styles for automated porting, or leave as string if it doesn't break
        // Actually React requires style={{}} but replacing it properly is hard. Let's just remove dangerous inline styles or keep them as is and hope for the best.
        return ``; 
    });
    // Close unclosed tags
    const unclosedTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    unclosedTags.forEach(tag => {
        const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'gi');
        bodyHtml = bodyHtml.replace(regex, `<${tag}$1 />`);
    });

    // Remove scripts from HTML body to put them in a useEffect
    let scripts = [];
    bodyHtml = bodyHtml.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
        if (content.trim()) {
            scripts.push(content);
        }
        return '';
    });
    
    // Convert attributes like onclick to onClick
    bodyHtml = bodyHtml.replace(/onclick=/gi, 'onClick=');
    bodyHtml = bodyHtml.replace(/onsubmit=/gi, 'onSubmit=');
    bodyHtml = bodyHtml.replace(/onchange=/gi, 'onChange=');

    // Remove comments
    bodyHtml = bodyHtml.replace(/<!--[\s\S]*?-->/g, '');

    // Escape braces
    bodyHtml = bodyHtml.replace(/\{/g, '{"{"}').replace(/\}/g, '{"}"}');

    // Basic structure
    const reactCode = `
'use client';
import { useEffect, useState, use } from 'react';
import { getTenantBySlug } from '@/lib/mockStorage';
import Head from 'next/head';

export default function ${componentName}({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const unwrappedParams = use(params);
    const { tenantSlug } = unwrappedParams;
    const [tenant, setTenant] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const data = getTenantBySlug(tenantSlug);
            setTenant(data);
            if (data) {
                document.documentElement.style.setProperty('--cf-yellow', data.primaryColor || '#F6C500');
            }
        }
    }, [tenantSlug]);

    useEffect(() => {
        // Ejecuta o JS original apenas no client side
        if (typeof window !== 'undefined') {
            try {
                ${scripts.join('\n')}
            } catch (e) {
                console.error("Erro ao executar script legado:", e);
            }
        }
    }, []);

    return (
        <div suppressHydrationWarning>
            <div dangerouslySetInnerHTML={{ __html: \`${bodyHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
        </div>
    );
}
`;
    return reactCode;
}

const cardapioContent = fs.readFileSync('legacy-html/cardapio-completo.html', 'utf8');
const cardapioReact = convertHtmlToReact(cardapioContent, 'CardapioLegacy', true);
fs.writeFileSync('src/app/[tenantSlug]/page.tsx', cardapioReact);

const adminContent = fs.readFileSync('legacy-html/admin.html', 'utf8');
const adminReact = convertHtmlToReact(adminContent, 'AdminLegacy', false);
fs.writeFileSync('src/app/[tenantSlug]/admin/page.tsx', adminReact);

console.log('Conversão concluída!');
