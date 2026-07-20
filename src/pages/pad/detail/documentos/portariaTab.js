/**
 * Aba "Portaria" — data de instauração, Diretor(a) signatário e a
 * composição do Conselho Disciplinar (designada aqui; a aba "Conselho"
 * só preenche a manifestação depois, lendo essa mesma composição). Todos os
 * três pré-preenchidos a partir de `configuracoesUnidade` na primeira vez.
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarBlocoPessoa, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad, criarBotaoConfirmar, paraValorInputDate } from './_shared.js';
import { renderizar as renderizarPortaria } from '../../../../templates/portariaAberturaTemplate.js';

/**
 * Rascunho de "Descrição dos fatos" a partir do que já foi extraído do PDF
 * do Registro de Infração na criação do PAD (tipificação, detentos/agentes
 * envolvidos, descrição) — o formulário de criação não pede uma narrativa
 * livre (só os 8 campos objetivos, ver src/parser/README.md), então sem
 * isto o campo nasceria em branco mesmo já havendo dado extraído
 * aproveitável. Sempre editável; só é usado quando ainda não há
 * `descricaoFatos` salvo manualmente.
 */
function sugerirDescricaoFatos(pad) {
  const infracao = pad.infracao ?? {};
  if (!infracao.tipificacao) return '';

  const partes = [`Consta que o(a) interno(a) praticou a seguinte conduta: ${infracao.tipificacao}.`];
  if (infracao.detentosEnvolvidos?.length) partes.push(`Detento(s) envolvido(s): ${infracao.detentosEnvolvidos.join(', ')}.`);
  if (infracao.agentesEnvolvidos?.length) partes.push(`Agente(s) envolvido(s): ${infracao.agentesEnvolvidos.join(', ')}.`);
  if (infracao.descricao) partes.push(infracao.descricao);
  return partes.join(' ');
}

export function renderPortariaTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const portariaAtual = pad.portaria ?? {};
  const diretorAtual = portariaAtual.autoridadeSignataria ?? configUnidade?.diretor ?? {};
  const conselhoAtual = pad.conselho?.integrantes ?? configUnidade?.conselho ?? {};

  const campoData = criarCampo({ rotulo: 'Data de instauração', tipo: 'date', valor: paraValorInputDate(portariaAtual.dataAssinatura) });
  const campoDescricaoFatos = criarCampo({
    rotulo: 'Descrição dos fatos',
    multilinha: true,
    valor: pad.infracao?.descricaoFatos || sugerirDescricaoFatos(pad),
  });

  const blocoDiretor = criarBlocoPessoa('Diretor(a) da Unidade', { nome: diretorAtual.nome, matricula: null }, { comMatricula: false });
  const campoCargoDiretor = criarCampo({ rotulo: 'Cargo', valor: diretorAtual.cargo || 'Diretor(a)' });
  blocoDiretor.elemento.append(campoCargoDiretor.elemento);

  const blocoPresidente = criarBlocoPessoa('Presidente do Conselho', conselhoAtual.presidente);
  const blocoMembro1 = criarBlocoPessoa('Membro 1 do Conselho', conselhoAtual.membro1);
  const blocoMembro2 = criarBlocoPessoa('Membro 2 do Conselho', conselhoAtual.membro2);

  function lerFormulario() {
    return {
      dataAssinatura: campoData.input.value ? new Date(`${campoData.input.value}T00:00:00`) : null,
      autoridadeSignataria: { nome: blocoDiretor.campoNome.input.value.trim(), cargo: campoCargoDiretor.input.value.trim() },
      descricaoFatos: campoDescricaoFatos.input.value.trim(),
      conselho: {
        presidente: { nome: blocoPresidente.campoNome.input.value.trim(), matricula: blocoPresidente.campoMatricula.input.value.trim() },
        membro1: { nome: blocoMembro1.campoNome.input.value.trim(), matricula: blocoMembro1.campoMatricula.input.value.trim() },
        membro2: { nome: blocoMembro2.campoNome.input.value.trim(), matricula: blocoMembro2.campoMatricula.input.value.trim() },
      },
    };
  }

  function padComFormulario() {
    const dados = lerFormulario();
    return {
      ...pad,
      portaria: { dataAssinatura: dados.dataAssinatura, autoridadeSignataria: dados.autoridadeSignataria },
      infracao: { ...pad.infracao, descricaoFatos: dados.descricaoFatos },
      conselho: { ...pad.conselho, integrantes: dados.conselho },
    };
  }

  const preview = criarAreaPreview(pad, () => renderizarPortaria(padComFormulario()));

  [campoData, campoDescricaoFatos].forEach((campo) => campo.input.addEventListener('input', preview.atualizar));
  [blocoDiretor, blocoPresidente, blocoMembro1, blocoMembro2].forEach((bloco) => {
    bloco.campoNome.input.addEventListener('input', preview.atualizar);
    bloco.campoMatricula?.input.addEventListener('input', preview.atualizar);
  });
  campoCargoDiretor.input.addEventListener('input', preview.atualizar);

  const secao = criarCardEditavel({
    titulo: 'Portaria de Instauração',
    corpo: [
      criarElemento('div', { class: 'documentos__campos' }, [campoData.elemento, campoDescricaoFatos.elemento]),
      blocoDiretor.elemento,
      criarElemento('div', { class: 'documentos__conselho' }, [blocoPresidente.elemento, blocoMembro1.elemento, blocoMembro2.elemento]),
    ],
  });
  secao.elemento.querySelector('.card__acoes')?.append(criarBotaoConfirmar(pad, 'portaria', { onAtualizar }));

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      const dados = lerFormulario();
      await salvarSecaoDoPad(
        pad,
        {
          portaria: { dataAssinatura: dados.dataAssinatura, autoridadeSignataria: dados.autoridadeSignataria },
          infracao: { ...pad.infracao, descricaoFatos: dados.descricaoFatos },
          conselho: { ...pad.conselho, integrantes: dados.conselho },
        },
        { etapa: 'PORTARIA_ABERTURA', jaTinhaEtapa: Boolean(pad.portaria?.dataAssinatura), chaveConfirmacao: 'portaria' },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
