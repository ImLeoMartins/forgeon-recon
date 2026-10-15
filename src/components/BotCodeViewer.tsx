import React, { useState, useEffect } from 'react';

export const BotCodeViewer: React.FC = () => {
  const [code, setCode] = useState<string>('# Carregando recon_maps.py...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/leads/python-script')
      .then(res => res.text())
      .then(text => setCode(text))
      .catch(() => setCode('# Falha ao carregar script python.'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recon_maps.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Overview */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl p-7 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#85A9FA] font-bold text-lg font-heading">recon_maps.py</span>
              <span className="text-[#6C6F82]">·</span>
              <span className="text-xs font-mono text-[#A3A6B5]">Motor Python Playwright</span>
            </div>
            <p className="text-sm text-[#A3A6B5] mt-1.5 max-w-2xl leading-relaxed">
              Script Python completo com a lógica integrada de organização automática em{' '}
              <code className="text-[#85A9FA] font-mono bg-[#171923] px-2 py-0.5 rounded border border-[#292B38]">
                leads/[País]/[Categoria]/[NomeEmpresa]
              </code>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="btn-forgeon-secondary h-10 px-4 text-xs font-sans cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#85A9FA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              {copied ? 'Copiado!' : 'Copiar Script'}
            </button>

            <button
              onClick={handleDownload}
              className="btn-forgeon-primary h-10 px-5 text-xs uppercase cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Baixar recon_maps.py
            </button>
          </div>
        </div>

        {/* Quick CLI command instructions */}
        <div className="pt-3 border-t border-[#292B38] space-y-2">
          <span className="text-[11px] font-semibold text-[#F4F4F7] uppercase tracking-wider font-mono">
            Comandos de Execução Local:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#08090D] border border-[#292B38] rounded-xl text-[#F4F4F7]">
              <span className="text-[#6C6F82]"># Instalar Playwright:</span>
              <p className="text-[#F4F4F7] font-semibold mt-1">pip install playwright && playwright install chromium</p>
            </div>
            <div className="p-3 bg-[#08090D] border border-[#292B38] rounded-xl text-[#F4F4F7]">
              <span className="text-[#6C6F82]"># Rodar com divisão hierárquica automática:</span>
              <p className="text-[#85A9FA] font-semibold mt-1">python recon_maps.py "Bar Pinheiros" --max-leads 10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl overflow-hidden">
        <div className="bg-[#171923] px-5 py-3 border-b border-[#292B38] flex items-center justify-between text-xs font-mono">
          <span className="text-[#F4F4F7]">recon_maps.py (Python 3.10+)</span>
          <span className="text-[#6C6F82]">UTF-8</span>
        </div>
        <pre className="p-6 font-mono text-xs leading-relaxed text-[#F4F4F7] bg-[#08090D] overflow-x-auto max-h-[600px] overflow-y-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
