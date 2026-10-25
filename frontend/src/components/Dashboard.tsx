import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Truck, Gauge, AlertTriangle, Plus, ShieldCheck, X, HardHat } from 'lucide-react';

interface Sede {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface Maquinaria {
  id: number;
  codigo?: string;
  codigo_interno?: string;
  tipo?: string;
  nombre?: string;
  horometro_actual: number;
  sede_id: number;
}

export const Dashboard: React.FC = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState('');
  const [horometro, setHorometro] = useState('');
  const [sedeId, setSedeId] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resSedes, resMaq] = await Promise.all([
        api.get('/sedes'),
        api.get('/maquinaria')
      ]);
      setSedes(resSedes.data);
      setMaquinarias(resMaq.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !tipo || !horometro) return;

    try {
      let targetSedeId = sedes.length > 0 ? sedes[0].id : null;

      // Si no existe ninguna sede guardada, crea automáticamente el frente de trabajo inicial
      if (!targetSedeId) {
        const resNuevaSede = await api.post('/sedes', {
          codigo_interno: 'SED-001',
          nombre: 'Frente Principal - Mina 1',
          ubicacion: 'Sede Central'
        });
        targetSedeId = resNuevaSede.data.id;
      }

      // Guardar maquinaria enviando las claves requeridas por la API
      await api.post('/maquinaria', {
        codigo: codigo,
        codigo_interno: codigo,
        nombre: tipo,
        tipo: tipo,
        horometro_actual: Number(horometro),
        sede_id: targetSedeId,
      });

      setCodigo('');
      setTipo('');
      setHorometro('');
      setSedeId('');
      setIsModalOpen(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error guardando maquinaria:', error);
      const mensaje = error.response?.data?.error || error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      alert(`Detalle del error: ${mensaje}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Header Corporativo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wider text-xs uppercase mb-1">
            <HardHat className="w-4 h-4" />
            COMUNIDAD Y DESARROLLO MINERO SAS
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-8 h-8 text-amber-500" />
            Control Operativo de Obras
          </h1>
          <p className="text-slate-400 text-sm">Gestión unificada de 15+ frentes de trabajo, horómetros y combustible</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs md:text-sm font-medium">Modo Seguro / JWT Activo</span>
        </div>
      </header>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Frentes Activos</p>
              <h3 className="text-3xl font-bold text-white mt-1">{sedes.length}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Maquinaria Desplegada</p>
              <h3 className="text-3xl font-bold text-white mt-1">{maquinarias.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">Alertas de Consumo</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">Normal</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registro de Horómetros */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-4 md:p-6 border-b border-slate-700 flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-500" />
            Registro de Horómetros y Estado
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all transform active:scale-95 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Código Equipo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Horómetro Actual</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">Cargando datos del servidor...</td>
                </tr>
              ) : maquinarias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No hay máquinas registradas en el sistema. Presiona el botón <b className="text-amber-500">+ Nuevo Registro</b> para agregar la primera.
                  </td>
                </tr>
              ) : (
                maquinarias.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-semibold text-white">{m.codigo || m.codigo_interno || 'N/A'}</td>
                    <td className="p-4">{m.tipo || m.nombre || 'N/A'}</td>
                    <td className="p-4 font-mono text-amber-400">{m.horometro_actual} hrs</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                        Operativa
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Emergente para Registrar Maquinaria */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Registrar Maquinaria
            </h3>
            <p className="text-slate-400 text-xs mb-6">Asigna nuevo equipo y horómetro a la flota de la empresa.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Código del Equipo</label>
                <input
                  type="text"
                  placeholder="Ej: EXC-001 / BUL-002"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo de Maquinaria</label>
                <input
                  type="text"
                  placeholder="Ej: Excavadora, Camión Vuelco, Cargador"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Horómetro Inicial (Horas)</label>
                <input
                  type="number"
                  placeholder="Ej: 1250"
                  value={horometro}
                  onChange={(e) => setHorometro(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-lg"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};