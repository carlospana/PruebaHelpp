import { randomBytes } from 'node:crypto';

export interface ProductInput {
  codigo: string; nombre: string; categoria: string; precio: number;
  stock: number; stockMinimo: number; estado: 'Activo' | 'Inactivo'; descripcion: string;
}
export interface MovementInput {
  tipo: 'Entrada' | 'Salida' | 'Ajuste'; fecha?: string; productoLabel: string;
  cantidad: number; responsable: string; observacion?: string;
}
export interface ProviderInput { nit: string; nombre: string; contacto: string; email: string; telefono: string }

/**
 * Identificador único por ejecución + worker + secuencia.
 * Todo registro creado por la automatización lleva el prefijo "QA" para
 * distinguirlo de datos de negocio y evitar colisiones entre workers.
 */
const RUN_ID = (process.env.RUN_ID ?? randomBytes(3).toString('hex')).toUpperCase().slice(0, 4);
let seq = 0;

export function uniqueId(workerIndex: number): string {
  seq += 1;
  // Código de producto: máx. 10 caracteres (maxlength del formulario) => QA + 4 run + 1 worker + 3 seq
  return `QA${RUN_ID}${(workerIndex % 36).toString(36)}${seq.toString(36).padStart(3, '0')}`.toUpperCase().slice(0, 10);
}

export class DataFactory {
  constructor(private readonly workerIndex: number, readonly testTitle: string) {}

  id(): string { return uniqueId(this.workerIndex); }

  product(overrides: Partial<ProductInput> = {}): ProductInput {
    const id = this.id();
    return {
      codigo: id,
      nombre: `Producto ${id}`,
      categoria: 'Papelería',
      precio: 15000,
      stock: 40,
      stockMinimo: 5,
      estado: 'Activo',
      descripcion: `Creado por automatización (${this.testTitle})`,
      ...overrides,
    };
  }

  provider(overrides: Partial<ProviderInput> = {}): ProviderInput {
    const id = this.id();
    return {
      nit: `9${Date.now().toString().slice(-8)}-${id.slice(-1)}`,
      nombre: `Proveedor ${id}`,
      contacto: 'Contacto QA',
      email: `qa.${id.toLowerCase()}@example.com`,
      telefono: '3000000000',
      ...overrides,
    };
  }

  /** Observación única que identifica el movimiento creado por la prueba. */
  movementNote(): string { return `Mov ${this.id()}`; }
}
