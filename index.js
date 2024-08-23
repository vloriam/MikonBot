const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { OpenAI } = require('openai');
require('dotenv').config();

// Configuración del cliente de OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Configuración del cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Objeto para almacenar el estado de los usuarios
const userStates = {};

client.on('qr', (qr) => {
    // Genera y muestra el código QR en la terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('El bot está listo y conectado a WhatsApp');
});

client.on('message', async message => {
    const text = message.body.trim().toLowerCase();
    const chatId = message.from; // Utilizar el ID del chat para identificar al usuario

    // Saludo inicial
    if (text === 'hola') {
        userStates[chatId] = {}; // Reinicia el estado del usuario
        message.reply('Hola, bienvenido al generador de contratos de Mikonsulting. Te ayudaré en la generación del contrato que requieras. Escribe la opción deseada: Emprendedores, Pymes, Empresas o Contratos Especiales.');
        return;
    }

    // Detectar opciones a partir de texto largo
    const category = detectCategory(text);
    if (category) {
        userStates[chatId] = { category }; // Guarda la categoría seleccionada
        let reply = '';
        if (category === 'emprendedores') {
            reply = 'Has seleccionado "Emprendedores". Elige una subcategoría:\n1. Contrato individual de trabajo\n2. Convenio de confidencialidad\n3. Formato de renuncia';
        } else if (category === 'pymes') {
            reply = 'Has seleccionado "Pymes". Elige una subcategoría:\n1. Contrato de arrendamiento\n2. Prestación de servicios profesionales\n3. Contrato individual de trabajo indeterminado\n4. Convenio de confidencialidad\n5. Formato de renuncia';
        } else if (category === 'empresas') {
            reply = 'Has seleccionado "Empresas". Elige una subcategoría:\n1. Contrato de arrendamiento\n2. Contrato de prestación de servicios profesionales\n3. Contrato individual de trabajo indeterminado\n4. Convenio de confidencialidad\n5. Política de corrupción y lavado de dinero\n6. Formato de renuncia\n7. Periodo de prueba';
        } else if (category === 'contratos especiales') {
            reply = 'Gracias por tu interés en los Contratos Especiales. Un asesor se pondrá en contacto contigo en breve para proporcionarte la información sobre contratos personalizados.';
        }
        message.reply(reply);
        return;
    }

    // Manejar subcategorías por número o palabra clave
    const state = userStates[chatId];
    if (state && state.category) {
        const subCategory = getSubCategoryOption(text);
        if (subCategory) {
            handleSubCategory(state.category, subCategory, message);
        } else {
            message.reply('Opción no válida. Por favor, elige una subcategoría válida.');
        }
        return;
    }

    // Interacción con OpenAI
    if (text.startsWith('pregunta:')) {
        const prompt = text.replace('pregunta:', '').trim();
        try {
            const response = await openai.completions.create({
                model: "text-davinci-003",
                prompt: prompt,
                max_tokens: 150,
            });

            message.reply(response.choices[0].text.trim());
        } catch (error) {
            message.reply('Hubo un error al procesar tu pregunta.');
            console.error('Error de OpenAI:', error);
        }
        return;
    }

    // Respuesta por defecto si no se reconoce el mensaje
    message.reply('Lo siento, no entendí tu mensaje. Por favor, elige una opción válida.');
});

// Función para manejar subcategorías
const handleSubCategory = (category, option, message) => {
    const links = {
        'emprendedores': {
            '1': 'Aquí tienes el Contrato individual de trabajo: [enlace](https://forms.fillout.com/t/rFuivxy4VZus)',
            '2': 'Aquí tienes el Convenio de confidencialidad: [enlace](https://forms.fillout.com/t/jB8H97bfsgus)',
            '3': 'Aquí tienes el Formato de renuncia: [enlace](https://forms.fillout.com/t/ruA6WExP3bus)',
        },
        'pymes': {
            '1': 'Aquí tienes el Contrato de arrendamiento: [enlace](https://forms.fillout.com/t/9qWmRX7etGus)',
            '2': 'Aquí tienes la Prestación de servicios profesionales: [enlace](https://forms.fillout.com/t/ay6S46jnW7us)',
            '3': 'Aquí tienes el Contrato individual de trabajo indeterminado: [enlace](https://forms.fillout.com/t/9bqczuTSWaus)',
            '4': 'Aquí tienes el Convenio de confidencialidad: [enlace](https://forms.fillout.com/t/jB8H97bfsgus)',
            '5': 'Aquí tienes el Formato de renuncia: [enlace](https://forms.fillout.com/t/ruA6WExP3bus)',
        },
        'empresas': {
            '1': 'Aquí tienes el Contrato de arrendamiento: [enlace](https://forms.fillout.com/t/9qWmRX7etGus)',
            '2': 'Aquí tienes el Contrato de prestación de servicios profesionales: [enlace](https://forms.fillout.com/t/ay6S46jnW7us)',
            '3': 'Aquí tienes el Contrato individual de trabajo indeterminado: [enlace](https://forms.fillout.com/t/9bqczuTSWaus)',
            '4': 'Aquí tienes el Convenio de confidencialidad: [enlace](https://forms.fillout.com/t/jB8H97bfsgus)',
            '5': 'Aquí tienes la Política de corrupción y lavado de dinero: [enlace](https://forms.fillout.com/t/ka9KicUaW3us)',
            '6': 'Aquí tienes el Formato de renuncia: [enlace](https://forms.fillout.com/t/ruA6WExP3bus)',
            '7': 'Aquí tienes el Periodo de prueba: [enlace](https://forms.fillout.com/t/vw8TSMDLKDus)',
        },
        'contratos especiales': {
            '1': 'Aquí tienes el Contrato de servicios: [enlace](https://example.com/contrato-servicios)',
            '2': 'Aquí tienes el Contrato de alquiler: [enlace](https://example.com/contrato-alquiler)',
        },
    };

    const response = links[category] && links[category][option];
    if (response) {
        message.reply(response);
    } else {
        message.reply('No se encontró la opción seleccionada.');
    }
};

// Función para detectar categoría a partir de un texto
const detectCategory = (text) => {
    const categories = ['emprendedores', 'pymes', 'empresas', 'contratos especiales'];
    for (const category of categories) {
        if (text.includes(category)) {
            return category;
        }
    }
    return null;
};

// Función para mapear opciones de texto a números
const getSubCategoryOption = (text) => {
    const map = {
        'contrato individual de trabajo': '1',
        'convenio de confidencialidad': '2',
        'formato de renuncia': '3',
        'contrato de arrendamiento': '1',
        'prestación de servicios profesionales': '2',
        'contrato individual de trabajo indeterminado': '3',
        'periodo de prueba': '4',
        'política de corrupción y lavado de dinero': '5',
        'contrato de servicios': '1',
        'contrato de alquiler': '2',
    };

    return map[text] || text; // Devuelve el número correspondiente o el texto original
};

client.initialize();