/**
 * SCRIPT DE PRUEBA DE REGISTRO
 * 
 * Uso: node scripts/test_registration.js [code]
 * Ejemplo: node scripts/test_registration.js sdggvzqu
 */

const BASE_URL = 'https://admin.digitalizatodo.cl/api';

async function runTest() {
    const code = process.argv[2] || 'sdggvzqu';
    
    console.log(`🚀 Iniciando prueba para: ${code}`);
    
    try {
        // 1. Obtener info del Tenant
        const tenantRes = await fetch(`${BASE_URL}/r/${code}`);
        if (!tenantRes.ok) {
            const text = await tenantRes.text();
            console.error(`❌ Error habitando tenant (${tenantRes.status}):`, text.substring(0, 500));
            return;
        }
        const tenantData = await tenantRes.json();
        
        if (!tenantData.id) {
            console.error('❌ No se encontró el tenant');
            return;
        }
        
        const tenantId = tenantData.id;
        console.log(`✅ Tenant identificado: ${tenantData.name} (ID: ${tenantId})`);

        // 2. Preparar Payload
        const timestamp = Date.now();
        const payload = {
            guardian_name: `TEST BOT ${timestamp}`,
            guardian_email: `test.bot.${timestamp}@digitalizatodo.cl`,
            guardian_phone: "+56 9 1234 5678",
            password: "password123",
            password_confirmation: "password123",
            is_self_register: true,
            registration_mode: 'dojo',
            self_student: {
                category: "adults",
                belt: "white",
                degrees: 0,
                modality: "AMBAS",
                birth_date: "01 / 01 / 1990",
                is_new_to_jiujitsu: true,
                gender: 'male',
                weight: '75',
                height: '175'
            },
            students: [],
            adult_plan_id: 1, // Ajustar según disponibilidad (usualmente ID 1 es el base)
            accept_dojo_terms: true,
            accept_digitaliza_terms: true
        };

        // Si hay planes en el tenant, usar el primero de 'dojo'
        const firstDojoPlan = (tenantData.plans || []).find(p => p.category === 'dojo');
        if (firstDojoPlan) {
            payload.adult_plan_id = firstDojoPlan.id;
            console.log(`📌 Usando plan: ${firstDojoPlan.name} (ID: ${firstDojoPlan.id})`);
        }

        console.log('📡 Enviando registro...');
        
        const regRes = await fetch(`${BASE_URL}/${tenantId}/register-student`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        let regData;
        const regText = await regRes.text();
        try {
            regData = JSON.parse(regText);
        } catch (e) {
            console.error(`❌ El servidor no devolvió JSON (${regRes.status}):`, regText.substring(0, 500));
            return;
        }
        
        if (regRes.ok) {
            console.log('✨ REGISTRO EXITOSO!');
            console.log(JSON.stringify(regData, null, 2));
        } else {
            console.error('❌ ERROR EN REGISTRO:');
            console.error(JSON.stringify(regData, null, 2));
        }

    } catch (error) {
        console.error('💥 ERROR FATAL:', error.message);
    }
}

runTest();
