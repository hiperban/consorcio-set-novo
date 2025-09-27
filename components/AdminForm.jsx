'use client';
import { useEffect, useState } from 'react';

/* ===== Helpers de máscara BRL ===== */
function maskBRL(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseBRLToNumber(masked) {
  const digits = String(masked || '').replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export default function AdminForm({ initialData }){
  const [data, setData] = useState(initialData || { administradoras: [], grupos: [] });

  // formulário de administradora
  const [admForm, setAdmForm] = useState({ id:'', nome:'' });

  // formulário de grupo (com campos mascarados para valores monetários)
  const [groupForm, setGroupForm] = useState({
    id:'', numeroGrupo:'', administradoraId:'',
    produto:'AUTOMOVEL', tipoGrupo:'PARCELA INTEGRAL',
    valorCartaMasked:'',            // <— máscara BRL
    valorParcelaMasked:'',          // <— máscara BRL
    taxaAdm:'', lanceMedio:'', lanceEmbutidoPermite:'',
    totalParticipantes:'', diaAssembleia:'', prazo:''
  });

  // manter nome da administradora derivado do ID
  useEffect(()=>{
    const map = Object.fromEntries((data.administradoras||[]).map(a=>[a.id,a.nome]));
    setData(prev => ({
      ...prev,
      grupos: (prev.grupos||[]).map(g=>({
        ...g,
        nomeAdministradora: map[g.administradoraId] || g.nomeAdministradora
      }))
    }));
  }, [data.administradoras?.length]);

  const addAdm = ()=>{
    if(!admForm.id || !admForm.nome) return;
    setData(prev=>({...prev, administradoras:[...prev.administradoras, {...admForm}]}));
    setAdmForm({id:'', nome:''});
  };
  const removeAdm = (id)=> setData(prev=>({...prev, administradoras: prev.administradoras.filter(a=>a.id!==id)}));

  const addGroup = ()=>{
    if(!groupForm.id || !groupForm.numeroGrupo || !groupForm.administradoraId) return;

    const admName = (data.administradoras||[]).find(a=>a.id===groupForm.administradoraId)?.nome || '';

    // converter as máscaras para número
    const valorCarta = parseBRLToNumber(groupForm.valorCartaMasked);
    const valorParcela = parseBRLToNumber(groupForm.valorParcelaMasked);

    const parsed = {
      id: groupForm.id,
      numeroGrupo: groupForm.numeroGrupo,
      administradoraId: groupForm.administradoraId,
      produto: groupForm.produto,
      tipoGrupo: groupForm.tipoGrupo,
      valorCarta,                     // número
      valorParcela,                   // número
      taxaAdm: Number(groupForm.taxaAdm || 0),
      lanceMedio: Number(groupForm.lanceMedio || 0),
      lanceEmbutidoPermite: Number(groupForm.lanceEmbutidoPermite || 0),
      totalParticipantes: Number(groupForm.totalParticipantes || 0),
      diaAssembleia: groupForm.diaAssembleia,
      prazo: Number(groupForm.prazo || 0),
      nomeAdministradora: admName
    };

    setData(prev=>({...prev, grupos:[...prev.grupos, parsed]}));

    // reset do form
    setGroupForm({
      id:'', numeroGrupo:'', administradoraId:'',
      produto:'AUTOMOVEL', tipoGrupo:'PARCELA INTEGRAL',
      valorCartaMasked:'', valorParcelaMasked:'',
      taxaAdm:'', lanceMedio:'', lanceEmbutidoPermite:'',
      totalParticipantes:'', diaAssembleia:'', prazo:''
    });
  };

  const removeGroup = (id)=> setData(prev=>({...prev, grupos: prev.grupos.filter(g=>g.id!==id)}));

  const downloadJson = ()=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'groups.json'; document.body.appendChild(a); a.click(); a.remove();
  };
  const handleUpload = (e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{ try{ setData(JSON.parse(r.result)); } catch{ alert('JSON inválido'); } }; r.readAsText(f);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="card">
        <h3 className="font-semibold mb-3 text-brand-800">Administradoras</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="ID" className="border rounded-2xl px-3 py-2"
                 value={admForm.id} onChange={e=>setAdmForm({...admForm,id:e.target.value})}/>
          <input placeholder="Nome" className="border rounded-2xl px-3 py-2"
                 value={admForm.nome} onChange={e=>setAdmForm({...admForm,nome:e.target.value})}/>
          <button onClick={addAdm} className="btn-primary">Adicionar</button>
          <label className="text-sm text-gray-500 flex items-center">
            Importar JSON: <input type="file" accept="application/json" className="ml-2" onChange={handleUpload}/>
          </label>
        </div>
        <ul className="mt-3 divide-y">
          {(data.administradoras||[]).map(a=>(
            <li key={a.id} className="py-2 flex items-center justify-between">
              <span className="text-sm">{a.id} — <b>{a.nome}</b></span>
              <button onClick={()=>removeAdm(a.id)} className="text-red-600 text-sm">Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold mb-3 text-brand-800">Grupos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="ID" className="border rounded-2xl px-3 py-2"
                 value={groupForm.id} onChange={e=>setGroupForm({...groupForm,id:e.target.value})}/>
          <input placeholder="Número do Grupo" className="border rounded-2xl px-3 py-2"
                 value={groupForm.numeroGrupo} onChange={e=>setGroupForm({...groupForm,numeroGrupo:e.target.value})}/>
          <select className="border rounded-2xl px-3 py-2"
                  value={groupForm.administradoraId}
                  onChange={e=>setGroupForm({...groupForm,administradoraId:e.target.value})}>
            <option value="">Administradora</option>
            {(data.administradoras||[]).map(a=>(<option key={a.id} value={a.id}>{a.nome}</option>))}
          </select>
          <select className="border rounded-2xl px-3 py-2"
                  value={groupForm.produto}
                  onChange={e=>setGroupForm({...groupForm,produto:e.target.value})}>
            {['AUTOMOVEL','SERVIÇOS','MOTO','IMOVEL','CAMINHÃO','OUTROS BENS'].map(p=>(<option key={p} value={p}>{p}</option>))}
          </select>
          <select className="border rounded-2xl px-3 py-2"
                  value={groupForm.tipoGrupo}
                  onChange={e=>setGroupForm({...groupForm,tipoGrupo:e.target.value})}>
            <option>PARCELA INTEGRAL</option>
            <option>PARCELA REDUZIDA</option>
          </select>

          {/* ===== Campos com máscara BRL ===== */}
          <input
            placeholder="Valor Carta"
            type="text"
            inputMode="numeric"
            className="border rounded-2xl px-3 py-2"
            value={groupForm.valorCartaMasked}
            onChange={(e)=>setGroupForm({...groupForm, valorCartaMasked: maskBRL(e.target.value)})}
          />
          <input
            placeholder="Valor Parcela"
            type="text"
            inputMode="numeric"
            className="border rounded-2xl px-3 py-2"
            value={groupForm.valorParcelaMasked}
            onChange={(e)=>setGroupForm({...groupForm, valorParcelaMasked: maskBRL(e.target.value)})}
          />
          {/* ================================== */}

          <input placeholder="Taxa Adm (%)" type="number" className="border rounded-2xl px-3 py-2"
                 value={groupForm.taxaAdm} onChange={e=>setGroupForm({...groupForm,taxaAdm:e.target.value})}/>
          <input placeholder="% Lance Médio" type="number" className="border rounded-2xl px-3 py-2"
                 value={groupForm.lanceMedio} onChange={e=>setGroupForm({...groupForm,lanceMedio:e.target.value})}/>
          <input placeholder="% Lance Embutido" type="number" className="border rounded-2xl px-3 py-2"
                 value={groupForm.lanceEmbutidoPermite} onChange={e=>setGroupForm({...groupForm,lanceEmbutidoPermite:e.target.value})}/>
          <input placeholder="Participantes" type="number" className="border rounded-2xl px-3 py-2"
                 value={groupForm.totalParticipantes} onChange={e=>setGroupForm({...groupForm,totalParticipantes:e.target.value})}/>
          <input placeholder="Dia da Assembleia (1-31)" className="border rounded-2xl px-3 py-2"
                 value={groupForm.diaAssembleia} onChange={e=>setGroupForm({...groupForm,diaAssembleia:e.target.value})}/>
          <input placeholder="Prazo (meses)" type="number" className="border rounded-2xl px-3 py-2"
                 value={groupForm.prazo} onChange={e=>setGroupForm({...groupForm,prazo:e.target.value})}/>

          <button onClick={addGroup} className="btn-primary">Adicionar Grupo</button>
          <button onClick={downloadJson} className="px-3 py-2 border rounded-2xl">Exportar JSON</button>
        </div>

        <ul className="mt-3 divide-y">
          {(data.grupos||[]).map(g=>(
            <li key={g.id} className="py-2 flex items-center justify-between text-sm">
              <span>
                Grupo {g.numeroGrupo} — {g.nomeAdministradora} — {g.produto} — R$ {g.valorCarta?.toLocaleString('pt-BR')}
              </span>
              <button onClick={()=>removeGroup(g.id)} className="text-red-600">Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-sm text-gray-600">
        <p><b>Publicação:</b> Exporte o JSON e substitua <code>public/data/groups.json</code> no repositório. O Vercel fará deploy automático.</p>
      </div>
    </div>
  );
}
