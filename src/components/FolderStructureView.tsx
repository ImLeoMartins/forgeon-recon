import React, { useState } from 'react';

export const FolderStructureView: React.FC = () => {
  const [testEmpresa, setTestEmpresa] = useState('Bar do Zé');
  const [testCategoria, setTestCategoria] = useState('Bares e Cervejarias');
  const [testEndereco, setTestEndereco] = useState('Rua dos Pinheiros, 100 - São Paulo, Brasil');
  const [testPastaBase, setTestPastaBase] = useState('leads');

  const detectCountry = (addr: string) => {
    const a = addr.toLowerCase();
    if (/portugal|lisboa|porto/.test(a)) return 'Portugal';
    if (/estados unidos|usa|miami|new york/.test(a)) return 'Estados Unidos';
    if (/espanha|madrid|barcelona/.test(a)) return 'Espanha';
    if (/itália|italia|roma|milano/.test(a)) return 'Itália';
    return 'Brasil';
  };

  const paisSimulado = detectCountry(testEndereco);
  const isDefaultLeads = testPastaBase.trim().toLowerCase() === 'leads' || testPastaBase.trim() === '/leads';
  const caminhoGerado = isDefaultLeads
    ? `leads/${paisSimulado}/${testCategoria || 'Geral'}/${testEmpresa || 'Empresa'}`
    : `${testPastaBase}/${testEmpresa || 'Empresa'}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Title */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl p-7 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#85A9FA]" />
          <h2 className="text-xl font-heading font-bold text-[#F4F4F7]">
            Arquitetura Hierárquica de Armazenamento Forgeon
          </h2>
        </div>
        <p className="text-sm text-[#A3A6B5] leading-relaxed">
          O Forgeon Recon implementa uma regra automática de classificação: quando a pasta padrão{' '}
          <code className="text-[#85A9FA] font-mono bg-[#171923] px-2 py-0.5 rounded-lg border border-[#292B38]">
            /leads
          </code>{' '}
          for selecionada, todos os dados são salvos em subpastas divididas por{' '}
          <strong className="text-[#F4F4F7]">País</strong> e <strong className="text-[#F4F4F7]">Categoria</strong>.
        </p>
      </div>

      {/* Visual Directory Tree */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl p-7 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A3A6B5]">
          Estrutura Gerada no Sistema de Arquivos
        </h3>

        <div className="bg-[#08090D] border border-[#292B38] rounded-2xl p-6 space-y-1 font-mono text-xs text-[#F4F4F7]">
          <div className="text-[#F4F4F7] font-bold flex items-center gap-2">
            <span className="text-[#85A9FA]">📁 leads/</span>
            <span className="text-[#A3A6B5] font-normal font-sans text-xs">(ou pasta customizada do usuário)</span>
          </div>

          <div className="pl-6 border-l border-[#292B38] space-y-1.5">
            <div className="text-[#85A9FA] font-semibold flex items-center gap-2">
              <span>📁 [País]/</span>
              <span className="text-[#A3A6B5] font-sans text-xs">(Brasil, Portugal, Estados Unidos, etc.)</span>
            </div>

            <div className="pl-6 border-l border-[#292B38] space-y-1.5">
              <div className="text-[#9070F7] font-medium flex items-center gap-2">
                <span>📁 [Categoria]/</span>
                <span className="text-[#A3A6B5] font-sans text-xs">(Restaurantes Italianos, Odontologia, etc.)</span>
              </div>

              <div className="pl-6 border-l border-[#292B38] space-y-2 pt-1">
                <div className="text-[#F4F4F7] font-bold flex items-center gap-2">
                  <span>📁 [Nome da Empresa]/</span>
                </div>

                <div className="pl-6 space-y-1.5 text-[#A3A6B5] text-[11px]">
                  <div className="flex items-center gap-2 hover:text-[#F4F4F7]">
                    <span className="text-emerald-400">📄</span>
                    <span className="font-semibold text-[#F4F4F7]">dadosEmpresa.json</span>
                    <span className="text-[#A3A6B5] font-sans text-[11px]">← Ficha completa, contato, site, score e CRM</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#85A9FA]">
                      <span>📁 fotos/</span>
                      <span className="text-[#A3A6B5] font-sans text-[11px]">← Fotos em alta resolução coletadas do Maps</span>
                    </div>
                    <div className="pl-6 space-y-0.5 text-[#6C6F82] text-[11px]">
                      <div>├─ fotos.json (links originais em alta resolução)</div>
                      <div>├─ foto_01.jpg</div>
                      <div>└─ foto_02.jpg ...</div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2 text-[#9070F7]">
                      <span>📁 site/</span>
                      <span className="text-[#A3A6B5] font-sans text-[11px]">← Auditoria web & tokens extraídos</span>
                    </div>
                    <div className="pl-6 space-y-0.5 text-[#6C6F82] text-[11px]">
                      <div>├─ tokens.json (paleta, tipografia, raios de borda)</div>
                      <div>├─ desktop.png (screenshot desktop)</div>
                      <div>├─ mobile.png (screenshot mobile)</div>
                      <div>└─ logo.svg / logo.png (logotipo oficial)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Path Calculator */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl p-7 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A3A6B5]">
          Simulador Interativo de Caminho em Disco
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <label className="block text-[#A3A6B5] mb-1.5">Nome do Negócio:</label>
            <input
              type="text"
              value={testEmpresa}
              onChange={e => setTestEmpresa(e.target.value)}
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] rounded-xl px-3.5 py-2.5 text-[#F4F4F7] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A3A6B5] mb-1.5">Categoria:</label>
            <input
              type="text"
              value={testCategoria}
              onChange={e => setTestCategoria(e.target.value)}
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] rounded-xl px-3.5 py-2.5 text-[#F4F4F7] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A3A6B5] mb-1.5">Endereço com País:</label>
            <input
              type="text"
              value={testEndereco}
              onChange={e => setTestEndereco(e.target.value)}
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] rounded-xl px-3.5 py-2.5 text-[#F4F4F7] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A3A6B5] mb-1.5">Pasta Base de Saída:</label>
            <input
              type="text"
              value={testPastaBase}
              onChange={e => setTestPastaBase(e.target.value)}
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] rounded-xl px-3.5 py-2.5 text-[#F4F4F7] outline-none"
            />
          </div>
        </div>

        <div className="p-4 bg-[#171923] rounded-2xl border border-[#292B38] space-y-1.5">
          <span className="text-[11px] text-[#A3A6B5]">Caminho Físico Resultante:</span>
          <p className="text-sm font-mono font-bold text-[#85A9FA] break-all">
            📁 /{caminhoGerado}/
          </p>
          <span className="text-xs text-[#A3A6B5] block">
            {isDefaultLeads
              ? '✓ Divisão automática por País e Categoria ativa para a pasta /leads.'
              : 'Salvando em diretório customizado direto.'}
          </span>
        </div>
      </div>
    </div>
  );
};
