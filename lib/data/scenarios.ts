import { Scenario, CEFRLevel, ScenarioType } from '@/types';

export { type Scenario };

export const SCENARIOS: Scenario[] = [
    // ─────────────────────────────────────────────
    // SCENARIO 1: Café Order
    // ─────────────────────────────────────────────
    {
        id: 'cafe-order-01',
        type: ScenarioType.Restaurant,
        name: 'Café Order',
        description: 'Order a coffee and pastry at a local café.',
        setting: 'A small café in Madrid.',
        character_name: 'Carlos',
        character_role: 'Friendly but busy barista',
        user_role: 'Customer',
        goal: 'Successfully order food and drink and pay correctly.',
        base_difficulty: CEFRLevel.A1,
        estimated_minutes: 3,
        icon: 'Coffee',
        base_context: `You are Carlos, a barista at a small café in Madrid. You are friendly and helpful. A new customer (the user) has just stepped up to the counter. Welcome them and ask what they would like to order. Stay in character throughout.`,
        situations: [
            {
                id: 'busy_rush',
                name: 'Monday Morning Rush',
                modifier: 'The café is extremely busy. Carlos is stressed and moving fast. He accidentally brings the wrong order to the user — they must politely correct him.',
                twist: 'Wrong order delivered',
                difficulty_modifier: 1,
                teaser: 'Something goes slightly wrong with your order...'
            },
            {
                id: 'chatty_sunday',
                name: 'Quiet Sunday Chat',
                modifier: 'The café is empty and peaceful. Carlos is very friendly and wants to chat. He asks where the user is from, why they are learning Spanish, and what they think of Madrid.',
                twist: 'Small talk required',
                difficulty_modifier: 0,
                teaser: 'The barista seems to want a conversation...'
            },
            {
                id: 'item_unavailable',
                name: 'Out of Stock',
                modifier: 'The café has run out of coffee completely — the machine is broken. Only tea, juice, and pastries available. User must ask what is available and adapt.',
                twist: 'Main item unavailable',
                difficulty_modifier: 0,
                teaser: 'They may not have what you\'re looking for...'
            },
            {
                id: 'wrong_bill',
                name: 'Billing Problem',
                modifier: 'After the user finishes their order and sits down, Carlos brings a bill that is €3 more than it should be. User must politely question the charge and get it corrected.',
                twist: 'Incorrect bill to resolve',
                difficulty_modifier: 1,
                teaser: 'Check your bill carefully when it arrives...'
            },
            {
                id: 'large_group',
                name: 'Ordering for Everyone',
                modifier: 'The user is ordering for a group of 4 friends who are outside. They have a list of different orders — 2 coffees, 1 tea, 1 juice, and 3 pastries. Carlos asks clarifying questions about each item.',
                twist: 'Complex multi-item order',
                difficulty_modifier: 1,
                teaser: 'You have a lot to order today...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 2: Market Negotiation
    // ─────────────────────────────────────────────
    {
        id: 'market-negotiation-01',
        type: ScenarioType.Market,
        name: 'Market Negotiation',
        description: 'Bargain for a handmade souvenir.',
        setting: 'An outdoor market in Barcelona.',
        character_name: 'Elena',
        character_role: 'Proud vendor of handmade goods',
        user_role: 'Tourist',
        goal: 'Negotiate the price of an item down by at least 15%.',
        base_difficulty: CEFRLevel.A2,
        estimated_minutes: 5,
        icon: 'Store',
        base_context: `You are Elena, a proud vendor at an outdoor market in Barcelona. You sell beautiful handmade goods. You don't like giving discounts easily because your work takes time. A tourist (the user) is looking at your products. Greet them and tell them about your items.`,
        situations: [
            {
                id: 'leather_bag',
                name: 'The Leather Bag',
                modifier: 'User wants a leather bag priced at €45. Elena says it is handmade by her mother and explains the quality in detail. She is emotionally attached to the price.',
                twist: 'Emotionally attached seller',
                difficulty_modifier: 0,
                teaser: 'This vendor takes pride in her products...'
            },
            {
                id: 'bulk_discount',
                name: 'Buying Multiple Items',
                modifier: 'User wants to buy 3 small items as gifts. Elena is open to a bulk discount but makes the user suggest the deal first and negotiate from there.',
                twist: 'Bundle negotiation',
                difficulty_modifier: 0,
                teaser: 'You need gifts for several people...'
            },
            {
                id: 'end_of_day',
                name: 'End of Market Day',
                modifier: 'It is 6pm and the market is closing. Elena does not want to pack everything back up. She is more open to deals but still plays hard to get. User must sense and use this opportunity.',
                twist: 'Seller is motivated to sell',
                difficulty_modifier: -1,
                teaser: 'The timing might work in your favor today...'
            },
            {
                id: 'competitor_nearby',
                name: 'There Is Another Vendor',
                modifier: 'A very similar stall is visible nearby selling comparable items at lower prices. User can reference this to negotiate. Elena must defend why her products are worth more — quality, handmade, unique.',
                twist: 'Use competition as leverage',
                difficulty_modifier: 1,
                teaser: 'You noticed something interesting nearby...'
            },
            {
                id: 'damaged_item',
                name: 'Small Defect',
                modifier: 'User finds a small scratch or flaw on the item they want. Elena insists it is barely noticeable and does not affect quality. User must use this flaw to negotiate a discount diplomatically.',
                twist: 'Flaw discovered on item',
                difficulty_modifier: 1,
                teaser: 'Inspect the item carefully before committing...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 3: Apartment Problem
    // ─────────────────────────────────────────────
    {
        id: 'apartment-problem-01',
        type: ScenarioType.Neighbor,
        name: 'Apartment Problem',
        description: 'Call your super about a maintenance issue.',
        setting: 'Over the phone.',
        character_name: 'Miguel',
        character_role: 'Dismissive building superintendent',
        user_role: 'Tenant',
        goal: 'Report the problem clearly and get a specific repair commitment with a date and time.',
        base_difficulty: CEFRLevel.B1,
        estimated_minutes: 5,
        icon: 'Home',
        base_context: `You are Miguel, the superintendent for an apartment building. You are busy and slightly annoyed that your phone is ringing. Answer the phone abruptly ("Dígame"). Make the caller explain the issue clearly before you agree to look at it.`,
        situations: [
            {
                id: 'broken_heater',
                name: 'No Heat in Winter',
                modifier: 'It is December and the heater has been broken for 3 days. Miguel says he will get to it eventually. User must be firm about urgency given the cold weather and push for a specific appointment.',
                twist: 'Urgent weather-related problem',
                difficulty_modifier: 0,
                teaser: 'This problem cannot wait much longer...'
            },
            {
                id: 'water_leak',
                name: 'Ceiling Leak',
                modifier: 'Water is leaking from the ceiling into the bedroom. Miguel first suggests it is just condensation. User must describe the problem clearly enough that Miguel takes it seriously and sends someone urgently.',
                twist: 'Superintendent is dismissive at first',
                difficulty_modifier: 1,
                teaser: 'Getting taken seriously might take some effort...'
            },
            {
                id: 'broken_elevator',
                name: 'Elevator Out',
                modifier: 'The elevator has been broken for a week. User lives on the 8th floor and has elderly parents visiting next week. Miguel says the repair company is backed up. User must escalate appropriately.',
                twist: 'Ongoing unresolved issue',
                difficulty_modifier: 1,
                teaser: 'This has already been going on too long...'
            },
            {
                id: 'noise_complaint',
                name: 'Construction Noise',
                modifier: 'Building maintenance is doing loud construction work starting at 7am including weekends. User works from home and needs to negotiate quieter hours or compensation.',
                twist: 'Negotiating schedule change',
                difficulty_modifier: 0,
                teaser: 'You need to set some boundaries here...'
            },
            {
                id: 'locked_out',
                name: 'Locked Out',
                modifier: 'User accidentally locked themselves out at 10pm on a Sunday. Miguel is annoyed at being called late. User must stay calm, explain the situation clearly, and get Miguel to come help without making him angrier.',
                twist: 'Handling an annoyed person under pressure',
                difficulty_modifier: 1,
                teaser: 'The person you are calling is not going to be happy about this...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 4: Job Interview
    // ─────────────────────────────────────────────
    {
        id: 'job-interview-01',
        type: ScenarioType.JobInterview,
        name: 'Job Interview',
        description: 'First round interview for a marketing role.',
        setting: 'An office in Mexico City.',
        character_name: 'Sofía',
        character_role: 'Direct and professional HR Manager',
        user_role: 'Job Candidate',
        goal: 'Answer 4 interview questions naturally and ask 2 thoughtful questions at the end.',
        base_difficulty: CEFRLevel.B1,
        estimated_minutes: 10,
        icon: 'Briefcase',
        base_context: `You are Sofía, an HR manager in Mexico City. You are interviewing a candidate (the user) for a mid-level marketing position. You are professional, direct, and expect clear answers. Start by welcoming them and asking them to describe their previous experience.`,
        situations: [
            {
                id: 'marketing_role',
                name: 'Marketing Coordinator Role',
                modifier: 'Role is marketing coordinator at a growing tech startup. Sofía asks about experience, why the candidate wants to leave their current job, strengths, and how they handle tight deadlines.',
                twist: 'Standard interview questions',
                difficulty_modifier: 0,
                teaser: 'A straightforward first round interview...'
            },
            {
                id: 'career_change',
                name: 'Switching Industries',
                modifier: 'Candidate is switching from engineering to marketing. Sofía is skeptical about the transition and keeps probing why. User must confidently explain their reasoning and transferable skills.',
                twist: 'Defending a career change',
                difficulty_modifier: 1,
                teaser: 'You may need to justify your background...'
            },
            {
                id: 'gap_in_cv',
                name: 'The Gap Year',
                modifier: 'There is a 1 year gap in the candidate\'s CV. Sofía asks about it directly. User must explain it confidently (they were traveling, studying, or caring for family — user chooses) without seeming unreliable.',
                twist: 'Explaining a CV gap',
                difficulty_modifier: 1,
                teaser: 'Be ready to explain your full history...'
            },
            {
                id: 'salary_negotiation',
                name: 'The Salary Question',
                modifier: 'After standard questions Sofía asks about salary expectations directly and early in the interview. User must navigate this professionally — not undersell, not price themselves out, and ask about the budget range.',
                twist: 'Early salary discussion',
                difficulty_modifier: 1,
                teaser: 'Money might come up sooner than expected...'
            },
            {
                id: 'group_project',
                name: 'Teamwork Scenario',
                modifier: 'Sofía focuses the entire interview on teamwork and conflict. She asks for specific examples of disagreements with colleagues and how they were resolved. She pushes for details when answers are vague.',
                twist: 'Deep dive on teamwork',
                difficulty_modifier: 0,
                teaser: 'Think of some real examples before you start...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 5: Doctor Visit
    // ─────────────────────────────────────────────
    {
        id: 'doctor-visit-01',
        type: ScenarioType.Doctor,
        name: 'Doctor Visit',
        description: 'Consult a doctor about your symptoms.',
        setting: 'A neighborhood medical clinic.',
        character_name: 'Dr. Ramírez',
        character_role: 'Patient, thorough physician',
        user_role: 'Patient',
        goal: 'Describe symptoms clearly, understand the diagnosis, and confirm prescription instructions.',
        base_difficulty: CEFRLevel.B2,
        estimated_minutes: 7,
        icon: 'Stethoscope',
        base_context: `You are Dr. Ramírez, a patient and thorough doctor at a clinic. A patient (the user) has just entered your exam room. Greet them professionally and ask what brings them in today. Ask detailed follow-up questions about their symptoms before diagnosing.`,
        situations: [
            {
                id: 'sore_throat_fever',
                name: 'Sore Throat and Fever',
                modifier: 'User has had a sore throat and 38.5 fever for 3 days. Dr. Ramírez asks detailed questions about symptoms and prescribes antibiotics with specific instructions the user must confirm they understood.',
                twist: 'Standard illness visit',
                difficulty_modifier: 0,
                teaser: 'Describe exactly how you have been feeling...'
            },
            {
                id: 'allergic_reaction',
                name: 'Allergic Reaction',
                modifier: 'User has a rash that appeared yesterday after eating at a restaurant. Dr. Ramírez asks what they ate, previous allergies, and current medications. User must describe the rash accurately.',
                twist: 'Unknown allergy investigation',
                difficulty_modifier: 1,
                teaser: 'You will need to be very descriptive...'
            },
            {
                id: 'chronic_pain',
                name: 'Ongoing Back Pain',
                modifier: 'User has had lower back pain for 2 weeks that is getting worse. Dr. Ramírez asks detailed questions about when it hurts, what makes it better or worse, and whether it affects sleep. Refers to specialist but user must understand the referral.',
                twist: 'Chronic problem requiring referral',
                difficulty_modifier: 1,
                teaser: 'This one might require more than one appointment...'
            },
            {
                id: 'medication_question',
                name: 'Medication Confusion',
                modifier: 'User is already taking medication prescribed elsewhere and is confused about whether to continue. Dr. Ramírez reviews the medication and asks questions. User must clearly describe what they are taking and ask the right questions about interactions.',
                twist: 'Existing medication to discuss',
                difficulty_modifier: 1,
                teaser: 'Bring all the information you have...'
            },
            {
                id: 'anxiety_symptoms',
                name: 'Stress and Sleep Issues',
                modifier: 'User has not been sleeping well and feels anxious constantly. Dr. Ramírez asks about lifestyle, work stress, and diet. Recommends lifestyle changes and possibly refers to a counselor. User must discuss mental health in Spanish.',
                twist: 'Mental health conversation',
                difficulty_modifier: 2,
                teaser: 'This might be a more personal conversation...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 6: Neighbor Dispute
    // ─────────────────────────────────────────────
    {
        id: 'neighbor-dispute-01',
        type: ScenarioType.Neighbor,
        name: 'Neighbor Dispute',
        description: 'Confront a noisy upstairs neighbor.',
        setting: 'Apartment building hallway.',
        character_name: 'Roberto',
        character_role: 'Oblivious but not hostile neighbor',
        user_role: 'Downstairs Neighbor',
        goal: 'Resolve the noise issue diplomatically without making an enemy.',
        base_difficulty: CEFRLevel.B2,
        estimated_minutes: 5,
        icon: 'Volume2',
        base_context: `You are Roberto. You've been playing loud music while cleaning your apartment. You open your door to find your downstairs neighbor (the user) standing there. You are a bit surprised. You aren't hostile, but you don't immediately think your music is that loud. Greet them casually ("¡Hola! ¿Qué tal?").`,
        situations: [
            {
                id: 'late_night_music',
                name: 'Music Until 2am',
                modifier: 'Roberto has been playing loud music past midnight three nights in a row. He seems surprised by the complaint and says he did not realize how loud it was. User must be firm but friendly.',
                twist: 'Neighbor unaware of the impact',
                difficulty_modifier: 0,
                teaser: 'They may not realize how bad it has been...'
            },
            {
                id: 'party_warning',
                name: 'Party This Weekend',
                modifier: 'Roberto tells the user he is throwing a party Saturday night before the user can complain. User must navigate this proactively — set expectations about noise levels and timing without being unreasonable.',
                twist: 'Getting ahead of a future problem',
                difficulty_modifier: 1,
                teaser: 'You find out about the problem before it happens...'
            },
            {
                id: 'repeated_offender',
                name: 'Third Time This Month',
                modifier: 'This is the third time the user has had to knock on Roberto\'s door about noise. Roberto is starting to get defensive. User must stay calm, reference the history, and suggest a real solution.',
                twist: 'Escalating repeat situation',
                difficulty_modifier: 1,
                teaser: 'You have been here before...'
            },
            {
                id: 'shared_wall',
                name: 'It Is Not Just Music',
                modifier: 'The issue is not just music — Roberto also moves furniture late at night and has loud phone calls on the balcony. User must address multiple issues without overwhelming Roberto or making him defensive.',
                twist: 'Multiple noise sources to address',
                difficulty_modifier: 1,
                teaser: 'There is more than one thing to bring up...'
            },
            {
                id: 'building_rules',
                name: 'Citing Building Rules',
                modifier: 'User has a copy of the building noise rules showing quiet hours. Roberto disputes that the rules apply to him in this situation. User must calmly explain the rules and reach an agreement.',
                twist: 'Rules-based negotiation',
                difficulty_modifier: 0,
                teaser: 'You have the rules on your side — use them diplomatically...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 7: Travel Problem
    // ─────────────────────────────────────────────
    {
        id: 'travel-problem-01',
        type: ScenarioType.CustomerService,
        name: 'Travel Delay',
        description: 'Deal with a missed train connection.',
        setting: 'A chaotic train station information desk.',
        character_name: 'Ana',
        character_role: 'Helpful but overwhelmed attendant',
        user_role: 'Stranded Traveler',
        goal: 'Find an alternative route and get a refund or credit for the missed train.',
        base_difficulty: CEFRLevel.C1,
        estimated_minutes: 8,
        icon: 'Train',
        base_context: `You are Ana, working at the information desk of a major train station. It's a chaotic day with many delays. You are doing your best to be helpful but you are stressed and speaking quickly. A traveler (the user) approaches your desk. Acknowledge them and ask for their ticket number quickly.`,
        situations: [
            {
                id: 'missed_connection',
                name: 'Missed the Connection',
                modifier: 'User missed their train because a previous connecting train was delayed — not their fault. Ana is sympathetic but says refunds are only for cancellations not delays. User must dispute this and escalate calmly.',
                twist: 'Defending a legitimate refund claim',
                difficulty_modifier: 0,
                teaser: 'You have a strong case — make sure they hear it...'
            },
            {
                id: 'full_trains',
                name: 'Everything is Full',
                modifier: 'All alternative trains to the destination today are fully booked. Ana offers a train tomorrow morning. User needs to get there today for an important reason and must find creative solutions with Ana.',
                twist: 'No obvious solution available',
                difficulty_modifier: 1,
                teaser: 'The easy answers are not going to work this time...'
            },
            {
                id: 'wrong_ticket',
                name: 'Bought the Wrong Ticket',
                modifier: 'User realizes they bought a ticket for the wrong date — today instead of tomorrow. They need to change it but the system says no changes allowed on this ticket type. User must negotiate an exception.',
                twist: 'User made the mistake',
                difficulty_modifier: 1,
                teaser: 'This one might be partly your fault...'
            },
            {
                id: 'lost_luggage',
                name: 'Luggage on the Wrong Train',
                modifier: 'User\'s luggage was checked and ended up on the train they missed. It is now heading to the destination without them. User must report this, understand the recovery process, and arrange to get their bag back.',
                twist: 'Luggage problem added to travel problem',
                difficulty_modifier: 2,
                teaser: 'Your problems just multiplied...'
            },
            {
                id: 'strike_day',
                name: 'National Strike',
                modifier: 'There is a rail workers strike today affecting most routes. Ana explains the situation using some technical and union-related vocabulary. User must understand what is happening, their rights, and what alternatives exist.',
                twist: 'Complex external situation to understand',
                difficulty_modifier: 2,
                teaser: 'Something bigger is going on today...'
            }
        ]
    },

    // ─────────────────────────────────────────────
    // SCENARIO 8: Business Negotiation
    // ─────────────────────────────────────────────
    {
        id: 'business-negotiation-01',
        type: ScenarioType.JobInterview,
        name: 'Business Pitch',
        description: 'Pitch your software to a skeptical client.',
        setting: 'A formal meeting room in Bogotá.',
        character_name: 'Director Herrera',
        character_role: 'Skeptical, demanding potential client',
        user_role: 'Salesperson',
        goal: 'Present your service, handle 3 objections, and get agreement on a follow-up meeting.',
        base_difficulty: CEFRLevel.C1,
        estimated_minutes: 10,
        icon: 'Building2',
        base_context: `You are Director Herrera, a high-level executive at a logistics firm in Bogotá. You are meeting with a software salesperson (the user). You are skeptical of new technology and protective of your budget. You want hard facts and ROI. Start the meeting formally, state that you only have 10 minutes, and ask them to begin their pitch.`,
        situations: [
            {
                id: 'price_objection',
                name: 'Too Expensive',
                modifier: 'Director Herrera\'s main objection is price. He has a cheaper competitor quote. User must defend the value proposition, understand what the competitor is offering, and find a way to justify the difference.',
                twist: 'Price-focused negotiation',
                difficulty_modifier: 0,
                teaser: 'Budget is going to be the main topic...'
            },
            {
                id: 'trust_building',
                name: 'No Track Record',
                modifier: 'Director Herrera is concerned the user\'s company is too new and unproven. He asks for references, case studies, and guarantees. User must handle lack of extensive history confidently and creatively.',
                twist: 'Credibility challenge',
                difficulty_modifier: 1,
                teaser: 'They are going to want proof...'
            },
            {
                id: 'internal_competition',
                name: 'We Can Do It In-House',
                modifier: 'Director Herrera says his team could build this capability internally and is weighing that option. User must make the case for outsourcing — speed, cost, expertise — without dismissing the internal team.',
                twist: 'Build vs buy argument',
                difficulty_modifier: 1,
                teaser: 'They think they might not need you...'
            },
            {
                id: 'contract_terms',
                name: 'Contract Concerns',
                modifier: 'Director Herrera has reviewed a draft contract and has 4 specific concerns about termination clauses, payment schedule, IP ownership, and exclusivity. User must address each one clearly and professionally.',
                twist: 'Contract-level negotiation',
                difficulty_modifier: 2,
                teaser: 'The details matter in this meeting...'
            },
            {
                id: 'multiple_stakeholders',
                name: 'Not My Decision Alone',
                modifier: 'Director Herrera reveals mid-meeting that he needs buy-in from two other directors. User must adjust their pitch, ask the right questions to understand the other decision makers, and get Herrera to champion the proposal internally.',
                twist: 'Hidden decision makers revealed',
                difficulty_modifier: 1,
                teaser: 'The decision might be more complicated than you thought...'
            }
        ]
    }
];
