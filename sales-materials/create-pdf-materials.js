#!/usr/bin/env node
/**
 * Script para generar materiales de venta en PDF
 * Convierte los archivos Markdown a PDFs profesionales con screenshots
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const marked = require('marked');

class PDFMaterialsGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, 'pdfs');
        this.templatesDir = path.join(__dirname, 'templates');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
    }

    async initialize() {
        // Crear directorios necesarios
        await this.ensureDirectories();

        // Inicializar Puppeteer
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async ensureDirectories() {
        const dirs = [this.outputDir, this.templatesDir, this.screenshotsDir];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }

    async generateAllMaterials() {
        console.log('🚀 Generando materiales de venta en PDF...');

        try {
            // Generar PDFs individuales
            await this.generateExecutiveSummary();
            await this.generateTechnicalBrochure();
            await this.generateCaseStudies();
            await this.generatePerformanceMetrics();

            // Generar PDF combinado
            await this.generateCompleteSalesKit();

            console.log('✅ Todos los materiales generados exitosamente');

        } catch (error) {
            console.error('❌ Error generando materiales:', error);
        }
    }

    async generateExecutiveSummary() {
        console.log('📊 Generando Resumen Ejecutivo...');

        const markdown = await fs.readFile(path.join(__dirname, 'executive-summary.md'), 'utf-8');
        const html = await this.convertMarkdownToHTML(markdown, 'Resumen Ejecutivo');

        await this.generatePDF(html, 'executive-summary.pdf', {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            displayHeaderFooter: true,
            headerTemplate: this.getHeaderTemplate('Digital English Academy - Resumen Ejecutivo'),
            footerTemplate: this.getFooterTemplate()
        });
    }

    async generateTechnicalBrochure() {
        console.log('🔧 Generando Brochure Técnico...');

        const markdown = await fs.readFile(path.join(__dirname, 'technical-brochure.md'), 'utf-8');
        const html = await this.convertMarkdownToHTML(markdown, 'Brochure Técnico Enterprise');

        await this.generatePDF(html, 'technical-brochure.pdf', {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            displayHeaderFooter: true,
            headerTemplate: this.getHeaderTemplate('Digital English Academy - Especificaciones Técnicas'),
            footerTemplate: this.getFooterTemplate()
        });
    }

    async generateCaseStudies() {
        console.log('📈 Generando Casos de Estudio...');

        const markdown = await fs.readFile(path.join(__dirname, 'case-studies.md'), 'utf-8');
        const html = await this.convertMarkdownToHTML(markdown, 'Casos de Estudio Enterprise');

        await this.generatePDF(html, 'case-studies.pdf', {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            displayHeaderFooter: true,
            headerTemplate: this.getHeaderTemplate('Digital English Academy - Casos de Éxito'),
            footerTemplate: this.getFooterTemplate()
        });
    }

    async generatePerformanceMetrics() {
        console.log('📊 Generando Métricas de Rendimiento...');

        const markdown = await fs.readFile(path.join(__dirname, 'performance-metrics.md'), 'utf-8');
        const html = await this.convertMarkdownToHTML(markdown, 'Métricas de Rendimiento Enterprise');

        await this.generatePDF(html, 'performance-metrics.pdf', {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            displayHeaderFooter: true,
            headerTemplate: this.getHeaderTemplate('Digital English Academy - Métricas de Rendimiento'),
            footerTemplate: this.getFooterTemplate()
        });
    }

    async generateCompleteSalesKit() {
        console.log('📦 Generando Kit Completo de Ventas...');

        // Combinar todos los materiales
        const materials = [
            { file: 'executive-summary.md', title: 'Resumen Ejecutivo' },
            { file: 'technical-brochure.md', title: 'Especificaciones Técnicas' },
            { file: 'case-studies.md', title: 'Casos de Estudio' },
            { file: 'performance-metrics.md', title: 'Métricas de Rendimiento' }
        ];

        let combinedContent = this.getCoverPage();

        for (const material of materials) {
            const markdown = await fs.readFile(path.join(__dirname, material.file), 'utf-8');
            combinedContent += `\n\n<div class="page-break"></div>\n\n`;
            combinedContent += `# ${material.title}\n\n${markdown}`;
        }

        const html = await this.convertMarkdownToHTML(combinedContent, 'Kit Completo de Ventas Enterprise');

        await this.generatePDF(html, 'complete-sales-kit.pdf', {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            displayHeaderFooter: true,
            headerTemplate: this.getHeaderTemplate('Digital English Academy - Kit de Ventas Enterprise'),
            footerTemplate: this.getFooterTemplate()
        });
    }

    async convertMarkdownToHTML(markdown, title) {
        const htmlContent = marked.parse(markdown);

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                ${this.getStyles()}
            </style>
        </head>
        <body>
            <div class="container">
                ${htmlContent}
            </div>
        </body>
        </html>
        `;
    }

    getStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
            }

            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            h1 {
                color: #2c3e50;
                font-size: 2.5rem;
                margin-bottom: 1rem;
                border-bottom: 3px solid #3498db;
                padding-bottom: 0.5rem;
            }

            h2 {
                color: #34495e;
                font-size: 1.8rem;
                margin: 2rem 0 1rem 0;
                border-left: 4px solid #3498db;
                padding-left: 1rem;
            }

            h3 {
                color: #2c3e50;
                font-size: 1.4rem;
                margin: 1.5rem 0 0.8rem 0;
            }

            h4 {
                color: #34495e;
                font-size: 1.2rem;
                margin: 1rem 0 0.5rem 0;
            }

            p {
                margin-bottom: 1rem;
                text-align: justify;
            }

            ul, ol {
                margin: 1rem 0 1rem 2rem;
            }

            li {
                margin-bottom: 0.5rem;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
                font-size: 0.9rem;
            }

            th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }

            th {
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }

            tr:nth-child(even) {
                background-color: #f8f9fa;
            }

            blockquote {
                border-left: 4px solid #3498db;
                margin: 1.5rem 0;
                padding: 1rem 1.5rem;
                background-color: #f8f9fa;
                font-style: italic;
            }

            code {
                background-color: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }

            pre {
                background-color: #f4f4f4;
                padding: 1rem;
                border-radius: 5px;
                overflow-x: auto;
                margin: 1rem 0;
            }

            pre code {
                background: none;
                padding: 0;
            }

            .page-break {
                page-break-before: always;
            }

            .highlight {
                background-color: #fff3cd;
                padding: 0.5rem;
                border-radius: 3px;
                border-left: 4px solid #ffc107;
            }

            .success {
                background-color: #d4edda;
                color: #155724;
                padding: 0.5rem;
                border-radius: 3px;
                border-left: 4px solid #28a745;
            }

            .info {
                background-color: #d1ecf1;
                color: #0c5460;
                padding: 0.5rem;
                border-radius: 3px;
                border-left: 4px solid #17a2b8;
            }

            .warning {
                background-color: #fff3cd;
                color: #856404;
                padding: 0.5rem;
                border-radius: 3px;
                border-left: 4px solid #ffc107;
            }

            .cover-page {
                text-align: center;
                padding: 4rem 2rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
                margin-bottom: 2rem;
            }

            .cover-title {
                font-size: 3rem;
                margin-bottom: 1rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .cover-subtitle {
                font-size: 1.5rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }

            .cover-date {
                font-size: 1rem;
                opacity: 0.8;
            }

            @media print {
                body {
                    font-size: 12pt;
                }
                
                .page-break {
                    page-break-before: always;
                }
                
                h1, h2, h3 {
                    page-break-after: avoid;
                }
                
                table {
                    page-break-inside: avoid;
                }
            }
        `;
    }

    getCoverPage() {
        const currentDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
        <div class="cover-page">
            <h1 class="cover-title">🎓 Digital English Academy</h1>
            <p class="cover-subtitle">Kit Completo de Ventas Enterprise</p>
            <p class="cover-subtitle">Plataforma de Aprendizaje de Inglés de Clase Mundial</p>
            <div style="margin: 3rem 0;">
                <p><strong>✅ Arquitectura Cloud-Native Escalable</strong></p>
                <p><strong>📊 Monitoreo y Analytics Avanzados</strong></p>
                <p><strong>🔒 Seguridad Enterprise</strong></p>
                <p><strong>⚡ Auto-scaling Inteligente</strong></p>
                <p><strong>💰 ROI Comprobado 425%+</strong></p>
            </div>
            <p class="cover-date">${currentDate}</p>
            <p class="cover-date">Versión 2024.1 - Confidencial</p>
        </div>
        `;
    }

    getHeaderTemplate(title) {
        return `
        <div style="font-size: 10px; padding: 5px 15px; width: 100%; background: #f8f9fa; border-bottom: 1px solid #ddd;">
            <span style="float: left;">${title}</span>
            <span style="float: right;">Digital English Academy</span>
        </div>
        `;
    }

    getFooterTemplate() {
        return `
        <div style="font-size: 10px; padding: 5px 15px; width: 100%; background: #f8f9fa; border-top: 1px solid #ddd;">
            <span style="float: left;">© 2024 Digital English Academy - Confidencial</span>
            <span style="float: right;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
        `;
    }

    async generatePDF(html, filename, options = {}) {
        const page = await this.browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const defaultOptions = {
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        };

        const pdfOptions = { ...defaultOptions, ...options };

        const pdfPath = path.join(this.outputDir, filename);
        await page.pdf({ ...pdfOptions, path: pdfPath });

        await page.close();

        console.log(`✅ PDF generado: ${filename}`);
    }

    async takeScreenshots() {
        console.log('📸 Tomando screenshots de la demo...');

        const page = await this.browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        const screenshots = [
            {
                url: 'http://localhost:3000',
                filename: 'app-homepage.png',
                description: 'Página principal de la aplicación'
            },
            {
                url: 'http://localhost:3001',
                filename: 'grafana-dashboard.png',
                description: 'Dashboard de Grafana con métricas'
            },
            {
                url: 'http://localhost:9090',
                filename: 'prometheus-metrics.png',
                description: 'Métricas de Prometheus'
            }
        ];

        for (const screenshot of screenshots) {
            try {
                await page.goto(screenshot.url, { waitUntil: 'networkidle0', timeout: 10000 });
                await page.screenshot({
                    path: path.join(this.screenshotsDir, screenshot.filename),
                    fullPage: true
                });
                console.log(`📸 Screenshot tomado: ${screenshot.filename}`);
            } catch (error) {
                console.warn(`⚠️ No se pudo tomar screenshot de ${screenshot.url}: ${error.message}`);
            }
        }

        await page.close();
    }

    async generateScreenshotReport() {
        console.log('📋 Generando reporte de screenshots...');

        const screenshotFiles = await fs.readdir(this.screenshotsDir);

        let reportHTML = `
        <div class="cover-page">
            <h1 class="cover-title">📸 Screenshots de la Demo</h1>
            <p class="cover-subtitle">Digital English Academy - Capturas de Pantalla</p>
        </div>
        `;

        for (const file of screenshotFiles) {
            if (file.endsWith('.png')) {
                const imagePath = path.join(this.screenshotsDir, file);
                const imageBase64 = await fs.readFile(imagePath, 'base64');

                reportHTML += `
                <div class="page-break"></div>
                <h2>${file.replace('.png', '').replace('-', ' ').toUpperCase()}</h2>
                <img src="data:image/png;base64,${imageBase64}" style="width: 100%; max-width: 800px; border: 1px solid #ddd; border-radius: 5px; margin: 1rem 0;">
                `;
            }
        }

        const html = await this.convertMarkdownToHTML(reportHTML, 'Screenshots de la Demo');
        await this.generatePDF(html, 'demo-screenshots.pdf');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async generateReadme() {
        const readmeContent = `# 📄 Materiales de Venta - Digital English Academy

## 📦 Contenido del Kit de Ventas

Este directorio contiene todos los materiales de venta profesionales para Digital English Academy, optimizados para presentaciones a clientes enterprise.

### 📋 Documentos Disponibles

#### PDFs Generados
- \`executive-summary.pdf\` - Resumen ejecutivo con propuesta de valor
- \`technical-brochure.pdf\` - Especificaciones técnicas detalladas
- \`case-studies.pdf\` - Casos de estudio con ROI comprobado
- \`performance-metrics.pdf\` - Métricas de rendimiento y benchmarks
- \`complete-sales-kit.pdf\` - Kit completo combinado
- \`demo-screenshots.pdf\` - Capturas de pantalla de la demo

#### Archivos Fuente
- \`executive-summary.md\` - Resumen ejecutivo (fuente)
- \`technical-brochure.md\` - Brochure técnico (fuente)
- \`case-studies.md\` - Casos de estudio (fuente)
- \`performance-metrics.md\` - Métricas de rendimiento (fuente)

### 🚀 Cómo Generar los PDFs

\`\`\`bash
# Instalar dependencias
npm install puppeteer marked

# Generar todos los materiales
node create-pdf-materials.js

# Los PDFs se generarán en el directorio ./pdfs/
\`\`\`

### 📊 Uso Recomendado

#### Para Decisores Ejecutivos
- **executive-summary.pdf** - Presentación inicial (15-20 min)
- **case-studies.pdf** - Casos de éxito y ROI

#### Para Equipos Técnicos
- **technical-brochure.pdf** - Arquitectura y especificaciones
- **performance-metrics.pdf** - Benchmarks y métricas

#### Para Presentaciones Completas
- **complete-sales-kit.pdf** - Kit completo (60-90 min)
- **demo-screenshots.pdf** - Apoyo visual para demos

### 🎯 Audiencias Objetivo

- **C-Level Executives** - Enfoque en ROI y beneficios estratégicos
- **CTOs/VPs Engineering** - Arquitectura técnica y escalabilidad
- **Procurement Teams** - Comparaciones de costos y términos
- **End Users** - Experiencia de usuario y funcionalidades

### 📞 Contacto de Ventas

- **Email**: enterprise@denglishacademy.com
- **Demo Interactiva**: [demo.denglishacademy.com](https://demo.denglishacademy.com)
- **Calendario**: [calendly.com/dea-enterprise](https://calendly.com/dea-enterprise)

---

*Materiales actualizados: ${new Date().toLocaleDateString('es-ES')}*  
*Versión: 2024.1*  
*Confidencial - Solo para uso interno de ventas*
`;

        await fs.writeFile(path.join(__dirname, 'README.md'), readmeContent);
        console.log('✅ README.md generado');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const generator = new PDFMaterialsGenerator();

    generator.initialize()
        .then(() => generator.generateAllMaterials())
        .then(() => generator.takeScreenshots())
        .then(() => generator.generateScreenshotReport())
        .then(() => generator.generateReadme())
        .then(() => generator.cleanup())
        .then(() => {
            console.log('🎉 ¡Todos los materiales de venta generados exitosamente!');
            console.log('📁 Revisa el directorio ./pdfs/ para los archivos generados');
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = PDFMaterialsGenerator;