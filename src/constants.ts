/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clue } from './types';

export const COLS = 13;
export const ROWS = 13;

export const CLUES: Clue[] = [
  // --- HORIZONTALES (6) ---
  {
    id: 'H1',
    number: 1,
    direction: 'H',
    word: 'IPSEC',
    clueText: 'Conjunto de protocolos estándar para cifrar y autenticar el tráfico a nivel de capa de red (Capa 3).',
    startRow: 1,
    startCol: 1,
    length: 5,
  },
  {
    id: 'H2',
    number: 2,
    direction: 'H',
    word: 'NODO',
    clueText: 'Cualquier dispositivo o router configurado como extremo que procesa o reenvía paquetes del túnel.',
    startRow: 2,
    startCol: 1,
    length: 4,
  },
  {
    id: 'H3',
    number: 3,
    direction: 'H',
    word: 'ENRUTAMIENTO',
    clueText: 'Capacidad fundamental que aporta GRE; permite transportar tráfico dinámico (como OSPF o RIP).',
    startRow: 4,
    startCol: 1,
    length: 12,
  },
  {
    id: 'H4',
    number: 9,
    direction: 'H',
    word: 'GRE',
    clueText: 'Protocolo de túnel genérico que encapsula cualquier paquete Layer 3, pero no tiene cifrado propio.',
    startRow: 5,
    startCol: 10,
    length: 3,
  },
  {
    id: 'H5',
    number: 10,
    direction: 'H',
    word: 'SSL',
    clueText: 'Protocolo para VPN web de seguridad a nivel de sesión sin requerir software cliente específico.',
    startRow: 8,
    startCol: 3,
    length: 3,
  },
  {
    id: 'H6',
    number: 11,
    direction: 'H',
    word: 'ANCHO',
    clueText: 'Tasa o capacidad real de transmisión ("___ de banda") que se degrada ligeramente por el overhead de GRE.',
    startRow: 10,
    startCol: 7,
    length: 5,
  },

  // --- VERTICALES (6) ---
  {
    id: 'V1',
    number: 1,
    direction: 'V',
    word: 'INTEGRIDAD',
    clueText: 'Propiedad que asegura que los datos transmitidos en el túnel VPN no han sido modificados en el trayecto.',
    startRow: 1,
    startCol: 1,
    length: 10,
  },
  {
    id: 'V2',
    number: 4,
    direction: 'V',
    word: 'RUTAS',
    clueText: 'Caminos lógicos configurados manualmente o dinámicamente para llevar paquetes a través del túnel.',
    startRow: 4,
    startCol: 3,
    length: 5,
  },
  {
    id: 'V3',
    number: 5,
    direction: 'V',
    word: 'TUNEL',
    clueText: 'Estructura o canal virtual seguro que introduce encapsulación para conectar dos sedes físicas distantes.',
    startRow: 4,
    startCol: 5,
    length: 5,
  },
  {
    id: 'V4',
    number: 6,
    direction: 'V',
    word: 'MTU',
    clueText: 'Límite máximo del paquete (normalmente 1500) que debe reducirse para acomodar las cabeceras extras de GRE.',
    startRow: 4,
    startCol: 7,
    length: 3,
  },
  {
    id: 'V5',
    number: 7,
    direction: 'V',
    word: 'ESTATICA',
    clueText: 'Ruta preferible y común en VPNs sencillas configuradas a mano antes de usar enrutamiento dinámico.',
    startRow: 4,
    startCol: 9,
    length: 8,
  },
  {
    id: 'V6',
    number: 8,
    direction: 'V',
    word: 'TRAFICO',
    clueText: 'Flujo de datos informáticos que transita, se encapsula y viaja protegido a lo largo de un enlace VPN.',
    startRow: 4,
    startCol: 11,
    length: 7,
  }
];
