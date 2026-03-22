export interface GuidedPhrase {
    id: string;
    language_id: string;
    text: string;
    phonetic: string;
    translation: string;
}

export interface GuidedScenario {
    id: string;
    order: number;
    title: string;
    description: string;
    icon: string;
    phrases: GuidedPhrase[];
}

export const GUIDED_SCENARIOS: GuidedScenario[] = [
    {
        id: 'meeting-people',
        order: 1,
        title: 'Meeting People',
        description: 'Introduce yourself and ask basic questions.',
        icon: '👋',
        phrases: [
            { id: '1', language_id: 'es', text: 'Hola, ¿cómo estás?', phonetic: 'O-la, co-mo es-tas', translation: 'Hello, how are you?' },
            { id: '2', language_id: 'es', text: 'Me llamo...', phonetic: 'Meh ya-mo', translation: 'My name is...' },
            { id: '3', language_id: 'es', text: 'Mucho gusto.', phonetic: 'Moo-cho goos-to', translation: 'Nice to meet you.' },
            { id: '4', language_id: 'es', text: '¿De dónde eres?', phonetic: 'De don-de eh-res', translation: 'Where are you from?' },
            { id: '5', language_id: 'es', text: 'Soy de...', phonetic: 'Soy deh', translation: 'I am from...' },
            { id: '6', language_id: 'es', text: 'Hasta luego.', phonetic: 'As-ta lwe-go', translation: 'See you later.' },
            { id: '7', language_id: 'es', text: 'Buen día.', phonetic: 'Bwen de-ah', translation: 'Good morning.' },
            { id: '8', language_id: 'es', text: 'Buenas noches.', phonetic: 'Bwe-nas no-ches', translation: 'Good evening/night.' },
            { id: '9', language_id: 'es', text: '¿Qué tal?', phonetic: 'Keh tal', translation: 'What\'s up?' },
            { id: '10', language_id: 'es', text: 'Adíos.', phonetic: 'Ah-dee-os', translation: 'Goodbye.' },
        ]
    },
    {
        id: 'ordering-coffee',
        order: 2,
        title: 'Ordering Coffee',
        description: 'Get your morning caffeine fix.',
        icon: '☕',
        phrases: [
            { id: '1', language_id: 'es', text: 'Un café, por favor.', phonetic: 'Oon ca-fe, por fa-vor', translation: 'A coffee, please.' },
            { id: '2', language_id: 'es', text: 'Con leche.', phonetic: 'Con le-che', translation: 'With milk.' },
            { id: '3', language_id: 'es', text: 'Sin azúcar.', phonetic: 'Sin ah-zoo-car', translation: 'Without sugar.' },
            { id: '4', language_id: 'es', text: '¿Cuánto cuesta?', phonetic: 'Kwan-to kwes-ta', translation: 'How much does it cost?' },
            { id: '5', language_id: 'es', text: 'Para llevar.', phonetic: 'Pa-ra ye-var', translation: 'To go.' },
            { id: '6', language_id: 'es', text: 'Aquí.', phonetic: 'Ah-kee', translation: 'Here.' },
            { id: '7', language_id: 'es', text: 'Gracias.', phonetic: 'Gra-see-as', translation: 'Thank you.' },
            { id: '8', language_id: 'es', text: 'De nada.', phonetic: 'De na-da', translation: 'You\'re welcome.' },
            { id: '9', language_id: 'es', text: '¿Algo más?', phonetic: 'Al-go mas', translation: 'Anything else?' },
            { id: '10', language_id: 'es', text: 'Es todo.', phonetic: 'Es to-do', translation: 'That\'s all.' },
        ]
    },
    {
        id: 'asking-directions',
        order: 3,
        title: 'Asking Directions',
        description: 'Find your way around the city.',
        icon: '🗺️',
        phrases: [
            { id: '1', language_id: 'es', text: 'Disculpe...', phonetic: 'Dis-cool-pe', translation: 'Excuse me...' },
            { id: '2', language_id: 'es', text: '¿Dónde está el baño?', phonetic: 'Don-de es-ta el ban-yo', translation: 'Where is the bathroom?' },
            { id: '3', language_id: 'es', text: '¿Dónde está el autobús?', phonetic: 'Don-de es-ta el ow-to-boos', translation: 'Where is the bus?' },
            { id: '4', language_id: 'es', text: 'A la derecha.', phonetic: 'Ah la de-re-cha', translation: 'To the right.' },
            { id: '5', language_id: 'es', text: 'A la izquierda.', phonetic: 'Ah la iz-kyer-da', translation: 'To the left.' },
            { id: '6', language_id: 'es', text: 'Todo recto.', phonetic: 'To-do rec-to', translation: 'Straight ahead.' },
            { id: '7', language_id: 'es', text: 'Cerca.', phonetic: 'Ser-ca', translation: 'Close.' },
            { id: '8', language_id: 'es', text: 'Lejos.', phonetic: 'Le-hos', translation: 'Far.' },
            { id: '9', language_id: 'es', text: 'No entiendo.', phonetic: 'No en-tyen-do', translation: 'I don\'t understand.' },
            { id: '10', language_id: 'es', text: 'Puede repetir?', phonetic: 'Pwe-de re-pe-tir', translation: 'Can you repeat?' },
        ]
    },
    {
        id: 'at-the-restaurant',
        order: 4,
        title: 'At the Restaurant',
        description: 'Order food and ask for the bill.',
        icon: '🍽️',
        phrases: [
            { id: '1', language_id: 'es', text: 'El menú, por favor.', phonetic: 'El meh-noo, por fa-vor', translation: 'The menu, please.' },
            { id: '2', language_id: 'es', text: 'Quisiera...', phonetic: 'Kee-syeh-ra', translation: 'I would like...' },
            { id: '3', language_id: 'es', text: 'Agua, por favor.', phonetic: 'Ah-gwa, por fa-vor', translation: 'Water, please.' },
            { id: '4', language_id: 'es', text: 'La cuenta, por favor.', phonetic: 'La kwen-ta, por fa-vor', translation: 'The bill, please.' },
            { id: '5', language_id: 'es', text: 'Está delicioso.', phonetic: 'Es-ta de-li-syo-so', translation: 'It is delicious.' },
            { id: '6', language_id: 'es', text: 'Más pan.', phonetic: 'Mas pan', translation: 'More bread.' },
            { id: '7', language_id: 'es', text: 'Soy alérgico.', phonetic: 'Soy ah-ler-hi-co', translation: 'I am allergic.' },
            { id: '8', language_id: 'es', text: '¿Tienen postre?', phonetic: 'Tye-nen pos-tre', translation: 'Do you have dessert?' },
            { id: '9', language_id: 'es', text: 'Una mesa para dos.', phonetic: 'Oo-na me-sa pa-ra dos', translation: 'A table for two.' },
            { id: '10', language_id: 'es', text: 'Es muy picante.', phonetic: 'Es mwee pi-can-te', translation: 'It is very spicy.' },
        ]
    },
    // Adding 6 more to reach 10 as specified in the plan
    {
        id: 'shopping',
        order: 5,
        title: 'Shopping',
        description: 'Buy clothes and souvenirs.',
        icon: '🛍️',
        phrases: [
            { id: '1', language_id: 'es', text: '¿Cuánto cuesta?', phonetic: 'Kwan-to kwes-ta', translation: 'How much is it?' },
            { id: '2', language_id: 'es', text: 'Es muy caro.', phonetic: 'Es mwee ca-ro', translation: 'It is very expensive.' },
            { id: '3', language_id: 'es', text: 'Cuesta mucho.', phonetic: 'Kwes-ta moo-cho', translation: 'It costs a lot.' },
            { id: '4', language_id: 'es', text: '¿Tienes otro color?', phonetic: 'Tye-nes o-tro co-lor', translation: 'Do you have another color?' },
            { id: '5', language_id: 'es', text: 'Solo estoy mirando.', phonetic: 'So-lo es-toy mi-ran-do', translation: 'I am just looking.' },
            { id: '6', language_id: 'es', text: 'Me lo llevo.', phonetic: 'Meh lo ye-vo', translation: 'I\'ll take it.' },
            { id: '7', language_id: 'es', text: '¿Dónde está el probador?', phonetic: 'Don-de es-ta el pro-ba-dor', translation: 'Where is the fitting room?' },
            { id: '8', language_id: 'es', text: 'Más grande.', phonetic: 'Mas gran-de', translation: 'Bigger.' },
            { id: '9', language_id: 'es', text: 'Más pequeño.', phonetic: 'Mas pe-ken-yo', translation: 'Smaller.' },
            { id: '10', language_id: 'es', text: 'Puedo pagar con tarjeta?', phonetic: 'Pwe-do pa-gar con tar-he-ta', translation: 'Can I pay with a card?' },
        ]
    },
    {
        id: 'hotel',
        order: 6,
        title: 'At the Hotel',
        description: 'Check in and request services.',
        icon: '🏨',
        phrases: [
            { id: '1', language_id: 'es', text: 'Tengo una reserva.', phonetic: 'Ten-go oo-na re-ser-va', translation: 'I have a reservation.' },
            { id: '2', language_id: 'es', text: 'A nombre de...', phonetic: 'Ah nom-bre deh', translation: 'Under the name of...' },
            { id: '3', language_id: 'es', text: 'Mi pasaporte.', phonetic: 'Mee pa-sa-por-te', translation: 'My passport.' },
            { id: '4', language_id: 'es', text: '¿A qué hora es el desayuno?', phonetic: 'Ah ke o-ra es el de-sa-yoo-no', translation: 'What time is breakfast?' },
            { id: '5', language_id: 'es', text: 'Necesito toallas.', phonetic: 'Ne-ce-si-to to-ah-yas', translation: 'I need towels.' },
            { id: '6', language_id: 'es', text: 'El ascensor está allí.', phonetic: 'El ah-sen-sor es-ta ah-yee', translation: 'The elevator is there.' },
            { id: '7', language_id: 'es', text: 'Doble cama.', phonetic: 'Do-ble ca-ma', translation: 'Double bed.' },
            { id: '8', language_id: 'es', text: 'La llave de mi cuarto.', phonetic: 'La ya-ve deh mee kwar-to', translation: 'My room key.' },
            { id: '9', language_id: 'es', text: 'Quiero hacer el check-out.', phonetic: 'Kye-ro ah-ser el check-out', translation: 'I want to check out.' },
            { id: '10', language_id: 'es', text: '¿Puede llamar un taxi?', phonetic: 'Pwe-de ya-mar oon tac-si', translation: 'Can you call a taxi?' }
        ]
    },
    {
        id: 'emergencies',
        order: 7,
        title: 'Emergencies',
        description: 'Ask for help when needed.',
        icon: '🚨',
        phrases: [
            { id: '1', language_id: 'es', text: '¡Ayuda!', phonetic: 'Ah-yoo-dah', translation: 'Help!' },
            { id: '2', language_id: 'es', text: 'Necesito un médico.', phonetic: 'Ne-ce-si-to oon me-di-co', translation: 'I need a doctor.' },
            { id: '3', language_id: 'es', text: 'Llame a la policía.', phonetic: 'Ya-me ah la po-li-cee-ah', translation: 'Call the police.' },
            { id: '4', language_id: 'es', text: 'He perdido mi cartera.', phonetic: 'Eh per-di-do mee car-te-ra', translation: 'I have lost my wallet.' },
            { id: '5', language_id: 'es', text: 'Me siento mal.', phonetic: 'Meh syen-to mal', translation: 'I feel sick.' },
            { id: '6', language_id: 'es', text: '¿Dónde está el hospital?', phonetic: 'Don-de es-ta el os-pi-tal', translation: 'Where is the hospital?' },
            { id: '7', language_id: 'es', text: 'Fuego.', phonetic: 'Fwe-go', translation: 'Fire.' },
            { id: '8', language_id: 'es', text: 'Es una emergencia.', phonetic: 'Es oo-na eh-mer-hen-sya', translation: 'It is an emergency.' },
            { id: '9', language_id: 'es', text: 'Me duele aquí.', phonetic: 'Meh dwe-le ah-kee', translation: 'It hurts here.' },
            { id: '10', language_id: 'es', text: 'No puedo respirar.', phonetic: 'No pwe-do res-pi-rar', translation: 'I cannot breathe.' }
        ]
    },
    {
        id: 'transportation',
        order: 8,
        title: 'Transportation',
        description: 'Navigate trains, buses, and flights.',
        icon: '🚆',
        phrases: [
            { id: '1', language_id: 'es', text: 'Un boleto, por favor.', phonetic: 'Oon bo-le-to, por fa-vor', translation: 'A ticket, please.' },
            { id: '2', language_id: 'es', text: '¿A qué hora sale?', phonetic: 'Ah ke o-ra sa-le', translation: 'What time does it leave?' },
            { id: '3', language_id: 'es', text: 'Llega tarde.', phonetic: 'Ye-ga tar-de', translation: 'It arrives late.' },
            { id: '4', language_id: 'es', text: 'El andén número dos.', phonetic: 'El an-den noo-me-ro dos', translation: 'Platform number two.' },
            { id: '5', language_id: 'es', text: 'Viaje de ida y vuelta.', phonetic: 'Vya-he de i-da ee vwel-ta', translation: 'Round trip.' },
            { id: '6', language_id: 'es', text: 'Mi tren.', phonetic: 'Mee tren', translation: 'My train.' },
            { id: '7', language_id: 'es', text: 'La siguiente parada.', phonetic: 'La si-gyen-te pa-ra-da', translation: 'The next stop.' },
            { id: '8', language_id: 'es', text: '¿Este tren va a...?', phonetic: 'Es-te tren vah ah', translation: 'Does this train go to...?' },
            { id: '9', language_id: 'es', text: 'Equipaje.', phonetic: 'Eh-ki-pa-he', translation: 'Luggage.' },
            { id: '10', language_id: 'es', text: 'El aeropuerto.', phonetic: 'El ah-eh-ro-pwer-to', translation: 'The airport.' }
        ]
    },
    {
        id: 'making-friends',
        order: 9,
        title: 'Making Friends',
        description: 'Talk about your hobbies and interests.',
        icon: '🤝',
        phrases: [
            { id: '1', language_id: 'es', text: '¿Qué haces en tu tiempo libre?', phonetic: 'Ke ah-ses en too tyem-po li-bre', translation: 'What do you do in your free time?' },
            { id: '2', language_id: 'es', text: 'Me gusta la música.', phonetic: 'Meh goos-ta la moo-si-ca', translation: 'I like music.' },
            { id: '3', language_id: 'es', text: 'Toco la guitarra.', phonetic: 'To-co la gi-ta-rra', translation: 'I play the guitar.' },
            { id: '4', language_id: 'es', text: '¿Cuál es tu película favorita?', phonetic: 'Kwal es too pe-li-cu-la fa-vo-ri-ta', translation: 'What is your favorite movie?' },
            { id: '5', language_id: 'es', text: 'Me encanta leer.', phonetic: 'Meh en-can-ta le-er', translation: 'I love to read.' },
            { id: '6', language_id: 'es', text: 'Juego al fútbol.', phonetic: 'Hwe-go al foot-bol', translation: 'I play soccer.' },
            { id: '7', language_id: 'es', text: '¿Tienes mascotas?', phonetic: 'Tye-nes mas-co-tas', translation: 'Do you have pets?' },
            { id: '8', language_id: 'es', text: 'Tengo un perro.', phonetic: 'Ten-go oon pe-rro', translation: 'I have a dog.' },
            { id: '9', language_id: 'es', text: 'Me divierto mucho.', phonetic: 'Meh di-vyer-to moo-cho', translation: 'I have a lot of fun.' },
            { id: '10', language_id: 'es', text: 'Vamos al cine.', phonetic: 'Va-mos al see-ne', translation: 'Let\'s go to the movies.' }
        ]
    },
    {
        id: 'weekend-plans',
        order: 10,
        title: 'Weekend Plans',
        description: 'Discuss what you will do this weekend.',
        icon: '🎉',
        phrases: [
            { id: '1', language_id: 'es', text: '¿Qué vas a hacer hoy?', phonetic: 'Ke vas ah ah-ser oy', translation: 'What are you going to do today?' },
            { id: '2', language_id: 'es', text: 'Voy a salir con amigos.', phonetic: 'Voy ah sa-lir con ah-mi-gos', translation: 'I am going to go out with friends.' },
            { id: '3', language_id: 'es', text: 'Tengo que trabajar.', phonetic: 'Ten-go ke tra-ba-har', translation: 'I have to work.' },
            { id: '4', language_id: 'es', text: 'Descansar en casa.', phonetic: 'Des-can-sar en ca-sa', translation: 'Rest at home.' },
            { id: '5', language_id: 'es', text: 'Mañana por la mañana.', phonetic: 'Man-ya-na por la man-ya-na', translation: 'Tomorrow morning.' },
            { id: '6', language_id: 'es', text: 'El fin de semana.', phonetic: 'El fin deh se-ma-na', translation: 'The weekend.' },
            { id: '7', language_id: 'es', text: 'Nos vemos a las ocho.', phonetic: 'Nos ve-mos ah las o-cho', translation: 'See you at eight.' },
            { id: '8', language_id: 'es', text: 'Es una buena idea.', phonetic: 'Es oo-na bwe-na i-de-ah', translation: 'It is a good idea.' },
            { id: '9', language_id: 'es', text: 'No puedo ir.', phonetic: 'No pwe-do ir', translation: 'I cannot go.' },
            { id: '10', language_id: 'es', text: '¡Qué divertido!', phonetic: 'Ke di-ver-ti-do', translation: 'How fun!' }
        ]
    }
];
