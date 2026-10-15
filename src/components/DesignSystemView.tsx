import React from 'react';
import { ForgeonLogo } from './ForgeonLogo';

export const DesignSystemView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Intro Header */}
      <div className="bg-[#101118] border border-[#292B38] rounded-3xl p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#85A9FA] font-bold text-sm tracking-wider uppercase font-mono">
                Especificação Oficial
              </span>
              <span className="text-[#6C6F82]">·</span>
              <span className="text-xs text-[#A3A6B5]">Versão 2.0</span>
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-[#F4F4F7] mt-1">
              Forgeon — Design System V2
            </h2>
            <p className="text-base text-[#A3A6B5] mt-2 max-w-2xl leading-relaxed">
              Tokens consolidados, contraste WCAG AA aprovado, superfícies simplificadas e paleta oficial extraída do símbolo vetorial.
            </p>
          </div>

          <div className="p-4 bg-[#171923] border border-[#292B38] rounded-2xl shrink-0 flex items-center justify-center">
            <ForgeonLogo size={52} />
          </div>
        </div>
      </div>

      {/* O que foi corrigido na V2 */}
      <div className="space-y-4">
        <h3 className="text-xl font-heading font-bold text-[#F4F4F7]">
          O que foi consolidado na V2
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 space-y-2">
            <h4 className="font-heading font-bold text-[#F4F4F7] text-base">
              Superfícies: 12 tons viraram 3
            </h4>
            <p className="text-sm text-[#A3A6B5] leading-relaxed">
              <strong className="text-[#F4F4F7]">Void (#08090D)</strong>, <strong className="text-[#F4F4F7]">Surface 1 (#101118)</strong>, <strong className="text-[#F4F4F7]">2 (#171923)</strong> e <strong className="text-[#F4F4F7]">3 (#1F2230)</strong> unificaram a hierarquia de profundidade em toda a aplicação.
            </p>
          </div>

          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 space-y-2">
            <h4 className="font-heading font-bold text-[#F4F4F7] text-base">
              Cores extraídas da logo real
            </h4>
            <p className="text-sm text-[#A3A6B5] leading-relaxed">
              A paleta vem do símbolo oficial: ultramarine (<span className="text-[#85A9FA] font-mono">#4128FB</span>), azul (<span className="text-[#85A9FA] font-mono">#454DFC</span>), violeta (<span className="text-[#9070F7] font-mono">#9070F7</span>) e periwinkle (<span className="text-[#85A9FA] font-mono">#85A9FA</span>, contraste 8:1 para texto e foco).
            </p>
          </div>

          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 space-y-2">
            <h4 className="font-heading font-bold text-[#F4F4F7] text-base">
              Bordas funcionais
            </h4>
            <p className="text-sm text-[#A3A6B5] leading-relaxed">
              Novo token <strong className="text-[#F4F4F7]">Line Strong (#6C6F82)</strong> com 3.7:1 de contraste para contornos nítidos e <strong className="text-[#F4F4F7]">Line Default (#292B38)</strong> para divisores estruturais.
            </p>
          </div>

          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 space-y-2">
            <h4 className="font-heading font-bold text-[#F4F4F7] text-base">
              Raios, Glow e Movimento
            </h4>
            <p className="text-sm text-[#A3A6B5] leading-relaxed">
              Raios sistemáticos (8, 16, 24 e pill 999px), elevação com Glow 1 em repouso e Glow 2 em hover, easing cúbico suave e respeito a <code className="text-[#85A9FA]">prefers-reduced-motion</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Galeria de Logos Oficiais */}
      <div className="space-y-4">
        <h3 className="text-xl font-heading font-bold text-[#F4F4F7]">
          Identidade e Logotipos Oficiais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="h-32 flex items-center justify-center bg-[#171923] rounded-xl">
              <ForgeonLogo size={56} variant="color" />
            </div>
            <div>
              <b className="block text-[#F4F4F7] text-sm font-heading">Símbolo colorido</b>
              <span className="text-xs text-[#A3A6B5]">Versão principal da marca.</span>
            </div>
          </div>

          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="h-32 flex items-center justify-center bg-[#171923] rounded-xl">
              <ForgeonLogo size={56} variant="white" />
            </div>
            <div>
              <b className="block text-[#F4F4F7] text-sm font-heading">Símbolo branco</b>
              <span className="text-xs text-[#A3A6B5]">Uso em fundos de alto contraste.</span>
            </div>
          </div>

          <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-5 flex flex-col justify-between space-y-3 md:col-span-2">
            <div className="h-32 flex items-center justify-center bg-[#171923] rounded-xl px-6">
              <ForgeonLogo variant="horizontal" size={32} />
            </div>
            <div>
              <b className="block text-[#F4F4F7] text-sm font-heading">Logotipo horizontal</b>
              <span className="text-xs text-[#A3A6B5]">Cabeçalhos, rodapés e navegação.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Swatches de Cores */}
      <div className="space-y-4">
        <h3 className="text-xl font-heading font-bold text-[#F4F4F7]">
          Paleta de Cores e Gradientes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-xs">
          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#08090D] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Surface / Void</b>
              <span className="text-[#A3A6B5] font-mono">#08090D</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#101118] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Surface / 1</b>
              <span className="text-[#A3A6B5] font-mono">#101118</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#171923] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Surface / 2</b>
              <span className="text-[#A3A6B5] font-mono">#171923</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#1F2230] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Surface / 3</b>
              <span className="text-[#A3A6B5] font-mono">#1F2230</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#6C6F82] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Line / Strong</b>
              <span className="text-[#A3A6B5] font-mono">#6C6F82 3.7:1</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#85A9FA] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Brand / Periwinkle</b>
              <span className="text-[#A3A6B5] font-mono">#85A9FA 8:1</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#4128FB] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Brand / Ultramarine</b>
              <span className="text-[#A3A6B5] font-mono">#4128FB</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#454DFC] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Brand / Blue</b>
              <span className="text-[#A3A6B5] font-mono">#454DFC</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div className="h-14 bg-[#9070F7] border-b border-[#292B38]" />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Brand / Violet</b>
              <span className="text-[#A3A6B5] font-mono">#9070F7</span>
            </div>
          </div>

          <div className="border border-[#292B38] rounded-xl overflow-hidden bg-[#171923]">
            <div
              className="h-14 border-b border-[#292B38]"
              style={{ background: 'linear-gradient(135deg,#4128FB,#454DFC)' }}
            />
            <div className="p-3">
              <b className="block text-[#F4F4F7]">Gradient / Action</b>
              <span className="text-[#A3A6B5] font-mono">6:1+ contrast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tipografia */}
      <div className="space-y-4">
        <h3 className="text-xl font-heading font-bold text-[#F4F4F7]">
          Escala Tipográfica Oficial
        </h3>
        <div className="bg-[#101118] border border-[#292B38] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-[#F4F4F7]">
            <thead className="bg-[#171923] text-[#A3A6B5] text-[11px] uppercase tracking-wider border-b border-[#292B38]">
              <tr>
                <th className="px-5 py-3">Estilo</th>
                <th className="px-5 py-3">Tamanho</th>
                <th className="px-5 py-3">Família / Peso</th>
                <th className="px-5 py-3">Aplicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292B38]">
              <tr>
                <td className="px-5 py-3 font-heading font-bold text-base">Display</td>
                <td className="px-5 py-3 font-mono">40–84 fluido</td>
                <td className="px-5 py-3">Montserrat 800</td>
                <td className="px-5 py-3 text-[#A3A6B5]">Hero e títulos principais</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-heading font-bold text-sm">Heading L</td>
                <td className="px-5 py-3 font-mono">30–48 fluido</td>
                <td className="px-5 py-3">Montserrat 700</td>
                <td className="px-5 py-3 text-[#A3A6B5]">Títulos de seções e modais</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-heading font-semibold text-xs">Heading M</td>
                <td className="px-5 py-3 font-mono">20–24px</td>
                <td className="px-5 py-3">Montserrat 600</td>
                <td className="px-5 py-3 text-[#A3A6B5]">Cards e blocos secundários</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-sans">Body L / M</td>
                <td className="px-5 py-3 font-mono">16–19px</td>
                <td className="px-5 py-3">Space Grotesk 400/500</td>
                <td className="px-5 py-3 text-[#A3A6B5]">Texto corrido (máximo 56ch)</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-sans font-semibold text-[#85A9FA]">Label</td>
                <td className="px-5 py-3 font-mono">14–15px</td>
                <td className="px-5 py-3">Space Grotesk 600</td>
                <td className="px-5 py-3 text-[#A3A6B5]">Links, botões e navegação</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
