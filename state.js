import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
dayjs.extend(relativeTime);
dayjs.locale('es');

export const state = {
  courses: [
    { id: 1, level: 'Básico', type: 'General', title: 'Inglés desde cero', img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop', blurb: 'Fundamentos para empezar con confianza.' },
    { id: 2, level: 'Intermedio', type: 'Negocios', title: 'Inglés de negocios', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=1200&auto=format&fit=crop', blurb: 'Reuniones, emails y presentaciones.' },
    { id: 3, level: 'Avanzado', type: 'Exámenes', title: 'Preparación IELTS', img: 'https://images.unsplash.com/photo-1518081461904-9ac7f44beab6?q=80&w=1200&auto=format&fit=crop', blurb: 'Estrategias y práctica intensiva.' },
    { id: 4, level: 'Intermedio', type: 'General', title: 'Conversación diaria', img: 'https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?q=80&w=1200&auto=format&fit=crop', blurb: 'Fluidez y expresiones comunes.' },
    { id: 5, level: 'Básico', type: 'Exámenes', title: 'Cambridge A2 Key', img: 'https://images.unsplash.com/photo-1518085250887-2f903c200fee?q=80&w=1200&auto=format&fit=crop', blurb: 'Prepárate para tu primer certificado.' },
    { id: 6, level: 'Avanzado', type: 'Negocios', title: 'Inglés ejecutivo', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop', blurb: 'Negociación y liderazgo.' },
    // New complex/premium courses
    { id: 7, level: 'Intermedio', type: 'General', title: 'Fluidez conversacional con IA', premium: true, img: 'https://images.unsplash.com/photo-1523249601702-8daed09f6b89?q=80&w=1200&auto=format&fit=crop', blurb: 'Role-plays con agentes de IA: cafetería, reuniones y viajes.' },
    { id: 8, level: 'Avanzado', type: 'Negocios', title: 'Inglés para Data & Tech', premium: true, img: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop', blurb: 'Revisión de PRs, presentaciones técnicas y negociación de features.' },
    { id: 9, level: 'Básico', type: 'Exámenes', title: 'Cambridge A2 Intensivo', premium: false, img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop', blurb: 'Plan acelerado con microlecciones y tests adaptativos.' }
  ],
  threads: [
    { id: 't1', title: '¿Cómo mejorar la pronunciación de la "TH"?', author: 'Lucía', time: dayjs().subtract(2, 'hour') },
    { id: 't2', title: 'Recomendaciones para escuchar podcasts', author: 'Marco', time: dayjs().subtract(1, 'day') },
    { id: 't3', title: 'Trucos para ampliar vocabulario rápidamente', author: 'Sara', time: dayjs().subtract(3, 'day') }
  ],
  activity: [
    { id:'a1', text:'Completaste la lección "Present Simple vs Present Continuous"', time: dayjs().subtract(3,'hour') },
    { id:'a2', text:'Obtuviste la insignia "Racha x7"', time: dayjs().subtract(1,'day') },
    { id:'a3', text:'Participaste en el hilo "Pronunciación de la TH"', time: dayjs().subtract(5,'day') }
  ],
  progress: 42,
  persona: JSON.parse(localStorage.getItem('dea_persona') || localStorage.getItem('fluentleap_persona') || 'null'),
  currentProfile: null
};