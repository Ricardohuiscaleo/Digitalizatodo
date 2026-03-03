const profileData = {
    roles: [
        {
            id: 'independent',
            title: "Desarrollador Full Stack & Consultor",
            company: "Soluciones Digitales Independientes",
            period: "Feb 2025 – Actualidad",
            icon: "fa-code",
            color: "text-purple-600",
            bg: "bg-purple-50",
            summary: "Arquitectura de software SaaS y PWAs para digitalización de operaciones críticas.",
            achievements: [
                "Reducción del 50% en carga administrativa manual mediante PWAs.",
                "Algoritmos Python para integración logística-financiera.",
                "Optimización de costeo de inventarios en tiempo real."
            ],
            tech: ["Python", "React", "Node.js", "SaaS"]
        },
        {
            id: 'bequarks',
            title: "Coordinador Jefe de Mejora Continua",
            company: "Be Quarks (Servicios para CMPC)",
            period: "2024 – Ene 2025",
            icon: "fa-industry",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            summary: "Liderazgo de estrategia de Excelencia Operacional para 15 sociedades en LATAM.",
            achievements: [
                "Ahorro auditado de $298,000 USD anuales mediante automatización.",
                "Reducción de tiempos de ciclo en un 80% (ACR y SLAs).",
                "Cumplimiento del 100% de los OKR anuales.",
                "Eliminación de silos de información con workflows digitales."
            ],
            tech: ["Lean Six Sigma", "Automatización", "KPIs", "Gestión Remota"]
        },
        {
            id: 'cam',
            title: "Jefe de Control de Gestión & Innovación",
            company: "CAM Seguridad SPA",
            period: "2022 – 2023",
            icon: "fa-robot",
            color: "text-blue-600",
            bg: "bg-blue-50",
            summary: "Transformación CX mediante IA y optimización de fuerza laboral.",
            achievements: [
                "Reducción del 90% en MTTR usando Chatbots/ML.",
                "Aumento de NPS del 40% al 97%.",
                "Ahorro de $30M CLP anuales por reducción de desperdicio HH.",
                "Implementación de bases de conocimiento RAG."
            ],
            tech: ["Machine Learning", "Chatbots", "Kaizen", "Postgres"]
        },
        {
            id: 'damic',
            title: "Ingeniero en Mejora de Procesos (BI)",
            company: "DAMIC SPA",
            period: "2020 – 2022",
            icon: "fa-chart-pie",
            color: "text-amber-600",
            bg: "bg-amber-50",
            summary: "Modelado predictivo y dashboards para decisiones comerciales.",
            achievements: [
                "Incremento de utilidades netas en $40M CLP anuales.",
                "Diseño de modelos predictivos con Python y SQL.",
                "Optimización de contratos y reducción de variabilidad."
            ],
            tech: ["Python", "SQL", "Power BI", "Predictive Models"]
        },
        {
            id: 'cincom',
            title: "Jefe de Control de Gestión",
            company: "Empresas Cincom SPA",
            period: "2018 – 2020",
            icon: "fa-building",
            color: "text-stone-600",
            bg: "bg-stone-100",
            summary: "Optimización de costos operativos mediante Kaizen.",
            achievements: [
                "Reducción del 15% en costos operativos ($89M CLP anuales).",
                "Mitigación de riesgos en procesos críticos."
            ],
            tech: ["Kaizen", "Cost Control", "Risk Mgmt"]
        },
        {
            id: 'army',
            title: "Logística & Abastecimiento",
            company: "Ejército de Chile",
            period: "2011 – 2018",
            icon: "fa-boxes-stacked",
            color: "text-stone-600",
            bg: "bg-stone-100",
            summary: "Gestión de Supply Chain y digitalización temprana.",
            achievements: [
                "Digitalización del 90% de documentación física.",
                "Mejora de eficiencia administrativa en un 25%.",
                "Gestión de almacenes bajo estricta disciplina."
            ],
            tech: ["Supply Chain", "Excel Avanzado", "Digitalización"]
        }
    ]
};

function initDashboard() {
    renderTimeline();
    selectRole('independent');
    setTimeout(initCharts, 100);
    setupMobileMenu();
    animateKPIs();
}

function renderTimeline() {
    renderTimelineMobile();
    renderTimelineDesktop();
}

function renderTimelineMobile() {
    const container = document.getElementById('timeline-mobile');
    if (!container) return;
    
    container.innerHTML = profileData.roles.map(role => `
        <div class="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <button onclick="toggleMobileRole('${role.id}')" class="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full ${role.bg} ${role.color} flex items-center justify-center flex-shrink-0">
                        <i class="fas ${role.icon}"></i>
                    </div>
                    <div class="text-left">
                        <h4 class="text-sm font-bold text-stone-900">${role.title}</h4>
                        <p class="text-xs text-stone-500">${role.company}</p>
                    </div>
                </div>
                <i class="fas fa-chevron-down text-stone-400 transition-transform" id="icon-${role.id}"></i>
            </button>
            <div id="content-${role.id}" class="hidden px-4 pb-4 border-t border-stone-100">
                <p class="text-sm text-stone-600 mt-3 mb-3">${role.summary}</p>
                <ul class="space-y-2 mb-3">
                    ${role.achievements.map(ach => `
                        <li class="flex items-start gap-2 text-xs">
                            <i class="fas fa-check-circle text-emerald-500 mt-0.5 flex-shrink-0"></i>
                            <span class="text-stone-700">${ach}</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="flex flex-wrap gap-1.5">
                    ${role.tech.map(t => `
                        <span class="px-2 py-1 bg-stone-50 border border-stone-200 text-stone-600 rounded text-xs">${t}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderTimelineDesktop() {
    const container = document.getElementById('timeline-desktop');
    if (!container) return;
    
    container.innerHTML = profileData.roles.map(role => `
        <button onclick="selectRole('${role.id}')" 
             id="btn-${role.id}"
             class="role-btn w-full text-left p-4 rounded-lg border-2 border-stone-200 hover:border-amber-400 hover:shadow-sm transition-all flex items-start gap-3">
            <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full ${role.bg} ${role.color} flex items-center justify-center">
                    <i class="fas ${role.icon}"></i>
                </div>
            </div>
            <div class="min-w-0 flex-1">
                <h4 class="text-sm font-bold text-stone-900">${role.title}</h4>
                <p class="text-xs text-stone-500 font-medium">${role.company}</p>
                <p class="text-xs text-stone-400 mt-1">${role.period}</p>
            </div>
        </button>
    `).join('');
}

function toggleMobileRole(id) {
    const content = document.getElementById(`content-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    const isHidden = content.classList.contains('hidden');
    
    document.querySelectorAll('[id^="content-"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="icon-"]').forEach(el => el.classList.remove('rotate-180'));
    
    if (isHidden) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
    }
}

function selectRole(id) {
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('border-amber-500', 'bg-amber-50');
        btn.classList.add('border-stone-200');
    });
    const activeBtn = document.getElementById(`btn-${id}`);
    if(activeBtn) {
        activeBtn.classList.add('border-amber-500', 'bg-amber-50');
        activeBtn.classList.remove('border-stone-200');
    }

    const role = profileData.roles.find(r => r.id === id);
    const detailContainer = document.getElementById('role-detail');
    if (!detailContainer) return;
    
    detailContainer.style.opacity = '0';
    
    setTimeout(() => {
        detailContainer.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start mb-6 border-b border-stone-100 pb-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="h-8 w-8 rounded-full ${role.bg} ${role.color} flex items-center justify-center text-sm">
                            <i class="fas ${role.icon}"></i>
                        </span>
                        <h3 class="text-xl font-bold text-stone-900">${role.title}</h3>
                    </div>
                    <p class="text-stone-600 font-medium">${role.company}</p>
                </div>
                <span class="mt-2 sm:mt-0 px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-semibold">
                    ${role.period}
                </span>
            </div>

            <div class="mb-6">
                <h5 class="text-sm font-bold text-stone-900 uppercase tracking-wide mb-2">Resumen</h5>
                <p class="text-stone-600 leading-relaxed">${role.summary}</p>
            </div>

            <div class="mb-8">
                <h5 class="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Logros Clave & Impacto</h5>
                <ul class="space-y-3">
                    ${role.achievements.map(ach => `
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check-circle text-emerald-500 mt-1 text-sm"></i>
                            <span class="text-stone-700 text-sm">${ach}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div>
                <h5 class="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Stack Tecnológico & Métodos</h5>
                <div class="flex flex-wrap gap-2">
                    ${role.tech.map(t => `
                        <span class="px-3 py-1 bg-stone-50 border border-stone-200 text-stone-600 rounded text-xs font-medium hover:bg-stone-100 hover:border-amber-300 transition-colors cursor-default">
                            ${t}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
        detailContainer.style.opacity = '1';
    }, 200);
}

function animateKPIs() {
    animateNumber('kpi-savings', 298, '$', 'k');
    animateNumber('kpi-time', 90, '', '%');
    animateNumber('kpi-nps', 97, '', '%');
}

function animateNumber(id, target, prefix = '', suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.textContent = prefix + target + suffix;
            clearInterval(timer);
        } else {
            el.textContent = prefix + Math.floor(current) + suffix;
        }
    }, 20);
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        toggleMobileMenu();
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

function setupMobileMenu() {
     window.addEventListener('resize', () => {
         const menu = document.getElementById('mobile-menu');
         if (menu && window.innerWidth >= 640 && !menu.classList.contains('hidden')) {
             menu.classList.add('hidden');
         }
     });
     
     window.addEventListener('scroll', () => {
         const btn = document.getElementById('scrollTop');
         if (btn) {
             if (window.scrollY > 300) {
                 btn.classList.remove('opacity-0', 'pointer-events-none');
             } else {
                 btn.classList.add('opacity-0', 'pointer-events-none');
             }
         }
     });
}

function initCharts() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        setTimeout(initCharts, 500);
        return;
    }
    
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = '#57534e';
    
    const ctxFin = document.getElementById('financialChart');
    if (ctxFin) {
        new Chart(ctxFin.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Be Quarks (USD)', 'Cincom (CLP Eq)', 'CAM (CLP Eq)', 'DAMIC (CLP Eq)'],
                datasets: [{
                    label: 'Impacto Financiero',
                    data: [298, 95, 32, 43],
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(168, 162, 158, 0.8)'],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const raw = context.raw;
                                if(raw === 298) return 'Ahorro: $298,000 USD';
                                if(raw === 95) return 'Ahorro: ~$89M CLP';
                                if(raw === 32) return 'Ahorro: ~$30M CLP';
                                if(raw === 43) return 'Utilidad: ~$40M CLP';
                                return raw;
                            }
                        }
                    }
                },
                scales: {
                    y: { display: false, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const ctxEff = document.getElementById('efficiencyChart');
    if (ctxEff) {
        new Chart(ctxEff.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Base Line (Manual)', 'Optimización', 'Automatización', 'Estado Actual (IA/RPA)'],
                datasets: [{
                    label: 'NPS (Calidad)',
                    data: [40, 60, 85, 97],
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Tiempo Ciclo (Inverso)',
                    data: [100, 70, 30, 10],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { tooltip: { mode: 'index', intersect: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } }
                }
            }
        });
    }

    const ctxRadar = document.getElementById('skillsRadar');
    if (ctxRadar) {
        new Chart(ctxRadar.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Lean Six Sigma', 'Python/Coding', 'Liderazgo', 'Business Intelligence', 'Operaciones/Logística', 'Estrategia'],
                datasets: [{
                    label: 'Perfil Ricardo Huiscaleo',
                    data: [95, 90, 85, 95, 90, 80],
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(16, 185, 129, 1)'
                }, {
                    label: 'Control de Gestión Tradicional',
                    data: [80, 20, 70, 40, 85, 60],
                    fill: true,
                    backgroundColor: 'rgba(168, 162, 158, 0.2)',
                    borderColor: 'rgba(168, 162, 158, 0.5)',
                    borderDash: [5, 5],
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: '#e7e5e4' },
                        grid: { color: '#e7e5e4' },
                        pointLabels: {
                            font: { size: 12, family: "'Outfit', sans-serif" },
                            color: '#44403c'
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
