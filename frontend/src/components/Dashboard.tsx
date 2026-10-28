import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Truck, Gauge, AlertTriangle, Plus, ShieldCheck, X, HardHat, Camera, Image as ImageIcon, Fuel } from 'lucide-react';

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
  marca?: string;
  modelo?: string;
  serie?: string;
  placa?: string;
  estado?: string;
  foto_url?: string | string[];
  horometro_actual: number;
  sede_id: number;
}

interface Alerta {
  id: number;
  sede_id: number;
  tipo_alerta: string;
  descripcion: string;
  creado_en: string;
  sede_nombre?: string;
}

// 1. Funciones auxiliares para formato de moneda (COP)
const formatearMoneda = (valor: string) => {
  const numero = valor.replace(/\D/g, ''); // Deja solo los dígitos
  if (!numero) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(numero));
};

const desformatearMoneda = (valor: string) => {
  return valor.replace(/\D/g, ''); // Extrae el número limpio para la BD
};

export const Dashboard: React.FC = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isMaquinariaModalOpen, setIsMaquinariaModalOpen] = useState(false);
  const [isTanqueoModalOpen, setIsTanqueoModalOpen] = useState(false);

  // Formulario de Maquinaria
  const [formMaquinaria, setFormMaquinaria] = useState({
    codigo: '',
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    placa: '',
    estado: 'Operativa',
    fotos: [] as string[],
    horometro: '',
  });

  // Formulario de Tanqueo de Combustible
  const [formTanqueo, setFormTanqueo] = useState({
    maquinaria_id: '',
    galones: '',
    horometro_en_tanqueo: '',
    costo_total: '', // Se almacena como texto formateado ($ 570.000)
    observacion: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resSedes, resMaq, resAlertas] = await Promise.all([
        api.get('/sedes'),
        api.get('/maquinaria'),
        api.get('/combustible/alertas')
      ]);
      setSedes(resSedes.data);
      setMaquinarias(resMaq.data);
      setAlertas(resAlertas.data);
    } catch (error) {
      console.error('Error cargando datos del panel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carga de imágenes con control de límite de 5 fotos
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (formMaquinaria.fotos.length + files.length > 5) {
        alert(`Solo se permiten máximo 5 fotos por equipo. Ya tienes ${formMaquinaria.fotos.length} cargada(s).`);
        e.target.value = '';
        return;
      }

      const fotosProcesadas: string[] = [...formMaquinaria.fotos];
      let procesados = 0;

      Array.from(files).forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          alert(`La foto ${file.name} supera los 2MB y fue descartada.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            fotosProcesadas.push(reader.result as string);
          }
          procesados++;
          if (procesados === files.length) {
            setFormMaquinaria((prev) => ({ ...prev, fotos: fotosProcesadas }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFormMaquinaria({
      ...formMaquinaria,
      fotos: formMaquinaria.fotos.filter((_, i) => i !== index)
    });
  };

  // Guardar Maquinaria
  const handleSubmitMaquinaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMaquinaria.codigo || !formMaquinaria.tipo || !formMaquinaria.horometro) return;

    try {
      let targetSedeId = sedes.length > 0 ? sedes[0].id : null;

      if (!targetSedeId) {
        const resNuevaSede = await api.post('/sedes', {
          codigo_interno: 'SED-001',
          nombre: 'Frente Principal - Mina 1',
          ubicacion: 'Sede Central'
        });
        targetSedeId = resNuevaSede.data.id;
      }

      await api.post('/maquinaria', {
        codigo: formMaquinaria.codigo,
        codigo_interno: formMaquinaria.codigo,
        nombre: formMaquinaria.tipo,
        tipo: formMaquinaria.tipo,
        marca: formMaquinaria.marca,
        modelo: formMaquinaria.modelo,
        serie: formMaquinaria.serie,
        placa: formMaquinaria.placa,
        estado: formMaquinaria.estado,
        foto_url: formMaquinaria.fotos,
        horometro_actual: Number(formMaquinaria.horometro),
        sede_id: targetSedeId,
      });

      setFormMaquinaria({
        codigo: '',
        tipo: '',
        marca: '',
        modelo: '',
        serie: '',
        placa: '',
        estado: 'Operativa',
        fotos: [],
        horometro: '',
      });
      setIsMaquinariaModalOpen(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error guardando maquinaria:', error);
      alert(`Error al guardar maquinaria: ${error.response?.data?.error || error.message}`);
    }
  };

  // Guardar Tanqueo con desformateo de moneda
  const handleSubmitTanqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanqueo.maquinaria_id || !formTanqueo.galones || !formTanqueo.horometro_en_tanqueo) {
      alert('Selecciona una máquina, los galones cargados y el horómetro actual.');
      return;
    }

    try {
      const maqSeleccionada = maquinarias.find(m => m.id === Number(formTanqueo.maquinaria_id));
      const targetSedeId = maqSeleccionada ? maqSeleccionada.sede_id : (sedes[0]?.id || 1);

      // Limpia la moneda para enviar un valor numérico puro
      const costoLimpio = Number(desformatearMoneda(formTanqueo.costo_total)) || 0;

      const res = await api.post('/combustible/tanqueo', {
        maquinaria_id: Number(formTanqueo.maquinaria_id),
        sede_id: targetSedeId,
        galones: Number(formTanqueo.galones),
        horometro_en_tanqueo: Number(formTanqueo.horometro_en_tanqueo),
        costo_total: costoLimpio,
        observacion: formTanqueo.observacion || 'Tanqueo registrado desde el tablero'
      });

      if (res.data.alerta_generada) {
        alert('⚠️ ¡Atención! Se registró un consumo superior al estándar (> 8.0 Gal/Hr) y se generó una alerta.');
      } else {
        alert('✓ Abastecimiento de combustible registrado con éxito.');
      }

      setFormTanqueo({
        maquinaria_id: '',
        galones: '',
        horometro_en_tanqueo: '',
        costo_total: '',
        observacion: '',
      });
      setIsTanqueoModalOpen(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al registrar tanqueo:', error);
      alert(`Error al registrar tanqueo: ${error.response?.data?.error || error.message}`);
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
          <p className="text-slate-400 text-sm">Gestión unificada de frentes de trabajo, horómetros y combustible</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs md:text-sm font-medium">Modo Seguro / JWT Activo</span>
        </div>
      </header>

      {/* Banner de Alertas Activas */}
      {alertas.length > 0 && (
        <div className="mb-8 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">Alertas de Consumo Anómalo</h4>
            <div className="text-xs text-rose-200 mt-1 space-y-1">
              {alertas.slice(0, 3).map((a) => (
                <p key={a.id}>• {a.descripcion} ({new Date(a.creado_en).toLocaleDateString()})</p>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <h3 className={`text-3xl font-bold mt-1 ${alertas.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {alertas.length > 0 ? `${alertas.length} Activa(s)` : 'Normal'}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${alertas.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
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
            Registro de Horómetros y Flota
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTanqueoModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Fuel className="w-4 h-4" />
              Registrar Tanqueo
            </button>
            <button
              onClick={() => setIsMaquinariaModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Máquina
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Foto(s)</th>
                <th className="p-4">Código / Placa</th>
                <th className="p-4">Tipo / Marca</th>
                <th className="p-4">Horómetro Actual</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Cargando datos del servidor...</td>
                </tr>
              ) : maquinarias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No hay máquinas registradas en el sistema. Presiona el botón <b className="text-amber-500">+ Nueva Máquina</b> para agregar la primera.
                  </td>
                </tr>
              ) : (
                maquinarias.map((m) => {
                  const fotoPrincipal = Array.isArray(m.foto_url) ? m.foto_url[0] : m.foto_url;
                  const totalFotos = Array.isArray(m.foto_url) ? m.foto_url.length : (m.foto_url ? 1 : 0);

                  return (
                    <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4">
                        {fotoPrincipal ? (
                          <div className="relative inline-block">
                            <img src={fotoPrincipal} alt="Maquinaria" className="w-10 h-10 rounded-lg object-cover border border-slate-600" />
                            {totalFotos > 1 && (
                              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                +{totalFotos - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-white">
                        <div>{m.codigo || m.codigo_interno || 'N/A'}</div>
                        {m.placa && <div className="text-xs text-slate-400 font-mono">Placa: {m.placa}</div>}
                      </td>
                      <td className="p-4">
                        <div>{m.tipo || m.nombre || 'N/A'}</div>
                        {(m.marca || m.modelo) && (
                          <div className="text-xs text-slate-400">{m.marca} {m.modelo}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-amber-400">{m.horometro_actual} hrs</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${
                          m.estado === 'En Mantenimiento' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : m.estado === 'Fuera de Servicio' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {m.estado || 'Operativa'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Registrar Maquinaria */}
      {isMaquinariaModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsMaquinariaModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Registrar Maquinaria
            </h3>
            <p className="text-slate-400 text-xs mb-6">Asigna nuevo equipo y horómetro a la flota.</p>

            <form onSubmit={handleSubmitMaquinaria} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Código *</label>
                  <input
                    type="text"
                    placeholder="Ej: EXC-001"
                    value={formMaquinaria.codigo}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, codigo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Excavadora, Camión"
                    value={formMaquinaria.tipo}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, tipo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Caterpillar"
                    value={formMaquinaria.marca}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, marca: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej: 320D"
                    value={formMaquinaria.modelo}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, modelo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Placa/Serie</label>
                  <input
                    type="text"
                    placeholder="Ej: WXY-123"
                    value={formMaquinaria.placa}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, placa: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Horómetro Inicial *</label>
                  <input
                    type="number"
                    placeholder="Ej: 1250"
                    value={formMaquinaria.horometro}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, horometro: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Estado</label>
                  <select
                    value={formMaquinaria.estado}
                    onChange={(e) => setFormMaquinaria({...formMaquinaria, estado: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                  >
                    <option value="Operativa">Operativa</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Fuera de Servicio">Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              {/* Selector Múltiple de Fotos (Máx 5) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  Fotos del Equipo (Máximo 5 fotos)
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={formMaquinaria.fotos.length >= 5}
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer disabled:opacity-50"
                />

                {formMaquinaria.fotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                    {formMaquinaria.fotos.map((foto, index) => (
                      <div key={index} className="relative group">
                        <img src={foto} alt={`Foto ${index + 1}`} className="w-14 h-14 rounded-lg object-cover border border-amber-500" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFoto(index)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 text-xs hover:bg-rose-700 shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMaquinariaModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-sm shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Tanqueo de Combustible (ACPM) */}
      {isTanqueoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsTanqueoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-blue-400" />
              Registrar Abastecimiento de ACPM
            </h3>
            <p className="text-slate-400 text-xs mb-6">Ingresa la carga de combustible y horómetro para calcular el rendimiento.</p>

            <form onSubmit={handleSubmitTanqueo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Seleccionar Maquinaria *</label>
                <select
                  value={formTanqueo.maquinaria_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const maq = maquinarias.find(m => m.id === Number(id));
                    setFormTanqueo({
                      ...formTanqueo,
                      maquinaria_id: id,
                      horometro_en_tanqueo: maq ? String(maq.horometro_actual) : formTanqueo.horometro_en_tanqueo
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                  required
                >
                  <option value="">-- Elige una máquina --</option>
                  {maquinarias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo || m.codigo_interno} - {m.tipo || m.nombre} (Horómetro: {m.horometro_actual} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Galones Cargados *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 45.5"
                    value={formTanqueo.galones}
                    onChange={(e) => setFormTanqueo({...formTanqueo, galones: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Horómetro al Tanqueo *</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 1258.5"
                    value={formTanqueo.horometro_en_tanqueo}
                    onChange={(e) => setFormTanqueo({...formTanqueo, horometro_en_tanqueo: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                    required
                  />
                </div>
              </div>

              {/* CAMPO DE COSTO TOTAL FORMATEADO EN MONEDA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Costo Total ($ COP)</label>
                <input
                  type="text"
                  placeholder="Ej: $ 570.000"
                  value={formTanqueo.costo_total}
                  onChange={(e) => {
                    const formateado = formatearMoneda(e.target.value);
                    setFormTanqueo({ ...formTanqueo, costo_total: formateado });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Observaciones / Proveedor</label>
                <textarea
                  placeholder="Ej: Tanqueo completo en estación de servicio de obra por operador Juan"
                  value={formTanqueo.observacion}
                  onChange={(e) => setFormTanqueo({...formTanqueo, observacion: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTanqueoModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-lg"
                >
                  Registrar Tanqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};